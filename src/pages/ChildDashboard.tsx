import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Header } from "@/components/Header";
import { TaskCard } from "@/components/TaskCard";
import { RewardCard } from "@/components/RewardCard";
import { LevelProgress } from "@/components/ProgressBar";
import { ChildAvatar } from "@/components/ChildAvatar";
import { CelebrationOverlay } from "@/components/Confetti";
import { NotificationBell } from "@/components/NotificationBell";
import { PhotoUploadDialog } from "@/components/PhotoUploadDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/db";
import { motion } from "motion/react";
import { ClipboardList, Gift, Trophy, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


interface Child {
  id: string;
  name: string;
  avatar_index: number;
  points_balance: number;
  level: number;
  family_id: string;
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
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  points_cost: number;
  category: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  earned_at: string;
}

// Simple weekly calendar for children
function ChildWeeklyCalendar({ tasks }: { tasks: Task[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  
  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const days = getWeekDays();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTasksForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => task.due_date === dateStr && task.status === "pending");
  };

  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">My Week</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="iconSm" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            This Week
          </Button>
          <Button variant="ghost" size="iconSm" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const dayTasks = getTasksForDay(date);
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today;

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex flex-col items-center rounded-xl p-3 transition-all",
                isToday
                  ? "bg-primary text-primary-foreground shadow-glow-sm"
                  : isPast
                  ? "bg-muted/30 text-muted-foreground"
                  : "bg-muted/50"
              )}
            >
              <span className="text-xs font-medium">{dayNames[index]}</span>
              <span className={cn(
                "mt-1 font-display text-xl font-bold",
                isToday && "text-primary-foreground"
              )}>
                {date.getDate()}
              </span>
              {dayTasks.length > 0 && (
                <div className={cn(
                  "mt-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  isToday 
                    ? "bg-primary-foreground text-primary" 
                    : "bg-warning text-warning-foreground"
                )}>
                  {dayTasks.length}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tasks for today */}
      <div className="mt-6">
        <h4 className="mb-3 font-semibold text-muted-foreground">Today's Tasks</h4>
        {getTasksForDay(today).length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No tasks due today! 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {getTasksForDay(today).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
              >
                <span className="text-xl">{task.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{task.name}</p>
                  <p className="text-xs text-muted-foreground">{task.points} points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChildDashboard() {
  const navigate = useNavigate();
  useAutoLogout();
  const { isReady, session, user } = useAuthReady();
  const [child, setChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  
  // Photo upload state
  const [photoUploadTask, setPhotoUploadTask] = useState<Task | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      // Try to find child profile for this user
      const { data: childData } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (childData) {
        setChild(childData);

        // Load tasks for this child
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", childData.id)
          .order("created_at", { ascending: false });

        setTasks(tasksData || []);

        // Load rewards for the family
        const { data: rewardsData } = await supabase
          .from("rewards")
          .select("*")
          .eq("family_id", childData.family_id)
          .eq("is_active", true);

        setRewards(rewardsData || []);

        // Load achievements
        const { data: achievementsData } = await supabase
          .from("child_achievements")
          .select(`
            earned_at,
            achievements (
              id,
              name,
              description,
              icon
            )
          `)
          .eq("child_id", childData.id);

        if (achievementsData) {
          setAchievements(
            achievementsData.map((a: any) => ({
              ...a.achievements,
              earned_at: a.earned_at,
            }))
          );
        }
      }
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

  const handleCompleteTask = async (taskId: string, photoUrl?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !child) return;

    try {
      // Update task status
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString(),
          photo_url: photoUrl || null,
        })
        .eq("id", taskId);

      if (taskError) throw taskError;

      // Add points to child (for non-photo tasks, auto-verify)
      if (!task.requires_photo) {
        const newBalance = child.points_balance + task.points;
        
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
          description: `Completed: ${task.name}`,
          task_id: taskId,
        });

        setChild({ ...child, points_balance: newBalance });
      }

      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, status: task.requires_photo ? "completed" : "verified", photo_url: photoUrl || null } 
          : t
      ));

      // Show celebration
      setCelebrationPoints(task.points);
      setShowCelebration(true);

      if (task.requires_photo) {
        toast.success("Task marked complete! Waiting for parent verification.");
      } else {
        toast.success(`+${task.points} points earned!`);
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    }
  };

  const handlePhotoUploadClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setPhotoUploadTask(task);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!photoUploadTask || !child) return;

    setIsUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${child.id}/${photoUploadTask.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("task-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get signed URL (bucket is private)
      const { data: urlData, error: urlError } = await supabase.storage
        .from("task-photos")
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (urlError) throw urlError;
      const photoUrl = urlData.signedUrl;

      // Complete the task with the photo URL
      await handleCompleteTask(photoUploadTask.id, photoUrl);
      
      setPhotoUploadTask(null);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || !child || child.points_balance < reward.points_cost) return;

    try {
      // Create redemption request
      const { error: redemptionError } = await supabase
        .from("redemptions")
        .insert({
          reward_id: rewardId,
          child_id: child.id,
          points_spent: reward.points_cost,
          status: "pending",
        });

      if (redemptionError) throw redemptionError;

      toast.success(`Request sent for ${reward.name}! Waiting for parent approval.`);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("Failed to request reward");
    }
  };

  // Stats
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "verified");

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

  // If no child profile found, show message
  if (!child) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-6xl">🔒</div>
        <h1 className="mt-6 font-display text-2xl font-bold">No Child Profile Found</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Your account isn't linked to a child profile yet. Ask your parent to add you!
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 text-primary underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        variant="child" 
        userName={child.name}
        userPoints={child.points_balance}
        avatarIndex={child.avatar_index}
        onLogout={handleLogout}
      />

      <CelebrationOverlay
        show={showCelebration}
        points={celebrationPoints}
        onClose={() => setShowCelebration(false)}
      />

      <PhotoUploadDialog
        open={!!photoUploadTask}
        onOpenChange={(open) => !open && setPhotoUploadTask(null)}
        taskName={photoUploadTask?.name || ""}
        onUpload={handlePhotoUpload}
        isUploading={isUploading}
      />

      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:justify-between sm:text-left"
        >
          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <ChildAvatar
              avatarIndex={child.avatar_index}
              size="xl"
              showLevel
              level={child.level}
              className="mb-4 sm:mb-0 sm:mr-6"
            />
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Hi, {child.name}! 👋
              </h1>
              <p className="mt-1 text-muted-foreground">
                You have {pendingTasks.length} tasks waiting for you
              </p>
              <div className="mt-4 w-full max-w-xs sm:max-w-sm">
                <LevelProgress
                  currentPoints={child.points_balance}
                  level={child.level}
                />
              </div>
            </div>
          </div>
          {user && <NotificationBell userId={user.id} />}
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="tasks" className="gap-2">
              <ClipboardList size={16} />
              <span className="hidden sm:inline">My Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar size={16} />
              <span className="hidden sm:inline">Week</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift size={16} />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy size={16} />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            {pendingTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-success/5 py-16 text-center"
              >
                <div className="text-6xl">🎉</div>
                <h3 className="mt-4 font-display text-xl font-semibold text-success">
                  All done!
                </h3>
                <p className="mt-2 text-muted-foreground">
                  You've completed all your tasks. Great job!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
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
                      photoUrl={task.photo_url || undefined}
                      isChild
                      onComplete={() => handleCompleteTask(task.id)}
                      onPhotoUpload={handlePhotoUploadClick}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 font-display text-lg font-semibold text-muted-foreground">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-4 opacity-60">
                  {completedTasks.slice(0, 3).map((task) => (
                    <TaskCard
                      key={task.id}
                      id={task.id}
                      name={task.name}
                      icon={task.icon}
                      points={task.points}
                      status={task.status as any}
                      category={task.category}
                      difficulty={task.difficulty}
                      photoUrl={task.photo_url || undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <ChildWeeklyCalendar tasks={tasks} />
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            {rewards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 py-16 text-center"
              >
                <div className="text-6xl">🎁</div>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  No rewards yet
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Ask your parents to add some rewards!
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward, index) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RewardCard
                      id={reward.id}
                      name={reward.name}
                      description={reward.description || undefined}
                      icon={reward.icon}
                      imageUrl={reward.image_url || undefined}
                      pointsCost={reward.points_cost}
                      category={reward.category}
                      currentPoints={child.points_balance}
                      onRedeem={handleRedeemReward}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            {achievements.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 py-16 text-center"
              >
                <div className="text-6xl">🏆</div>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  No badges yet
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Complete tasks to earn your first badge!
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-points to-warning text-3xl">
                      {achievement.icon === "trophy" ? "🏆" :
                       achievement.icon === "medal" ? "🏅" :
                       achievement.icon === "hand" ? "✋" :
                       achievement.icon === "footprints" ? "👣" :
                       achievement.icon === "coins" ? "🪙" :
                       achievement.icon === "piggy-bank" ? "🐷" :
                       achievement.icon === "gem" ? "💎" : "⭐"}
                    </div>
                    <div>
                      <h4 className="font-display font-semibold">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
