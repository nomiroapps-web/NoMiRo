import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "accepting" | "success" | "error">("loading");
  const [invitation, setInvitation] = useState<{
    family_name?: string;
    inviter_name?: string;
    email?: string;
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkInvitation();
  }, [token]);

  const checkInvitation = async () => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("Invalid invitation link");
      return;
    }

    try {
      // Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Get invitation details using service role via edge function or direct query
      const { data: invite, error } = await supabase
        .from("family_invitations")
        .select(`
          id,
          email,
          status,
          expires_at,
          family_id,
          families:family_id (name, owner_id)
        `)
        .eq("token", token)
        .single();

      if (error || !invite) {
        setStatus("invalid");
        setErrorMessage("Invitation not found");
        return;
      }

      if (invite.status !== "pending") {
        setStatus("invalid");
        setErrorMessage("This invitation has already been used or cancelled");
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        setStatus("invalid");
        setErrorMessage("This invitation has expired");
        return;
      }

      // Get inviter name
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", (invite.families as any)?.owner_id)
        .single();

      setInvitation({
        family_name: (invite.families as any)?.name,
        inviter_name: inviterProfile?.full_name || "A family member",
        email: invite.email,
      });
      setStatus("valid");
    } catch (error) {
      console.error("Error checking invitation:", error);
      setStatus("invalid");
      setErrorMessage("Failed to verify invitation");
    }
  };

  const handleAcceptInvite = async () => {
    if (!user || !token) {
      // Redirect to signup with token
      navigate(`/auth?mode=signup&invite=${token}`);
      return;
    }

    setStatus("accepting");

    try {
      // Get invitation details
      const { data: invite, error: inviteError } = await supabase
        .from("family_invitations")
        .select("id, family_id, email")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (inviteError || !invite) {
        throw new Error("Invitation not found or already used");
      }

      // Verify email matches
      if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
        throw new Error("This invitation was sent to a different email address");
      }

      // Add user as family member
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: invite.family_id,
          user_id: user.id,
          role: "parent",
        });

      if (memberError) {
        if (memberError.code === "23505") {
          throw new Error("You're already a member of this family");
        }
        throw memberError;
      }

      // Update invitation status
      await supabase
        .from("family_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      setStatus("success");
      toast.success("Welcome to the family!");
      
      setTimeout(() => navigate("/parent"), 2000);
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      setStatus("error");
      setErrorMessage(error.message || "Failed to accept invitation");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {status === "loading" || status === "accepting" ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : status === "success" ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : status === "invalid" || status === "error" ? (
                <XCircle className="h-8 w-8 text-destructive" />
              ) : (
                <UserPlus className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle>
              {status === "loading" && "Verifying Invitation..."}
              {status === "valid" && "Family Invitation"}
              {status === "accepting" && "Joining Family..."}
              {status === "success" && "Welcome!"}
              {(status === "invalid" || status === "error") && "Invitation Issue"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we verify your invitation"}
              {status === "valid" && `${invitation?.inviter_name} invited you to join ${invitation?.family_name}`}
              {status === "accepting" && "Adding you to the family..."}
              {status === "success" && `You're now part of ${invitation?.family_name}!`}
              {(status === "invalid" || status === "error") && errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "valid" && (
              <div className="space-y-4">
                {!user ? (
                  <>
                    <p className="text-center text-sm text-muted-foreground">
                      You need an account to join. The invitation was sent to{" "}
                      <strong>{invitation?.email}</strong>
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => navigate(`/auth?mode=signup&invite=${token}`)}>
                        Create Account
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/auth?mode=signin&invite=${token}`)}
                      >
                        Sign In
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-center text-sm text-muted-foreground">
                      Signed in as <strong>{user.email}</strong>
                    </p>
                    <Button className="w-full" onClick={handleAcceptInvite}>
                      Accept Invitation
                    </Button>
                  </>
                )}
              </div>
            )}

            {status === "success" && (
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            )}

            {(status === "invalid" || status === "error") && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/")}>Go Home</Button>
                {status === "error" && (
                  <Button variant="outline" onClick={checkInvitation}>
                    Try Again
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
