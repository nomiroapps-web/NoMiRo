import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/db";
import { toast } from "sonner";
import { Pencil, Save, Trash2 } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  points_cost: number;
  category: string;
  is_active: boolean;
  quantity_limit?: number | null;
}

interface RewardEditDialogProps {
  reward: Reward;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (reward: Reward) => void;
  onDelete: (rewardId: string) => void;
}

const rewardCategories = [
  { value: "screen_time", label: "📱 Screen Time" },
  { value: "privileges", label: "⭐ Privileges" },
  { value: "toys", label: "🧸 Toys" },
  { value: "outings", label: "🎢 Outings" },
  { value: "treats", label: "🍦 Treats" },
  { value: "money", label: "💵 Money" },
  { value: "other", label: "🎁 Other" },
];

export function RewardEditDialog({
  reward,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: RewardEditDialogProps) {
  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description || "");
  const [category, setCategory] = useState(reward.category);
  const [pointsCost, setPointsCost] = useState(reward.points_cost.toString());
  const [quantityLimit, setQuantityLimit] = useState(
    reward.quantity_limit?.toString() || ""
  );
  const [isActive, setIsActive] = useState(reward.is_active);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !pointsCost) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("rewards")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category: category as any,
          points_cost: parseInt(pointsCost),
          quantity_limit: quantityLimit ? parseInt(quantityLimit) : null,
          is_active: isActive,
          icon: rewardCategories.find((c) => c.value === category)?.label.split(" ")[0] || "gift",
        })
        .eq("id", reward.id);

      if (error) throw error;

      onUpdate({
        ...reward,
        name: name.trim(),
        description: description.trim() || null,
        category,
        points_cost: parseInt(pointsCost),
        quantity_limit: quantityLimit ? parseInt(quantityLimit) : null,
        is_active: isActive,
        icon: rewardCategories.find((c) => c.value === category)?.label.split(" ")[0] || "gift",
      });
      onOpenChange(false);
      toast.success("Reward updated successfully!");
    } catch (error) {
      console.error("Error updating reward:", error);
      toast.error("Failed to update reward");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("rewards")
        .delete()
        .eq("id", reward.id);

      if (error) throw error;

      onDelete(reward.id);
      onOpenChange(false);
      toast.success("Reward deleted");
    } catch (error) {
      console.error("Error deleting reward:", error);
      toast.error("Failed to delete reward");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Pencil size={18} />
            Edit Reward
          </DialogTitle>
          <DialogDescription>
            Update reward details or remove it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="editRewardName">Reward Name</Label>
            <Input
              id="editRewardName"
              placeholder="e.g., 30 min Screen Time"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editRewardDescription">Description (optional)</Label>
            <Textarea
              id="editRewardDescription"
              placeholder="What does this reward include?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rewardCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRewardPoints">Points Cost</Label>
              <Input
                id="editRewardPoints"
                type="number"
                min={1}
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editRewardQuantity">Quantity Limit (optional)</Label>
            <Input
              id="editRewardQuantity"
              type="number"
              placeholder="Leave empty for unlimited"
              min={1}
              value={quantityLimit}
              onChange={(e) => setQuantityLimit(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Limit how many times this reward can be redeemed per week
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="editRewardActive">Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive rewards won't be shown to children
              </p>
            </div>
            <Switch
              id="editRewardActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={18} />
              {isDeleting ? "..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
