import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/db";
import { motion } from "motion/react";
import { ArrowLeft, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = location.state?.email;
  const userId = location.state?.userId;

  useEffect(() => {
    if (!email || !userId) {
      navigate("/auth");
    }
  }, [email, userId, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value.replace(/\D/g, "");
      setCode(newCode);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("verify-2fa", {
        body: { userId, code: fullCode },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        toast.success("Verification successful!");
        navigate("/parent");
      } else {
        toast.error("Invalid or expired code. Please try again.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    try {
      const response = await supabase.functions.invoke("send-2fa-code", {
        body: { userId, email },
      });

      if (response.error) throw response.error;

      toast.success("New code sent to your email!");
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-md">
        <button
          onClick={() => navigate("/auth")}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground">
            Two-Factor Authentication
          </h1>
          <p className="mt-4 text-muted-foreground">
            We've sent a 6-digit code to <strong>{email}</strong>. 
            Enter it below to continue.
          </p>

          <div className="mt-8 flex justify-center gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-14 w-12 text-center text-2xl font-bold"
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            variant="hero"
            size="lg"
            className="mt-8 w-full"
            disabled={isLoading || code.join("").length !== 6}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Verifying...
              </span>
            ) : (
              "Verify Code"
            )}
          </Button>

          <div className="mt-6">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
              {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
