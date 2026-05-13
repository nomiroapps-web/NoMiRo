import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Check, CheckCheck, Trash2, Star, Sparkle, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  icon: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  task_assigned: <Sparkle size={16} />,
  task_completed: <Check size={16} />,
  task_verified: <CheckCheck size={16} />,
  reward_requested: <Star size={16} />,
  reward_approved: <Star size={16} />,
  points_earned: <Zap size={16} />,
  achievement_unlocked: <Wand2 size={16} />,
};

const typeColors: Record<string, string> = {
  task_assigned: "bg-primary/20 text-primary",
  task_completed: "bg-warning/20 text-warning",
  task_verified: "bg-success/20 text-success",
  task_rejected: "bg-destructive/20 text-destructive",
  reward_requested: "bg-points/20 text-points",
  reward_approved: "bg-success/20 text-success",
  reward_denied: "bg-destructive/20 text-destructive",
  points_earned: "bg-points/20 text-points",
  achievement_unlocked: "bg-warning/20 text-warning",
  reminder: "bg-info/20 text-info",
};

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase.from("notifications").delete().eq("id", notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const clearAll = async () => {
    await supabase.from("notifications").delete().eq("user_id", userId);
    setNotifications([]);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Sparkles size={20} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-display font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="iconSm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "group relative flex gap-3 border-b p-3 transition-colors hover:bg-muted/50",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      typeColors[notification.type] || "bg-muted text-muted-foreground"
                    )}
                  >
                    {typeIcons[notification.type] || <Sparkles size={16} />}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          !notification.is_read && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="iconSm"
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X size={14} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to create notifications (also triggers push if available)
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedTaskId,
  relatedRewardId,
  relatedChildId,
  sendPush = false,
}: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  relatedTaskId?: string;
  relatedRewardId?: string;
  relatedChildId?: string;
  sendPush?: boolean;
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: type as any,
    title,
    message,
    related_task_id: relatedTaskId,
    related_reward_id: relatedRewardId,
    related_child_id: relatedChildId,
  });

  if (error) {
    console.error("Error creating notification:", error);
  }

  // Optionally trigger push notification
  if (sendPush && message) {
    try {
      await supabase.functions.invoke("send-push-notification", {
        body: {
          userId,
          title,
          body: message,
          url: "/parent",
        },
      });
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
    }
  }
}
