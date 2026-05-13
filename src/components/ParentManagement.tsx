import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/db";
import { Sparkle, Trash2, Star, User } from "lucide-react";
import { toast } from "sonner";
import { ParentInviteDialog } from "./ParentInviteDialog";
import { PendingInvitations } from "./PendingInvitations";

interface ParentManagementProps {
  familyId: string;
  familyName: string;
  ownerId: string;
  currentUserId: string;
  inviterName: string;
}

interface FamilyMember {
  id: string;
  user_id: string;
  role: string;
  full_name?: string;
}

export function ParentManagement({ familyId, familyName, ownerId, currentUserId, inviterName }: ParentManagementProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = currentUserId === ownerId;

  useEffect(() => {
    loadMembers();
  }, [familyId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("id, user_id, role")
        .eq("family_id", familyId)
        .eq("role", "parent");

      if (error) throw error;

      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", member.user_id)
            .single();

          return {
            ...member,
            full_name: profile?.full_name || "Unknown User",
          };
        })
      );

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!deletingMember) return;

    try {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", deletingMember.id);

      if (error) throw error;

      setMembers(members.filter((m) => m.id !== deletingMember.id));
      setDeletingMember(null);
      toast.success("Parent removed from family");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove parent");
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Star size={20} />
              </div>
              <div>
                <CardTitle>Parents & Guardians</CardTitle>
                <CardDescription>Manage who can access your family</CardDescription>
              </div>
            </div>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
                <Sparkle size={16} />
                Invite Parent
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No additional parents added yet
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.user_id === ownerId ? "Owner" : "Parent"}
                      </p>
                    </div>
                  </div>
                  {isOwner && member.user_id !== ownerId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingMember(member)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <PendingInvitations familyId={familyId} isOwner={isOwner} />

      {/* Invite Parent Dialog */}
      <ParentInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        familyId={familyId}
        familyName={familyName}
        inviterName={inviterName}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Parent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingMember?.full_name} from your family?
              They will no longer be able to manage chores or rewards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
