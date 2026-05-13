import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Header } from "@/components/Header";
import { TaskCard } from "@/components/TaskCard";
import { RewardCard } from "@/components/RewardCard";
import { ChildAvatar, AvatarSelector } from "@/components/ChildAvatar";
import { PointsBadge } from "@/components/PointsBadge";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { NotificationBell } from "@/components/NotificationBell";
import { TaskVerificationCard } from "@/components/TaskVerificationCard";
import { TaskEditDialog } from "@/components/TaskEditDialog";
import { RewardEditDialog } from "@/components/RewardEditDialog";
import { TaskTemplateSelector } from "@/components/TaskTemplateSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/lib/db";
import { motion } from "motion/react";
import { 
  Plus, 
  Users, 
  ClipboardList, 
  Gift, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ClipboardCheck,
  Pencil
} from "lucide-react";
import { toast } from "sonner";

interface Child {
  id: string;
  name: string;
  age: number | null;
  avatar_index: number;
  points_balance: number;
  level: number;
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
  photo_url: string | null;
  completed_at: string | null;
  assigned_to: string;
  recurrence_type?: string | null;
  recurrence_days?: number[] | null;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  points_cost: number;
  category: string;
  is_active: boolean;
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

const rewardCategories = [
  { value: "screen_time", label: "📱 Screen Time" },
  { value: "privileges", label: "⭐ Privileges" },
  { value: "toys", label: "🧸 Toys" },
  { value: "outings", label: "🎢 Outings" },
  { value: "treats", label: "🍦 Treats" },
  { value: "money", label: "💵 Money" },
  { value: "other", label: "🎁 Other" },
];

export default function ParentDashboard() {
  const navigate = useNavigate();
  useAutoLogout();
  const { isReady, session, user } = useAuthReady();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [family, setFamily] = useState<{ id: string; name: string } | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  
  // Child form states
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState("");
  const [newChildAvatar, setNewChildAvatar] = useState(1);
  
  // Task form states
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("cleaning");
  const [newTaskDifficulty, setNewTaskDifficulty] = useState("beginner");
  const [newTaskPoints, setNewTaskPoints] = useState("10");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskRequiresPhoto, setNewTaskRequiresPhoto] = useState(false);
  const [newTaskRecurrence, setNewTaskRecurrence] = useState("none");
  const [newTaskRecurrenceDays, setNewTaskRecurrenceDays] = useState<number[]>([]);
  
  // Task edit state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Reward edit state
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Get today's date for min validation
  const today = new Date().toISOString().split("T")[0];

  // Reward form states
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardCategory, setNewRewardCategory] = useState("other");
  const [newRewardPoints, setNewRewardPoints] = useState("50");
  const [newRewardQuantityLimit, setNewRewardQuantityLimit] = useState("");

  useEffect(() => {
    if (!isReady) return;
    if (!session || !user) {
      navigate("/auth");
      return;
    }
    loadData(user.id);
  }, [isReady, session, user, navigate]);

  const loadData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();
      
      setProfile(profileData);

      // Load or create family
      let { data: familyData } = await supabase
        .from("families")
        .select("id, name")
        .eq("owner_id", userId)
        .single();

      if (!familyData) {
        const { data: newFamily, error: familyError } = await supabase
          .from("families")
          .insert({
            name: `${profileData?.full_name || "My"}'s Family`,
            owner_id: userId,
          })
          .select()
          .single();
        
        if (familyError) {
          console.error("Error creating family:", familyError);
          toast.error("Failed to create family");
          return;
        }
        familyData = newFamily;
      }

      setFamily(familyData);

      // Load children
      const { data: childrenData } = await supabase
        .from("children")
        .select("id, name, age, avatar_index, points_balance, level")
        .eq("family_id", familyData.id);

      setChildren(childrenData || []);

      // Load tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("family_id", familyData.id)
        .order("created_at", { ascending: false });

      setTasks(tasksData || []);

      // Load rewards
      const { data: rewardsData } = await supabase
        .from("rewards")
        .select("*")
        .eq("family_id", familyData.id)
        .order("created_at", { ascending: false });

      setRewards(rewardsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAddChild = async () => {
    if (!family || !newChildName.trim()) {
      toast.error("Please enter a name for the child");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("children")
        .insert({
          family_id: family.id,
          name: newChildName.trim(),
          age: newChildAge ? parseInt(newChildAge) : null,
          avatar_index: newChildAvatar,
        })
        .select()
        .single();

      if (error) throw error;

      setChildren([...children, data]);
      setShowAddChild(false);
      setNewChildName("");
      setNewChildAge("");
      setNewChildAvatar(1);
      toast.success(`${data.name} has been added to your family!`);
    } catch (error) {
      console.error("Error adding child:", error);
      toast.error("Failed to add child");
    }
  };

  const handleAddTask = async () => {
    if (!family || !newTaskName.trim() || !newTaskAssignee) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate due date is not in the past
    if (newTaskDueDate && newTaskDueDate < today) {
      toast.error("Due date cannot be in the past");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          family_id: family.id,
          name: newTaskName.trim(),
          description: newTaskDescription.trim() || null,
          category: newTaskCategory as any,
          difficulty: newTaskDifficulty as any,
          points: parseInt(newTaskPoints),
          assigned_to: newTaskAssignee,
          assigned_by: user?.id,
          due_date: newTaskDueDate || null,
          requires_photo: newTaskRequiresPhoto,
          icon: taskCategories.find(c => c.value === newTaskCategory)?.label.split(" ")[0] || "sparkles",
          recurrence_type: newTaskRecurrence === "none" ? null : newTaskRecurrence,
          recurrence_days: newTaskRecurrence !== "none" ? newTaskRecurrenceDays : null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setShowAddTask(false);
      resetTaskForm();
      toast.success("Task created successfully!");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setEditingTask(null);
  };

  const handleUpdateReward = (updatedReward: Reward) => {
    setRewards(rewards.map(r => r.id === updatedReward.id ? updatedReward : r));
    setEditingReward(null);
  };

  const handleDeleteReward = (rewardId: string) => {
    setRewards(rewards.filter(r => r.id !== rewardId));
    setEditingReward(null);
  };

  const handleSelectTemplate = (template: any) => {
    setNewTaskName(template.name);
    setNewTaskDescription(template.description || "");
    setNewTaskCategory(template.category || "other");
    setNewTaskDifficulty(template.difficulty || "beginner");
    setNewTaskPoints((template.default_points || 10).toString());
    setNewTaskRequiresPhoto(template.requires_photo || false);
  };

  const toggleRecurrenceDay = (day: number) => {
    if (newTaskRecurrenceDays.includes(day)) {
      setNewTaskRecurrenceDays(newTaskRecurrenceDays.filter(d => d !== day));
    } else {
      setNewTaskRecurrenceDays([...newTaskRecurrenceDays, day].sort());
    }
  };

  const handleAddReward = async () => {
    if (!family || !newRewardName.trim() || !newRewardPoints) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("rewards")
        .insert({
          family_id: family.id,
          name: newRewardName.trim(),
          description: newRewardDescription.trim() || null,
          category: newRewardCategory as any,
          points_cost: parseInt(newRewardPoints),
          quantity_limit: newRewardQuantityLimit ? parseInt(newRewardQuantityLimit) : null,
          icon: rewardCategories.find(c => c.value === newRewardCategory)?.label.split(" ")[0] || "gift",
        } as any)
        .select()
        .single();

      if (error) throw error;

      setRewards([data, ...rewards]);
      setShowAddReward(false);
      resetRewardForm();
      toast.success("Reward created successfully!");
    } catch (error) {
      console.error("Error adding reward:", error);
      toast.error("Failed to create reward");
    }
  };

  const resetTaskForm = () => {
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskCategory("cleaning");
    setNewTaskDifficulty("beginner");
    setNewTaskPoints("10");
    setNewTaskAssignee("");
    setNewTaskDueDate("");
    setNewTaskRequiresPhoto(false);
    setNewTaskRecurrence("none");
    setNewTaskRecurrenceDays([]);
  };

  const resetRewardForm = () => {
    setNewRewardName("");
    setNewRewardDescription("");
    setNewRewardCategory("other");
    setNewRewardPoints("50");
    setNewRewardQuantityLimit("");
  };

  // Stats
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const awaitingVerification = tasks.filter(t => t.status === "completed");
  const completedTasks = awaitingVerification.length;
  const verifiedTasks = tasks.filter(t => t.status === "verified").length;
  const totalPoints = children.reduce((sum, c) => sum + (c.points_balance || 0), 0);

  // Task verification handlers
  const handleApproveTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const child = children.find(c => c.id === task.assigned_to);
    if (!child) return;

    try {
      // Update task status to verified
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ 
          status: "verified",
          verified_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (taskError) throw taskError;

      // Add points to child
      const newBalance = (child.points_balance || 0) + task.points;
      
      const { error: pointsError } = await supabase
        .from("children")
        .update({ points_balance: newBalance })
        .eq("id", child.id);

      if (pointsError) throw pointsError;

      // Create transaction record
      await supabase.from("point_transactions").insert({
        child_id: child.id,
        amount: task.points,
        transaction_type: "task_completion",
        description: `Verified: ${task.name}`,
        task_id: taskId,
      });

      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: "verified" } : t
      ));
      setChildren(children.map(c => 
        c.id === child.id ? { ...c, points_balance: newBalance } : c
      ));

      toast.success(`Task approved! ${child.name} earned ${task.points} points.`);
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error("Failed to approve task");
    }
  };

  const handleRejectTask = async (taskId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: "rejected",
          rejection_reason: reason || "Task not completed satisfactorily"
        })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: "rejected" } : t
      ));

      toast.success("Task has been rejected");
    } catch (error) {
      console.error("Error rejecting task:", error);
      toast.error("Failed to reject task");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          className="text-4xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          ✨
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        variant="parent" 
        userName={profile?.full_name} 
        onLogout={handleLogout}
      />

      <main className="container px-4 py-8">
        {/* Welcome & Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome, {profile?.full_name || "Parent"} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your family's chores and rewards
            </p>
          </div>
          {user && <NotificationBell userId={user.id} />}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Children</p>
                <p className="font-display text-2xl font-bold">{children.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
                <p className="font-display text-2xl font-bold">{pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-display text-2xl font-bold">{completedTasks + verifiedTasks}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-points/10 text-points">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="font-display text-2xl font-bold">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue={awaitingVerification.length > 0 ? "verify" : "children"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="verify" className="gap-2 relative">
              <ClipboardCheck size={16} />
              <span className="hidden sm:inline">Verify</span>
              {awaitingVerification.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-xs font-bold text-warning-foreground">
                  {awaitingVerification.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="children" className="gap-2">
              <Users size={16} />
              <span className="hidden sm:inline">Children</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ClipboardList size={16} />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar size={16} />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift size={16} />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
          </TabsList>

          {/* Verification Tab */}
          <TabsContent value="verify" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">Task Verification</h2>
                <p className="text-sm text-muted-foreground">
                  Review and approve completed tasks
                </p>
              </div>
            </div>

            {awaitingVerification.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-success/5 py-16 text-center"
              >
                <div className="text-6xl">✅</div>
                <h3 className="mt-4 font-display text-xl font-semibold text-success">
                  All caught up!
                </h3>
                <p className="mt-2 text-muted-foreground">
                  No tasks waiting for verification
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {awaitingVerification.map((task, index) => {
                  const child = children.find(c => c.id === task.assigned_to);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <TaskVerificationCard
                        id={task.id}
                        name={task.name}
                        description={task.description || undefined}
                        icon={task.icon}
                        points={task.points}
                        completedAt={task.completed_at || undefined}
                        photoUrl={task.photo_url || undefined}
                        category={task.category}
                        difficulty={task.difficulty}
                        childName={child?.name || "Unknown"}
                        childAvatarIndex={child?.avatar_index || 1}
                        onApprove={handleApproveTask}
                        onReject={handleRejectTask}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Children Tab */}
          <TabsContent value="children" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Family Members</h2>
              <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm">
                    <Plus size={18} />
                    Add Child
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Add a New Child</DialogTitle>
                    <DialogDescription>
                      Create a profile for your child so they can start earning points!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label>Choose an Avatar</Label>
                      <AvatarSelector
                        selectedIndex={newChildAvatar}
                        onSelect={setNewChildAvatar}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="childName">Name</Label>
                      <Input
                        id="childName"
                        placeholder="Child's name"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="childAge">Age (optional)</Label>
                      <Input
                        id="childAge"
                        type="number"
                        placeholder="Age"
                        min={1}
                        max={18}
                        value={newChildAge}
                        onChange={(e) => setNewChildAge(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleAddChild}
                    >
                      Add Child
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {children.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 py-16 text-center"
              >
                <div className="text-6xl">👨‍👩‍👧‍👦</div>
                <h3 className="mt-4 font-display text-xl font-semibold">No children yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Add your first child to start assigning tasks!
                </p>
                <Button
                  variant="hero"
                  className="mt-6"
                  onClick={() => setShowAddChild(true)}
                >
                  <Plus size={18} />
                  Add Your First Child
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child, index) => (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl bg-card p-6 shadow-card"
                  >
                    <div className="flex items-center gap-4">
                      <ChildAvatar
                        avatarIndex={child.avatar_index}
                        size="lg"
                        showLevel
                        level={child.level}
                      />
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold">
                          {child.name}
                        </h3>
                        {child.age && (
                          <p className="text-sm text-muted-foreground">
                            {child.age} years old
                          </p>
                        )}
                        <div className="mt-2">
                          <PointsBadge points={child.points_balance} size="sm" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">All Tasks</h2>
              <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm" disabled={children.length === 0}>
                    <Plus size={18} />
                    Create Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display">Create a New Task</DialogTitle>
                    <DialogDescription>
                      Assign a chore to one of your children
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="taskName">Task Name</Label>
                      <Input
                        id="taskName"
                        placeholder="e.g., Make your bed"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taskDescription">Description (optional)</Label>
                      <Textarea
                        id="taskDescription"
                        placeholder="Any specific instructions..."
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
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
                        <Select value={newTaskDifficulty} onValueChange={setNewTaskDifficulty}>
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
                        <Label htmlFor="taskPoints">Points</Label>
                        <Input
                          id="taskPoints"
                          type="number"
                          min={1}
                          max={100}
                          value={newTaskPoints}
                          onChange={(e) => setNewTaskPoints(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Assign To</Label>
                        <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
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
                      <Label htmlFor="taskDueDate">Due Date (optional)</Label>
                      <Input
                        id="taskDueDate"
                        type="date"
                        min={today}
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Repeat</Label>
                      <Select value={newTaskRecurrence} onValueChange={setNewTaskRecurrence}>
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
                    {newTaskRecurrence === "weekly" && (
                      <div className="space-y-2">
                        <Label>Repeat on</Label>
                        <div className="flex flex-wrap gap-2">
                          {weekDays.map((day) => (
                            <Button
                              key={day.value}
                              type="button"
                              variant={newTaskRecurrenceDays.includes(day.value) ? "default" : "outline"}
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
                    {newTaskRecurrence === "monthly" && (
                      <div className="space-y-2">
                        <Label htmlFor="monthlyDay">Day of month</Label>
                        <Input
                          id="monthlyDay"
                          type="number"
                          min={1}
                          max={31}
                          placeholder="1-31"
                          value={newTaskRecurrenceDays[0] || ""}
                          onChange={(e) => setNewTaskRecurrenceDays([parseInt(e.target.value) || 1])}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="requiresPhoto">Require Photo Proof</Label>
                        <p className="text-sm text-muted-foreground">
                          Child must upload a photo when completing
                        </p>
                      </div>
                      <Switch
                        id="requiresPhoto"
                        checked={newTaskRequiresPhoto}
                        onCheckedChange={setNewTaskRequiresPhoto}
                      />
                    </div>
                    {family && (
                      <TaskTemplateSelector
                        familyId={family.id}
                        onSelectTemplate={handleSelectTemplate}
                        currentTask={{
                          name: newTaskName,
                          description: newTaskDescription,
                          category: newTaskCategory,
                          difficulty: newTaskDifficulty,
                          points: parseInt(newTaskPoints) || 10,
                          requires_photo: newTaskRequiresPhoto,
                        }}
                      />
                    )}
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleAddTask}
                    >
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {children.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 py-16 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-xl font-semibold">Add children first</h3>
                <p className="mt-2 text-muted-foreground">
                  You need to add at least one child before creating tasks
                </p>
              </div>
            ) : tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 py-16 text-center"
              >
                <div className="text-6xl">📋</div>
                <h3 className="mt-4 font-display text-xl font-semibold">No tasks yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Create your first task to get started!
                </p>
                <Button
                  variant="hero"
                  className="mt-6"
                  onClick={() => setShowAddTask(true)}
                >
                  <Plus size={18} />
                  Create First Task
                </Button>
              </motion.div>
            ) : (
              <Accordion type="multiple" defaultValue={children.map(c => c.id)} className="space-y-4">
                {children.map((child) => {
                  const childTasks = tasks.filter(t => t.assigned_to === child.id);
                  const pendingCount = childTasks.filter(t => t.status === "pending").length;
                  const completedCount = childTasks.filter(t => t.status === "completed" || t.status === "verified").length;
                  
                  return (
                    <AccordionItem key={child.id} value={child.id} className="rounded-2xl border bg-card shadow-card">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <ChildAvatar avatarIndex={child.avatar_index} size="sm" />
                          <div className="text-left">
                            <h3 className="font-display font-semibold">{child.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {pendingCount} pending • {completedCount} completed
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {childTasks.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            No tasks assigned to {child.name} yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {childTasks.map((task, index) => (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="relative"
                              >
                                <div className="absolute right-2 top-2 z-10">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditingTask(task)}
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                </div>
                                <TaskCard
                                  id={task.id}
                                  name={task.name}
                                  description={task.description || undefined}
                                  icon={task.icon}
                                  points={task.points}
                                  dueDate={task.due_date || undefined}
                                  status={task.status as any}
                                  category={task.category}
                                  difficulty={task.difficulty}
                                  requiresPhoto={task.requires_photo}
                                />
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Weekly Schedule</h2>
            </div>
            
            <WeeklyCalendar tasks={tasks} children={children} />
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Rewards Marketplace</h2>
              <Dialog open={showAddReward} onOpenChange={setShowAddReward}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm">
                    <Plus size={18} />
                    Add Reward
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Create a New Reward</DialogTitle>
                    <DialogDescription>
                      Add a reward that children can redeem with their points
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="rewardName">Reward Name</Label>
                      <Input
                        id="rewardName"
                        placeholder="e.g., 30 min Screen Time"
                        value={newRewardName}
                        onChange={(e) => setNewRewardName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rewardDescription">Description (optional)</Label>
                      <Textarea
                        id="rewardDescription"
                        placeholder="What does this reward include?"
                        value={newRewardDescription}
                        onChange={(e) => setNewRewardDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={newRewardCategory} onValueChange={setNewRewardCategory}>
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
                        <Label htmlFor="rewardPoints">Points Cost</Label>
                        <Input
                          id="rewardPoints"
                          type="number"
                          min={1}
                          value={newRewardPoints}
                          onChange={(e) => setNewRewardPoints(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rewardQuantity">Quantity Limit (optional)</Label>
                      <Input
                        id="rewardQuantity"
                        type="number"
                        placeholder="Leave empty for unlimited"
                        min={1}
                        value={newRewardQuantityLimit}
                        onChange={(e) => setNewRewardQuantityLimit(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Limit how many times this reward can be redeemed per week
                      </p>
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleAddReward}
                    >
                      Create Reward
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {rewards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 py-16 text-center"
              >
                <div className="text-6xl">🎁</div>
                <h3 className="mt-4 font-display text-xl font-semibold">No rewards yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Create rewards that your children can redeem with their points!
                </p>
                <Button
                  variant="hero"
                  className="mt-6"
                  onClick={() => setShowAddReward(true)}
                >
                  <Plus size={18} />
                  Create First Reward
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward, index) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="absolute right-3 top-3 z-20">
                      <Button
                        variant="secondary"
                        size="iconSm"
                        className="h-8 w-8 bg-card/80 backdrop-blur-sm"
                        onClick={() => setEditingReward(reward)}
                      >
                        <Pencil size={14} />
                      </Button>
                    </div>
                    <RewardCard
                      id={reward.id}
                      name={reward.name}
                      description={reward.description || undefined}
                      icon={reward.icon}
                      imageUrl={reward.image_url || undefined}
                      pointsCost={reward.points_cost}
                      category={reward.category}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Task Edit Dialog */}
      {editingTask && (
        <TaskEditDialog
          task={editingTask}
          children={children}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Reward Edit Dialog */}
      {editingReward && (
        <RewardEditDialog
          reward={editingReward}
          open={!!editingReward}
          onOpenChange={(open) => !open && setEditingReward(null)}
          onUpdate={handleUpdateReward}
          onDelete={handleDeleteReward}
        />
      )}
    </div>
  );
}
