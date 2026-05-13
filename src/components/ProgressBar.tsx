import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "points" | "success";
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-2",
  md: "h-3",
  lg: "h-5",
};

const variantClasses = {
  primary: "bg-gradient-to-r from-primary to-info",
  secondary: "bg-gradient-to-r from-secondary to-success",
  points: "bg-gradient-to-r from-points to-warning",
  success: "bg-gradient-to-r from-success to-secondary",
};

export function ProgressBar({
  value,
  max,
  label,
  showValue = false,
  size = "md",
  variant = "primary",
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-muted-foreground">
              {value.toLocaleString()} / {max.toLocaleString()}
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        sizeClasses[size]
      )}>
        <motion.div
          className={cn(
            "h-full rounded-full shadow-sm",
            variantClasses[variant]
          )}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { 
            duration: 0.8, 
            ease: "easeOut",
            delay: 0.2 
          } : undefined}
        />
      </div>
    </div>
  );
}

// Level progress specifically for child dashboard
export function LevelProgress({
  currentPoints,
  level,
  className,
}: {
  currentPoints: number;
  level: number;
  className?: string;
}) {
  // Points needed per level increases
  const pointsPerLevel = level * 100;
  const pointsInCurrentLevel = currentPoints % pointsPerLevel;
  const levelNames = ["Newcomer", "Helper", "Contributor", "Expert", "Household Hero"];
  const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)];
  
  return (
    <div className={cn("rounded-xl bg-card p-4 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-muted-foreground">Level {level}</span>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {levelName}
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-points to-warning text-2xl font-bold text-points-foreground shadow-glow-points">
          {level}
        </div>
      </div>
      
      <div className="mt-3">
        <ProgressBar
          value={pointsInCurrentLevel}
          max={pointsPerLevel}
          showValue
          variant="points"
          size="lg"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {pointsPerLevel - pointsInCurrentLevel} points to next level
        </p>
      </div>
    </div>
  );
}
