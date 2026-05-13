import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if user hasn't dismissed it
      const dismissed = localStorage.getItem("nomiro-install-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("nomiro-install-dismissed", "true");
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // For iOS, show manual instructions
  if (isIOS && !deferredPrompt) {
    const dismissed = localStorage.getItem("nomiro-install-dismissed");
    if (dismissed) return null;

    return (
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border bg-card p-4 shadow-lg md:left-auto md:right-4 md:w-80"
          >
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Install NoMiRo</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap the share button, then "Add to Home Screen" to install.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // For Android/Chrome with install prompt
  if (!deferredPrompt || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border bg-card p-4 shadow-lg md:left-auto md:right-4 md:w-80"
      >
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Install NoMiRo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add to your home screen for quick access!
            </p>
            <Button onClick={handleInstall} size="sm" className="mt-3 w-full">
              <Download size={16} />
              Install App
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
