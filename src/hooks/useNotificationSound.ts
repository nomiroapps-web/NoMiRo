import { useCallback, useEffect, useState } from "react";

const NOTIFICATION_SOUND_KEY = "nomiro-notification-sound";

export function useNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SOUND_KEY, JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      // Use the Web Notifications API to trigger the system's default notification sound
      if ("Notification" in window && Notification.permission === "granted") {
        // Create a silent notification that triggers the OS sound
        const notification = new Notification("NoMiRo", {
          body: "New notification",
          silent: false, // This tells the browser to use the OS default sound
          tag: "nomiro-notification", // Prevents duplicate notifications
        });
        // Auto-close after a short time
        setTimeout(() => notification.close(), 100);
      } else if ("Notification" in window && Notification.permission !== "denied") {
        // Request permission if not yet granted
        Notification.requestPermission();
      }
    } catch {
      // Silently fail if notifications aren't supported
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }, []);

  return {
    soundEnabled,
    setSoundEnabled,
    toggleSound,
    playNotificationSound,
    requestPermission,
  };
}
