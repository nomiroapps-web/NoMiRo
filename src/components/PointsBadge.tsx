import { forwardRef } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-7 px-2.5 text-sm gap-1",
  md: "h-9 px-3.5 text-base gap-1.5",
  lg: "h-12 px-5 text-xl gap-2",
};

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 24,
};

export const PointsBadge = forwardRef<HTMLDivElement, PointsBadgeProps>(function PointsBadge({ 
  points, 
  size = "md", 
  animated = false,
  className 
}, ref) {
  const Component = animated ? motion.div : "div";
  
  return (
    <Component
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-to-r from-points to-warning font-bold text-points-foreground shadow-md",
        sizeClasses[size],
        animated && "shadow-glow-points",
        className
      )}
      {...(animated ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring", stiffness: 300, damping: 20 }
      } : {})}
    >
      <Sparkles size={iconSizes[size]} className="drop-shadow-sm" />
      <span className="tabular-nums">{points.toLocaleString()}</span>
    </Component>
  );
});
