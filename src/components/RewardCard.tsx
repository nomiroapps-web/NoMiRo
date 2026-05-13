import { forwardRef } from "react";
import { Star, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PointsBadge } from "./PointsBadge";
import { motion } from "motion/react";
import * as Icons from "lucide-react";

interface RewardCardProps {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  pointsCost: number;
  category?: string;
  currentPoints?: number;
  onRedeem?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  screen_time: "from-info to-primary",
  privileges: "from-secondary to-success",
  toys: "from-warning to-points",
  outings: "from-primary to-secondary",
  treats: "from-points to-warning",
  money: "from-success to-secondary",
  other: "from-muted to-muted-foreground",
};

export const RewardCard = forwardRef<HTMLDivElement, RewardCardProps>(function RewardCard({
  id,
  name,
  description,
  icon = "gift",
  imageUrl,
  pointsCost,
  category = "other",
  currentPoints = 0,
  onRedeem,
}, ref) {
  const canAfford = currentPoints >= pointsCost;
  const IconComponent = (Icons as any)[icon.charAt(0).toUpperCase() + icon.slice(1)] || Icons.Gift;
  const gradientClass = categoryColors[category] || categoryColors.other;
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card shadow-card transition-all hover:shadow-card-hover",
        !canAfford && "opacity-75"
      )}
    >
      {/* Image/Icon Header */}
      <div className={cn(
        "relative h-32 w-full bg-gradient-to-br p-4",
        gradientClass
      )}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <IconComponent size={48} className="text-white/80" />
          </div>
        )}
        
        {/* Price badge */}
        <div className="absolute right-3 top-3">
          <PointsBadge points={pointsCost} size="md" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {name}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        
        {category && (
          <span className="mt-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
            {category.replace('_', ' ')}
          </span>
        )}

        {/* Redeem button */}
        {onRedeem && (
          <div className="mt-4">
            <Button
              variant={canAfford ? "points" : "outline"}
              size="default"
              className="w-full"
              disabled={!canAfford}
              onClick={() => onRedeem(id)}
            >
              <Sparkle size={18} />
              {canAfford ? "Redeem" : `Need ${pointsCost - currentPoints} more`}
            </Button>
          </div>
        )}
      </div>

      {/* Hover effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
});
