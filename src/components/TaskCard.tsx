import { forwardRef } from "react";
import { Sparkles, Sparkle, Camera, AlertCircle, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PointsBadge } from "./PointsBadge";
import { motion } from "motion/react";
import * as Icons from "lucide-react";

interface TaskCardProps {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points: number;
  dueDate?: string;
  status: "pending" | "completed" | "verified" | "rejected";
  requiresPhoto?: boolean;
  photoUrl?: string;
  category?: string;
  difficulty?: string;
  onComplete?: (id: string) => void;
  onPhotoUpload?: (id: string) => void;
  isChild?: boolean;
}

const difficultyColors = {
  beginner: "bg-secondary/20 text-secondary border-secondary/30",
  intermediate: "bg-warning/20 text-warning border-warning/30",
  advanced: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusColors = {
  pending: "border-l-primary",
  completed: "border-l-warning",
  verified: "border-l-success",
  rejected: "border-l-destructive",
};

const getUrgency = (dueDate?: string) => {
  if (!dueDate) return "normal";
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 2) return "soon";
  return "normal";
};

const urgencyStyles = {
  overdue: "bg-destructive/5 ring-1 ring-destructive/20",
  today: "bg-warning/5 ring-1 ring-warning/20",
  soon: "bg-accent/10",
  normal: "",
};

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard({
  id,
  name,
  description,
  icon = "sparkles",
  points,
  dueDate,
  status,
  requiresPhoto,
  photoUrl,
  category,
  difficulty = "beginner",
  onComplete,
  onPhotoUpload,
  isChild = false,
}, ref) {
  const urgency = getUrgency(dueDate);
  const IconComponent = (Icons as any)[icon.charAt(0).toUpperCase() + icon.slice(1)] || Icons.Sparkles;
  
  const handleComplete = () => {
    if (requiresPhoto && onPhotoUpload) {
      onPhotoUpload(id);
    } else if (onComplete) {
      onComplete(id);
    }
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border-l-4 bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover",
        statusColors[status],
        urgencyStyles[urgency]
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          status === "verified" ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
        )}>
          <IconComponent size={24} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {name}
              </h3>
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            <PointsBadge points={points} size="sm" />
          </div>

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {difficulty && (
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                difficultyColors[difficulty as keyof typeof difficultyColors]
              )}>
                {difficulty}
              </span>
            )}
            {category && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                {category.replace('_', ' ')}
              </span>
            )}
            {requiresPhoto && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs",
                photoUrl ? "text-success" : "text-muted-foreground"
              )}>
                {photoUrl ? <Image size={12} /> : <Camera size={12} />}
                {photoUrl ? "Photo attached" : "Photo required"}
              </span>
            )}
            {dueDate && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs",
                urgency === "overdue" ? "text-destructive" :
                urgency === "today" ? "text-warning" : "text-muted-foreground"
              )}>
                {urgency === "overdue" && <AlertCircle size={12} />}
                {urgency !== "overdue" && <Sparkle size={12} />}
                {urgency === "overdue" ? "Overdue" :
                 urgency === "today" ? "Due today" :
                 new Date(dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Photo preview if attached */}
          {photoUrl && status !== "pending" && (
            <div className="mt-3">
              <img 
                src={photoUrl} 
                alt="Task proof" 
                className="h-20 w-20 rounded-lg object-cover ring-2 ring-muted"
              />
            </div>
          )}

          {/* Actions */}
          {isChild && status === "pending" && (onComplete || onPhotoUpload) && (
            <div className="mt-4">
              <Button
                variant="childAction"
                size="lg"
                className="w-full"
                onClick={handleComplete}
              >
                {requiresPhoto ? (
                  <>
                    <Camera size={20} />
                    Complete with Photo
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Complete Task
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status overlay for completed/verified */}
      {status === "verified" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-6 -top-6 h-20 w-20 rotate-45 bg-success/10"
        />
      )}
    </motion.div>
  );
});
