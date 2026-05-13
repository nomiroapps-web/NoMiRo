import { useState, useEffect } from "react";
import { supabase } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface PendingInvitationsProps {
  familyId: string;
  isOwner: boolean;
}

export function PendingInvitations({ familyId, isOwner }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, [familyId]);

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("family_invitations")
        .select("id, email, status, created_at, expires_at")
        .eq("family_id", familyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("family_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      setInvitations(invitations.filter((i) => i.id !== invitationId));
      toast.success("Invitation cancelled");
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error("Failed to cancel invitation");
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    toast.info("To resend, cancel this invitation and send a new one.");
  };

  if (isLoading) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail size={18} />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Invitations waiting to be accepted
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expires_at) < new Date();
            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Mail size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium capitalize">
                        {invitation.email.split("@")[0].split(/[._-]/)[0] || "Invited"}
                      </p>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        Invited
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{invitation.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {isExpired ? (
                        <span className="text-destructive">Expired</span>
                      ) : (
                        <span>
                          Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      title="Cancel invitation"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
