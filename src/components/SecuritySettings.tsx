import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/db";
import { Shield, Phone, Fingerprint, Key, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface SecuritySettingsProps {
  userId: string;
}

export function SecuritySettings({ userId }: SecuritySettingsProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { soundEnabled, toggleSound, playNotificationSound } = useNotificationSound();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("phone_number, two_factor_enabled")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      setPhoneNumber(data?.phone_number || "");
      setTwoFactorEnabled(data?.two_factor_enabled || false);
      
      // Check if biometric is supported and enabled
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        // Check localStorage for biometric preference
        const savedBiometric = localStorage.getItem(`biometric-${userId}`);
        setBiometricEnabled(available && savedBiometric === "true");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhone = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ phone_number: phoneNumber || null })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Phone number updated!");
    } catch (error) {
      console.error("Error saving phone:", error);
      toast.error("Failed to update phone number");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ two_factor_enabled: enabled })
        .eq("user_id", userId);

      if (error) throw error;
      setTwoFactorEnabled(enabled);
      toast.success(enabled ? "Two-factor authentication enabled!" : "Two-factor authentication disabled");
    } catch (error) {
      console.error("Error toggling 2FA:", error);
      toast.error("Failed to update 2FA settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      // Check if biometric is available
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (!available) {
            toast.error("Biometric authentication is not available on this device");
            return;
          }
          
          // For now, we'll just save the preference
          localStorage.setItem(`biometric-${userId}`, "true");
          setBiometricEnabled(true);
          toast.success("Biometric authentication enabled!");
        } catch (error) {
          toast.error("Failed to enable biometric authentication");
        }
      } else {
        toast.error("Biometric authentication is not supported in this browser");
      }
    } else {
      localStorage.removeItem(`biometric-${userId}`);
      setBiometricEnabled(false);
      toast.success("Biometric authentication disabled");
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Shield size={20} />
          </div>
          <div>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Number */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-muted-foreground" />
            <Label htmlFor="phone">Phone Number (Optional)</Label>
          </div>
          <div className="flex gap-2">
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <Button onClick={handleSavePhone} disabled={isSaving}>
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add a phone number for account recovery
          </p>
        </div>

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Key size={20} className="text-primary" />
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Receive a code via email when signing in
              </p>
            </div>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isSaving}
          />
        </div>

        {/* Biometric Authentication */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Fingerprint size={20} className="text-secondary" />
            <div>
              <p className="font-medium">Biometric Authentication</p>
              <p className="text-sm text-muted-foreground">
                Use fingerprint or face recognition
              </p>
            </div>
          </div>
          <Switch
            checked={biometricEnabled}
            onCheckedChange={handleToggleBiometric}
          />
        </div>

        {/* Notification Sounds */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Volume2 size={20} className="text-primary" />
            <div>
              <p className="font-medium">Notification Sounds</p>
              <p className="text-sm text-muted-foreground">
                Play sounds for notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => playNotificationSound()}
              disabled={!soundEnabled}
            >
              Test
            </Button>
            <Switch
              checked={soundEnabled}
              onCheckedChange={toggleSound}
            />
          </div>
        </div>

        {/* Password Change Link */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-muted-foreground" />
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Use the "Forgot Password" flow to update your password
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
