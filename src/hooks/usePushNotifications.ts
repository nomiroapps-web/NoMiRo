import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/db";

// VAPID public key - this is safe to expose (it's the public key)
// Generate your own at: https://vapidkeys.com or run: npx web-push generate-vapid-keys
// Then add as VITE_VAPID_PUBLIC_KEY in your environment or replace the fallback below
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);

        try {
          // Register service worker
          const reg = await navigator.serviceWorker.register("/sw.js");
          setRegistration(reg);

          // Check if already subscribed
          const subscription = await (reg as any).pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error("Service worker registration failed:", err);
        }
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  const subscribe = useCallback(async () => {
    if (!registration || !VAPID_PUBLIC_KEY) {
      console.error("Registration or VAPID key not available");
      return false;
    }

    try {
      setIsLoading(true);

      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        console.log("Notification permission denied");
        setIsLoading(false);
        return false;
      }

      // Subscribe to push notifications
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionJson = subscription.toJSON();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        setIsLoading(false);
        return false;
      }

      // Save subscription to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        },
        {
          onConflict: "user_id,endpoint",
        }
      );

      if (error) {
        console.error("Error saving subscription:", error);
        setIsLoading(false);
        return false;
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Error subscribing to push:", err);
      setIsLoading(false);
      return false;
    }
  }, [registration]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return false;

    try {
      setIsLoading(true);

      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Remove subscription from database
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Error unsubscribing from push:", err);
      setIsLoading(false);
      return false;
    }
  }, [registration]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}
