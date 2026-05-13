import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Share, Plus, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-2xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="font-display text-3xl font-bold">Install NoMiRo</h1>
          <p className="mt-2 text-muted-foreground">
            Add NoMiRo to your home screen for quick access
          </p>
        </motion.div>

        {isInstalled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-success/50 bg-success/5">
              <CardContent className="flex flex-col items-center py-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={32} />
                </div>
                <h2 className="text-xl font-semibold">Already Installed!</h2>
                <p className="mt-2 text-center text-muted-foreground">
                  NoMiRo is already on your device. Open it from your home screen.
                </p>
                <Button onClick={() => navigate("/auth")} className="mt-6">
                  Open App
                  <ArrowRight size={18} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Direct Install Button (Chrome/Edge) */}
            {deferredPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download size={20} />
                      One-Tap Install
                    </CardTitle>
                    <CardDescription>
                      Install directly to your device
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleInstall}
                      disabled={installing}
                      size="lg"
                      className="w-full"
                    >
                      {installing ? "Installing..." : "Install NoMiRo"}
                      <Download size={18} />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* iOS Instructions */}
            {isIOS && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone size={20} />
                      Install on iPhone/iPad
                    </CardTitle>
                    <CardDescription>
                      Follow these steps to add NoMiRo to your home screen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Tap the Share button</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Look for <Share size={14} /> at the bottom of Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Look for <Plus size={14} /> Add to Home Screen
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Tap "Add" to confirm</p>
                        <p className="text-sm text-muted-foreground">
                          NoMiRo will appear on your home screen!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Android Instructions (fallback if no prompt) */}
            {isAndroid && !deferredPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone size={20} />
                      Install on Android
                    </CardTitle>
                    <CardDescription>
                      Add NoMiRo to your home screen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Tap the menu button (⋮)</p>
                        <p className="text-sm text-muted-foreground">
                          In the top right corner of Chrome
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                        <p className="text-sm text-muted-foreground">
                          This option appears in the menu
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Confirm the installation</p>
                        <p className="text-sm text-muted-foreground">
                          NoMiRo will be added to your home screen!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-muted/30">
                <CardContent className="py-6">
                  <h3 className="font-semibold mb-4">Why Install?</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 text-success" />
                      <span>Quick access from your home screen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 text-success" />
                      <span>Works offline for viewing tasks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 text-success" />
                      <span>Push notifications for task updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 text-success" />
                      <span>Full-screen experience, no browser UI</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Continue without installing */}
            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Continue in browser instead
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
