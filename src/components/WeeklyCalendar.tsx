import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Calendar, Filter, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  name: string;
  icon: string;
  points: number;
  due_date: string | null;
  status: string;
  assigned_to: string;
}

interface Child {
  id: string;
  name: string;
  avatar_index: number;
}

interface WeeklyCalendarProps {
  tasks: Task[];
  children: Child[];
  onTaskClick?: (task: Task) => void;
}

type ViewMode = "week" | "month";

const getDaysOfWeek = (startDate: Date) => {
  const days = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
};

const getDaysOfMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  const days: (Date | null)[] = [];
  
  // Add empty slots for days before the first day
  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  
  // Add empty slots to complete the last week
  const remainingSlots = 7 - (days.length % 7);
  if (remainingSlots < 7) {
    for (let i = 0; i < remainingSlots; i++) {
      days.push(null);
    }
  }
  
  return days;
};

const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusConfig: Record<string, { color: string; badgeColor: string; icon: string; label: string }> = {
  pending: {
    color: "bg-primary/20 border-primary/50 text-primary ring-1 ring-primary/30",
    badgeColor: "bg-primary/90 text-primary-foreground",
    icon: "⏳",
    label: "Pending",
  },
  completed: {
    color: "bg-warning/20 border-warning/50 text-warning ring-1 ring-warning/30",
    badgeColor: "bg-warning/90 text-warning-foreground",
    icon: "✅",
    label: "Completed",
  },
  verified: {
    color: "bg-success/25 border-success/60 text-success ring-1 ring-success/40",
    badgeColor: "bg-success/90 text-success-foreground",
    icon: "🏆",
    label: "Verified",
  },
  rejected: {
    color: "bg-destructive/20 border-destructive/50 text-destructive ring-1 ring-destructive/30",
    badgeColor: "bg-destructive/90 text-destructive-foreground",
    icon: "❌",
    label: "Rejected",
  },
};

const avatarEmojis = ["🦊", "🐸", "🦁", "🐼", "🐨", "🦄", "🐯", "🐰", "🦋", "🐢"];

export function WeeklyCalendar({ tasks, children, onTaskClick }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [statusFilters, setStatusFilters] = useState<string[]>(["pending", "completed", "verified", "rejected"]);
  
  const weekDays = useMemo(() => getDaysOfWeek(currentDate), [currentDate]);
  const monthDays = useMemo(() => getDaysOfMonth(currentDate), [currentDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter tasks based on selected statuses
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => statusFilters.includes(task.status));
  }, [tasks, statusFilters]);

  const getTasksForDay = (date: Date) => {
    const dateStr = formatDate(date);
    return filteredTasks.filter((task) => task.due_date === dateStr);
  };

  const getStatusCountsForDay = (date: Date) => {
    const dateStr = formatDate(date);
    const dayTasks = tasks.filter((task) => task.due_date === dateStr);
    const counts: Record<string, number> = {};
    
    for (const task of dayTasks) {
      counts[task.status] = (counts[task.status] || 0) + 1;
    }
    
    return counts;
  };

  const getChildAvatar = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    return child ? avatarEmojis[(child.avatar_index - 1) % avatarEmojis.length] : "👤";
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const activeFilterCount = statusFilters.length;
  const allFiltersActive = activeFilterCount === Object.keys(statusConfig).length;

  // Get month/year for header
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = viewMode === "week" ? weekDays : monthDays;
  const maxTasksToShow = viewMode === "week" ? 3 : 2;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-card md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {viewMode === "week" ? "Weekly" : "Monthly"} Calendar
            </h3>
            <p className="text-sm text-muted-foreground">{monthYear}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="rounded-lg border bg-muted/30 p-0.5"
          >
            <ToggleGroupItem value="week" aria-label="Week view" className="gap-1.5 px-2.5 data-[state=on]:bg-background">
              <CalendarRange size={14} />
              <span className="hidden sm:inline text-xs">Week</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Month view" className="gap-1.5 px-2.5 data-[state=on]:bg-background">
              <CalendarDays size={14} />
              <span className="hidden sm:inline text-xs">Month</span>
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter size={14} />
                <span className="hidden sm:inline">Filter</span>
                {!allFiltersActive && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.entries(statusConfig).map(([status, config]) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilters.includes(status)}
                  onCheckedChange={() => toggleStatusFilter(status)}
                  className="gap-2"
                >
                  <span>{config.icon}</span>
                  <span className="capitalize">{config.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="iconSm" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="iconSm" onClick={() => navigate(1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {/* Day headers */}
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-xs font-semibold uppercase tracking-wide",
              index === 0 || index === 6 ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {day}
          </div>
        ))}

        {/* Day cells */}
        {days.map((date, index) => {
          if (!date) {
            // Empty cell for month view padding
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[60px] rounded-xl border border-transparent bg-muted/10 md:min-h-[80px]"
              />
            );
          }

          const dayTasks = getTasksForDay(date);
          const statusCounts = getStatusCountsForDay(date);
          const isToday = formatDate(date) === formatDate(today);
          const isPast = date < today;
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();

          return (
            <motion.div
              key={formatDate(date)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.01, 0.3) }}
              className={cn(
                "rounded-xl border-2 p-1.5 transition-colors md:p-2",
                viewMode === "week" ? "min-h-[100px] md:min-h-[140px]" : "min-h-[60px] md:min-h-[90px]",
                isToday
                  ? "border-primary bg-primary/5"
                  : isPast
                  ? "border-muted bg-muted/30"
                  : "border-border bg-background",
                (date.getDay() === 0 || date.getDay() === 6) && "bg-muted/20",
                viewMode === "month" && !isCurrentMonth && "opacity-50"
              )}
            >
              {/* Date number and status badges */}
              <div className="mb-1 flex items-start justify-between gap-0.5">
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full text-xs font-bold md:text-sm",
                    viewMode === "week" ? "h-7 w-7" : "h-5 w-5 md:h-6 md:w-6",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isPast
                      ? "text-muted-foreground"
                      : "text-foreground"
                  )}
                >
                  {date.getDate()}
                </div>
                
                {/* Status count badges */}
                {Object.keys(statusCounts).length > 0 && (
                  <div className="flex flex-wrap justify-end gap-0.5">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div
                        key={status}
                        className={cn(
                          "flex items-center justify-center rounded-full font-bold",
                          viewMode === "week" 
                            ? "h-5 min-w-5 px-1 text-[10px]" 
                            : "h-4 min-w-4 px-0.5 text-[8px]",
                          statusConfig[status]?.badgeColor || "bg-muted text-muted-foreground"
                        )}
                        title={`${count} ${statusConfig[status]?.label || status}`}
                      >
                        {viewMode === "week" && (
                          <span className="mr-0.5 text-[9px]">{statusConfig[status]?.icon}</span>
                        )}
                        {count}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="space-y-0.5">
                {dayTasks.slice(0, maxTasksToShow).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className={cn(
                      "group flex w-full items-center gap-0.5 rounded-md border px-1 text-left transition-all hover:scale-[1.02] hover:shadow-md",
                      viewMode === "week" 
                        ? "border-2 py-1 text-xs" 
                        : "border py-0.5 text-[10px]",
                      statusConfig[task.status]?.color || statusConfig.pending.color
                    )}
                  >
                    <span className="shrink-0 text-[10px]" title={task.status}>
                      {statusConfig[task.status]?.icon || statusConfig.pending.icon}
                    </span>
                    {viewMode === "week" && (
                      <span className="shrink-0 text-sm">
                        {getChildAvatar(task.assigned_to)}
                      </span>
                    )}
                    <span className="truncate font-medium">{task.name}</span>
                  </button>
                ))}
                {dayTasks.length > maxTasksToShow && (
                  <p className={cn(
                    "text-center text-muted-foreground",
                    viewMode === "week" ? "text-xs" : "text-[10px]"
                  )}>
                    +{dayTasks.length - maxTasksToShow} more
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t pt-4 md:gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => toggleStatusFilter(status)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all md:gap-2",
              statusFilters.includes(status)
                ? "bg-muted/50"
                : "opacity-40 hover:opacity-70"
            )}
          >
            <span className="text-xs md:text-sm">{config.icon}</span>
            <div className={cn("h-2.5 w-2.5 rounded-full border-2 md:h-3 md:w-3", config.color)} />
            <span className="text-[10px] font-medium capitalize text-muted-foreground md:text-xs">
              {config.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
