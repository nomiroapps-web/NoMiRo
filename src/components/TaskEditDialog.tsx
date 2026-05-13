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

interface Child {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  difficulty: string;
  points: number;
  status: string;
  due_date: string | null;
  requires_photo: boolean;
  assigned_to: string;
  recurrence_type?: string | null;
  recurrence_days?: number[] | null;
}

interface TaskEditDialogProps {
  task: Task;
  children: Child[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const taskCategories = [
  { value: "cleaning", label: "🧹 Cleaning" },
  { value: "organizing", label: "📦 Organizing" },
  { value: "pet_care", label: "🐕 Pet Care" },
  { value: "meal_help", label: "🍽️ Meal Help" },
  { value: "yard_work", label: "🌱 Yard Work" },
  { value: "self_care", label: "🪥 Self Care" },
  { value: "homework", label: "📚 Homework" },
  { value: "other", label: "✨ Other" },
];

const difficultyLevels = [
  { value: "beginner", label: "Beginner", points: "5-15" },
  { value: "intermediate", label: "Intermediate", points: "15-30" },
  { value: "advanced", label: "Advanced", points: "30-50" },
];

const recurrenceOptions = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const weekDays = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function TaskEditDialog({
  task,
  children,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: TaskEditDialogProps) {
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || "");
  const [category, setCategory] = useState(task.category);
  const [difficulty, setDifficulty] = useState(task.difficulty);
  const [points, setPoints] = useState(task.points.toString());
  const [assignee, setAssignee] = useState(task.assigned_to);
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [requiresPhoto, setRequiresPhoto] = useState(task.requires_photo);
  const [recurrenceType, setRecurrenceType] = useState(task.recurrence_type || "none");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(task.recurrence_days || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    if (!name.trim() || !assignee) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate due date is not in the past
    if (dueDate && dueDate < today) {
      toast.error("Due date cannot be in the past");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category: category as any,
          difficulty: difficulty as any,
          points: parseInt(points),
          assigned_to: assignee,
          due_date: dueDate || null,
          requires_photo: requiresPhoto,
          recurrence_type: recurrenceType === "none" ? null : recurrenceType,
          recurrence_days: recurrenceType !== "none" ? recurrenceDays : null,
        })
        .eq("id", task.id);

      if (error) throw error;

      onUpdate({ 
        ...task, 
        name: name.trim(),
        description: description.trim() || null,
        category,
        difficulty,
        points: parseInt(points),
        assigned_to: assignee,
        due_date: dueDate || null,
        requires_photo: requiresPhoto,
        recurrence_type: recurrenceType === "none" ? null : recurrenceType,
        recurrence_days: recurrenceType !== "none" ? recurrenceDays : null,
      });
      onOpenChange(false);
      toast.success("Task updated successfully!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;

      onDelete(task.id);
      onOpenChange(false);
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRecurrenceDay = (day: number) => {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter((d) => d !== day));
    } else {
      setRecurrenceDays([...recurrenceDays, day].sort());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Pencil size={18} />
            Edit Task
          </DialogTitle>
          <DialogDescription>
            Update task details or delete it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="editTaskName">Task Name</Label>
            <Input
              id="editTaskName"
              placeholder="e.g., Make your bed"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editTaskDescription">Description (optional)</Label>
            <Textarea
              id="editTaskDescription"
              placeholder="Any specific instructions..."
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
                  {taskCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label} ({level.points} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editTaskPoints">Points</Label>
              <Input
                id="editTaskPoints"
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editTaskDueDate">Due Date (optional)</Label>
            <Input
              id="editTaskDueDate"
              type="date"
              min={today}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={recurrenceType} onValueChange={setRecurrenceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recurrenceType === "weekly" && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={recurrenceDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRecurrenceDay(day.value)}
                    className="w-10"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {recurrenceType === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="monthlyDay">Day of month</Label>
              <Input
                id="monthlyDay"
                type="number"
                min={1}
                max={31}
                placeholder="1-31"
                value={recurrenceDays[0] || ""}
                onChange={(e) => setRecurrenceDays([parseInt(e.target.value) || 1])}
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="editRequiresPhoto">Require Photo Proof</Label>
              <p className="text-sm text-muted-foreground">
                Child must upload a photo when completing
              </p>
            </div>
            <Switch
              id="editRequiresPhoto"
              checked={requiresPhoto}
              onCheckedChange={setRequiresPhoto}
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
