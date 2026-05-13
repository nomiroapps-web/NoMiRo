import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ChildAvatarProps {
  avatarIndex?: number;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  selected?: boolean;
  onClick?: () => void;
  showLevel?: boolean;
  level?: number;
  className?: string;
}

const avatarColors = [
  { bg: "from-primary to-info", emoji: "🦊" },
  { bg: "from-secondary to-success", emoji: "🐸" },
  { bg: "from-warning to-points", emoji: "🦁" },
  { bg: "from-destructive to-warning", emoji: "🐼" },
  { bg: "from-info to-secondary", emoji: "🐨" },
  { bg: "from-success to-primary", emoji: "🦄" },
  { bg: "from-points to-warning", emoji: "🐯" },
  { bg: "from-primary to-secondary", emoji: "🐰" },
  { bg: "from-warning to-destructive", emoji: "🦋" },
  { bg: "from-secondary to-info", emoji: "🐢" },
];

const sizeClasses = {
  xs: "h-6 w-6 text-sm",
  sm: "h-10 w-10 text-lg",
  md: "h-14 w-14 text-2xl",
  lg: "h-20 w-20 text-4xl",
  xl: "h-28 w-28 text-5xl",
};

export function ChildAvatar({
  avatarIndex = 1,
  name,
  size = "md",
  selected,
  onClick,
  showLevel,
  level = 1,
  className,
}: ChildAvatarProps) {
  const avatar = avatarColors[(avatarIndex - 1) % avatarColors.length];
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-lg",
        avatar.bg,
        sizeClasses[size],
        onClick && "cursor-pointer transition-transform hover:scale-105",
        selected && "ring-4 ring-primary ring-offset-2",
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      <span className="drop-shadow-md">{avatar.emoji}</span>
      
      {/* Level badge */}
      {showLevel && level && (
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
          {level}
        </div>
      )}

      {/* Name label */}
      {name && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-foreground">
          {name}
        </span>
      )}
    </Component>
  );
}

// Avatar selector grid for profile creation
export function AvatarSelector({
  selectedIndex,
  onSelect,
}: {
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {avatarColors.map((_, index) => (
        <ChildAvatar
          key={index}
          avatarIndex={index + 1}
          size="md"
          selected={selectedIndex === index + 1}
          onClick={() => onSelect(index + 1)}
        />
      ))}
    </div>
  );
}
