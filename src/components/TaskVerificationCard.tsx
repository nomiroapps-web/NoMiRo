import { useState } from "react";
import { Sparkles, X, Camera, Sparkle, User, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PointsBadge } from "./PointsBadge";
import { ChildAvatar } from "./ChildAvatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";

interface TaskVerificationCardProps {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points: number;
  completedAt?: string;
  photoUrl?: string;
  category?: string;
  difficulty?: string;
  childName: string;
  childAvatarIndex: number;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isProcessing?: boolean;
}

const difficultyColors = {
  beginner: "bg-secondary/20 text-secondary border-secondary/30",
  intermediate: "bg-warning/20 text-warning border-warning/30",
  advanced: "bg-destructive/20 text-destructive border-destructive/30",
};

export function TaskVerificationCard({
  id,
  name,
  description,
  icon = "sparkles",
  points,
  completedAt,
  photoUrl,
  category,
  difficulty = "beginner",
  childName,
  childAvatarIndex,
  onApprove,
  onReject,
  isProcessing = false,
}: TaskVerificationCardProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  
  const IconComponent = (Icons as any)[icon.charAt(0).toUpperCase() + icon.slice(1)] || Icons.Sparkles;

  const handleReject = () => {
    if (showRejectReason) {
      onReject(id, rejectReason);
      setShowRejectReason(false);
      setRejectReason("");
    } else {
      setShowRejectReason(true);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border-l-4 border-l-warning bg-card p-4 shadow-card"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Photo Preview */}
          {photoUrl && (
            <div 
              className="group relative h-32 w-32 shrink-0 cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setShowPhotoPreview(true)}
            >
              <img 
                src={photoUrl} 
                alt="Task proof" 
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
                  <IconComponent size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {name}
                  </h3>
                  {description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              <PointsBadge points={points} size="sm" />
            </div>

            {/* Child Info & Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <ChildAvatar avatarIndex={childAvatarIndex} size="xs" />
                <span className="text-sm font-medium">{childName}</span>
              </div>
              
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

              {completedAt && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkle size={12} />
                  {formatDate(completedAt)}
                </span>
              )}

              {photoUrl && (
                <span className="inline-flex items-center gap-1 text-xs text-success">
                  <Camera size={12} />
                  Photo attached
                </span>
              )}
            </div>

            {/* Reject Reason Input */}
            <AnimatePresence>
              {showRejectReason && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <Textarea
                    placeholder="Why are you rejecting this task? (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {showRejectReason ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowRejectReason(false);
                      setRejectReason("");
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    <X size={16} />
                    Confirm Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onApprove(id)}
                    disabled={isProcessing}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    <Sparkles size={16} />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <X size={16} />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Photo Preview Dialog */}
      <Dialog open={showPhotoPreview} onOpenChange={setShowPhotoPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Task Photo - {name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {photoUrl && (
              <img 
                src={photoUrl} 
                alt="Task proof full size" 
                className="max-h-[70vh] rounded-lg object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
