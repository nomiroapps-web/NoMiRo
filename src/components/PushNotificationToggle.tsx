import { Bell, BellOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export function PushNotificationToggle() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <Label className="text-sm font-medium">Push Notifications</Label>
          <p className="text-xs text-muted-foreground">
            Not supported in this browser
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Push notifications disabled");
      } else {
        toast.error("Failed to disable push notifications");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Push notifications enabled!");
      } else if (permission === "denied") {
        toast.error("Please enable notifications in your browser settings");
      } else {
        toast.error("Failed to enable push notifications");
      }
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      {isSubscribed ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
      <div className="flex-1">
        <Label htmlFor="push-notifications" className="text-sm font-medium">
          Push Notifications
        </Label>
        <p className="text-xs text-muted-foreground">
          {isSubscribed
            ? "Receive alerts even when the app is closed"
            : "Get notified about tasks and rewards"}
        </p>
      </div>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          id="push-notifications"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={permission === "denied"}
        />
      )}
    </div>
  );
}
