import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/db";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

interface ParentInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  familyName: string;
  inviterName: string;
}

export function ParentInviteDialog({
  open,
  onOpenChange,
  familyId,
  familyName,
  inviterName,
}: ParentInviteDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSendInvite = async () => {
    setError("");
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-parent-invite", {
        body: {
          email: email.trim().toLowerCase(),
          familyId,
          familyName,
          inviterName,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Create notification for the inviting user
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from("notifications").insert({
          user_id: userData.user.id,
          type: "reminder",
          title: "Family Invitation Sent",
          message: `You invited ${email} to join ${familyName}. They have 24 hours to accept.`,
          icon: "mail",
        } as any);
      }

      setIsSent(true);
      toast.success("Invitation sent successfully!");
    } catch (err: any) {
      console.error("Error sending invite:", err);
      setError(err.message || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setIsSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSent ? "Invitation Sent!" : "Invite Parent or Guardian"}
          </DialogTitle>
          <DialogDescription>
            {isSent
              ? `We've sent an invitation email to ${email}`
              : "Add another adult to help manage your family's chores and rewards"}
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="flex flex-col items-center py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              They'll receive an email with a link to join your family. The invitation expires in 24 hours.
            </p>
            <Button className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="parent@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <p className="text-sm text-muted-foreground">
                They'll receive an email invitation to create an account and join your family.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSendInvite} disabled={isLoading || !email}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
