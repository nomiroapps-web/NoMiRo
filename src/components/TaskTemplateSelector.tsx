import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/db";
import { History, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  default_points: number | null;
  requires_photo: boolean | null;
  icon: string | null;
}

interface TaskTemplateSelectorProps {
  familyId: string;
  onSelectTemplate: (template: TaskTemplate) => void;
  currentTask?: {
    name: string;
    description: string;
    category: string;
    difficulty: string;
    points: number;
    requires_photo: boolean;
  };
}

export function TaskTemplateSelector({
  familyId,
  onSelectTemplate,
  currentTask,
}: TaskTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [familyId]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("task_templates")
        .select("*")
        .eq("family_id", familyId)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!currentTask?.name.trim()) {
      toast.error("Please enter a task name first");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("task_templates").insert({
        family_id: familyId,
        name: currentTask.name.trim(),
        description: currentTask.description.trim() || null,
        category: currentTask.category as any,
        difficulty: currentTask.difficulty as any,
        default_points: currentTask.points,
        requires_photo: currentTask.requires_photo,
      } as any);

      if (error) throw error;

      toast.success("Task saved as template!");
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <History size={16} />
            Use Template
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <Label>Select a saved template</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No templates yet. Create tasks and save them as templates!
              </p>
            ) : (
              <Select
                onValueChange={(value) => {
                  const template = templates.find((t) => t.id === value);
                  if (template) onSelectTemplate(template);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {currentTask?.name && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleSaveAsTemplate}
          disabled={isSaving}
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save as Template"}
        </Button>
      )}
    </div>
  );
}
