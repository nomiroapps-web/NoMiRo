import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/db";
import { isLocalMode } from "@/lib/backend-config";
import { oauthHelper } from "@/integrations/lovable/index";
import { motion } from "motion/react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendMessage, setShowResendMessage] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUp && !fullName.trim()) {
      newErrors.name = "Please enter your name";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          toast.success("Account created! Please check your email to verify your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else if (error.message.includes("Email not confirmed")) {
            setShowResendMessage(true);
            toast.error("Please verify your email before signing in.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          // Check if 2FA is enabled for this user
          const { data: profile } = await supabase
            .from("profiles")
            .select("two_factor_enabled")
            .eq("user_id", data.user.id)
            .single();

          if (profile?.two_factor_enabled) {
            // Send 2FA code and redirect to verification
            try {
              const response = await supabase.functions.invoke("send-2fa-code", {
                body: { userId: data.user.id, email: data.user.email },
              });

              if (response.error) throw response.error;

              toast.success("Verification code sent to your email!");
              navigate("/2fa-verify", { 
                state: { email: data.user.email, userId: data.user.id } 
              });
            } catch (err) {
              console.error("2FA error:", err);
              // If 2FA fails, still allow login
              toast.success("Welcome back!");
              navigate("/parent");
            }
          } else {
            toast.success("Welcome back!");
            navigate("/parent");
          }
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-2xl">
                ✨
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                NoMiRo
              </h1>
            </div>

            <h2 className="mt-8 font-display text-2xl font-semibold text-foreground">
              {isSignUp ? "Create your family account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isSignUp
                ? "Start managing chores and rewards for your family"
                : "Sign in to continue your family's quest"}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    {isSignUp ? "Create Account" : "Sign In"}
                  </>
                )}
              </Button>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={async () => {
                  if (isLocalMode()) {
                    await supabase.auth.signInWithPassword({ email: "", password: "" }); // triggers OIDC redirect
                    return;
                  }
                  const { error } = await oauthHelper.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast.error("Google sign-in failed. Please try again.");
                  }
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </form>

            {showResendMessage && !isSignUp && (
              <div className="mt-4 rounded-lg border border-warning/20 bg-warning/10 p-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the verification email?{" "}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        toast.error("Please enter your email address first");
                        return;
                      }
                      setIsResending(true);
                      try {
                        const { error } = await supabase.auth.resend({
                          type: "signup",
                          email,
                          options: {
                            emailRedirectTo: `${window.location.origin}/`,
                          },
                        });
                        if (error) throw error;
                        toast.success("Verification email resent! Check your inbox.");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to resend verification email");
                      } finally {
                        setIsResending(false);
                      }
                    }}
                    disabled={isResending}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Resend verification email"}
                  </button>
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
              <p>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setShowResendMessage(false);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
              {!isSignUp && (
                <p>
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden bg-hero-gradient lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <motion.div
          className="max-w-md px-8 text-center text-primary-foreground"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-8xl">🏠</div>
          <h2 className="mt-6 font-display text-3xl font-bold">
            Make Chores Fun
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Transform everyday tasks into exciting quests. Watch your kids level up 
            as they learn responsibility and earn awesome rewards.
          </p>
          
          <div className="mt-8 flex justify-center gap-4">
            {["🧹", "🍽️", "🐕", "📚", "🌱"].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-4xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
