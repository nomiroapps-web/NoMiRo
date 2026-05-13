import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configure your production domains via ALLOWED_ORIGINS env var (comma-separated)
const ALLOWED_ORIGIN_ENV = Deno.env.get('ALLOWED_ORIGINS') ?? '';
const allowedOrigins = [
  'https://nomiro.app',
  'https://www.nomiro.app',
  ...ALLOWED_ORIGIN_ENV.split(',').map((o: string) => o.trim()).filter(Boolean),
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

interface RecurringTask {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  difficulty: string | null;
  points: number | null;
  requires_photo: boolean | null;
  assigned_to: string;
  assigned_by: string | null;
  family_id: string;
  template_id: string | null;
  recurrence_type: string;
  recurrence_days: number[] | null;
}

interface Child {
  id: string;
  name: string;
  birthdate: string | null;
  family_id: string;
}

interface Family {
  id: string;
  owner_id: string;
  name: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      tasksCreated: 0,
      birthdayNotificationsSent: 0,
      errors: [] as string[],
    };

    // ==========================================
    // 1. RECURRING TASK AUTO-GENERATION
    // ==========================================
    
    const { data: completedRecurringTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "verified")
      .not("recurrence_type", "is", null);

    if (tasksError) {
      results.errors.push(`Error fetching recurring tasks: ${tasksError.message}`);
    } else if (completedRecurringTasks && completedRecurringTasks.length > 0) {
      for (const task of completedRecurringTasks as RecurringTask[]) {
        const nextDueDate = calculateNextDueDate(task);
        
        if (nextDueDate) {
          const { data: existingTask } = await supabase
            .from("tasks")
            .select("id")
            .eq("assigned_to", task.assigned_to)
            .eq("name", task.name)
            .eq("due_date", nextDueDate)
            .eq("status", "pending")
            .single();

          if (!existingTask) {
            const { error: insertError } = await supabase.from("tasks").insert({
              name: task.name,
              description: task.description,
              icon: task.icon,
              category: task.category,
              difficulty: task.difficulty,
              points: task.points,
              requires_photo: task.requires_photo,
              assigned_to: task.assigned_to,
              assigned_by: task.assigned_by,
              family_id: task.family_id,
              template_id: task.template_id,
              recurrence_type: task.recurrence_type,
              recurrence_days: task.recurrence_days,
              due_date: nextDueDate,
              status: "pending",
            });

            if (insertError) {
              results.errors.push(`Error creating task "${task.name}": ${insertError.message}`);
            } else {
              results.tasksCreated++;
              
              const { data: child } = await supabase
                .from("children")
                .select("user_id, name")
                .eq("id", task.assigned_to)
                .single();

              if (child?.user_id) {
                await supabase.from("notifications").insert({
                  user_id: child.user_id,
                  type: "task_assigned",
                  title: "New Task Assigned",
                  message: `Your recurring task "${task.name}" is ready for today!`,
                  related_task_id: task.id,
                });
              }
            }
          }
        }
      }
    }

    // ==========================================
    // 2. BIRTHDAY REMINDER NOTIFICATIONS
    // ==========================================
    
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select("id, name, birthdate, family_id")
      .not("birthdate", "is", null);

    if (childrenError) {
      results.errors.push(`Error fetching children: ${childrenError.message}`);
    } else if (children && children.length > 0) {
      for (const child of children as Child[]) {
        if (!child.birthdate) continue;

        const birthdate = new Date(child.birthdate);
        const birthMonth = birthdate.getMonth() + 1;
        const birthDay = birthdate.getDate();

        const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
        let nextBirthday = thisYearBirthday;
        
        if (thisYearBirthday < today) {
          nextBirthday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay);
        }

        const daysUntilBirthday = Math.ceil(
          (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const shouldNotify = daysUntilBirthday === 7 || daysUntilBirthday === 1 || daysUntilBirthday === 0;

        if (shouldNotify) {
          const { data: family } = await supabase
            .from("families")
            .select("owner_id, name")
            .eq("id", child.family_id)
            .single();

          if (family) {
            const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            const { data: existingNotification } = await supabase
              .from("notifications")
              .select("id")
              .eq("user_id", family.owner_id)
              .eq("type", "reminder")
              .eq("related_child_id", child.id)
              .gte("created_at", todayStart)
              .lte("created_at", todayEnd)
              .single();

            if (!existingNotification) {
              const age = today.getFullYear() - birthdate.getFullYear();
              let title: string;
              let message: string;

              if (daysUntilBirthday === 0) {
                title = `🎂 Happy Birthday ${child.name}!`;
                message = `Today is ${child.name}'s ${age}th birthday! Time to celebrate!`;
              } else if (daysUntilBirthday === 1) {
                title = `🎈 Birthday Tomorrow!`;
                message = `${child.name}'s ${age}th birthday is tomorrow! Don't forget to prepare!`;
              } else {
                title = `🎁 Birthday Coming Up!`;
                message = `${child.name}'s ${age}th birthday is in ${daysUntilBirthday} days!`;
              }

              const { error: notifError } = await supabase.from("notifications").insert({
                user_id: family.owner_id,
                type: "reminder",
                title,
                message,
                related_child_id: child.id,
              });

              if (notifError) {
                results.errors.push(`Error sending birthday notification: ${notifError.message}`);
              } else {
                results.birthdayNotificationsSent++;
              }
            }
          }
        }
      }
    }

    console.log("Scheduled tasks completed:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in scheduled-tasks:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

function calculateNextDueDate(task: RecurringTask): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (task.recurrence_type) {
    case "daily": {
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate.toISOString().split("T")[0];
    }

    case "weekly": {
      if (!task.recurrence_days || task.recurrence_days.length === 0) {
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 7);
        return nextDate.toISOString().split("T")[0];
      }

      const currentDay = today.getDay();
      const sortedDays = [...task.recurrence_days].sort((a, b) => a - b);

      for (const day of sortedDays) {
        if (day > currentDay) {
          const daysUntil = day - currentDay;
          const nextDate = new Date(today);
          nextDate.setDate(nextDate.getDate() + daysUntil);
          return nextDate.toISOString().split("T")[0];
        }
      }

      const daysUntil = 7 - currentDay + sortedDays[0];
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysUntil);
      return nextDate.toISOString().split("T")[0];
    }

    case "monthly": {
      const dayOfMonth = task.recurrence_days?.[0] || today.getDate();
      const nextDate = new Date(today);

      if (today.getDate() >= dayOfMonth) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));

      return nextDate.toISOString().split("T")[0];
    }

    default:
      return null;
  }
}
