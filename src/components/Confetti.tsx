import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const colors = [
  "bg-primary",
  "bg-secondary", 
  "bg-points",
  "bg-warning",
  "bg-info",
  "bg-success",
];

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 20 + 40,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 6,
    delay: Math.random() * 0.3,
  }));
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setPieces(generateConfetti(50));
      setShow(true);
      
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className={cn("absolute rounded-sm", piece.color)}
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                width: piece.size,
                height: piece.size,
              }}
              initial={{
                y: 0,
                x: 0,
                rotate: 0,
                opacity: 1,
                scale: 0,
              }}
              animate={{
                y: [0, -200, 400],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, piece.rotation * 2],
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: piece.delay,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Celebration overlay with message
export function CelebrationOverlay({ 
  show, 
  points, 
  message = "Task Complete!",
  onClose 
}: { 
  show: boolean;
  points: number;
  message?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <Confetti trigger={show} />
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="flex flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-2xl"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <motion.div
                className="text-6xl"
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
              >
                🎉
              </motion.div>
              <h2 className="font-display text-3xl font-bold text-foreground">
                {message}
              </h2>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-points to-warning px-6 py-3 text-2xl font-bold text-points-foreground shadow-glow-points"
              >
                +{points} points!
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
