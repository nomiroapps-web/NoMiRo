export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          points_required: number | null
          tasks_required: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points_required?: number | null
          tasks_required?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points_required?: number | null
          tasks_required?: number | null
        }
        Relationships: []
      }
      child_achievements: {
        Row: {
          achievement_id: string
          child_id: string
          earned_at: string
          id: string
        }
        Insert: {
          achievement_id: string
          child_id: string
          earned_at?: string
          id?: string
        }
        Update: {
          achievement_id?: string
          child_id?: string
          earned_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_achievements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number | null
          avatar_index: number | null
          birthdate: string | null
          created_at: string
          email: string | null
          family_id: string
          id: string
          level: number | null
          name: string
          pin_code: string | null
          points_balance: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age?: number | null
          avatar_index?: number | null
          birthdate?: string | null
          created_at?: string
          email?: string | null
          family_id: string
          id?: string
          level?: number | null
          name: string
          pin_code?: string | null
          points_balance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: number | null
          avatar_index?: number | null
          birthdate?: string | null
          created_at?: string
          email?: string | null
          family_id?: string
          id?: string
          level?: number | null
          name?: string
          pin_code?: string | null
          points_balance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          currency_code: string | null
          currency_symbol: string | null
          id: string
          locale: string | null
          name: string
          owner_id: string
          point_to_currency_rate: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          id?: string
          locale?: string | null
          name: string
          owner_id: string
          point_to_currency_rate?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          id?: string
          locale?: string | null
          name?: string
          owner_id?: string
          point_to_currency_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          family_id: string
          id?: string
          invited_by: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          family_id?: string
          id?: string
          invited_by?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          icon: string | null
          id: string
          is_read: boolean | null
          message: string | null
          related_child_id: string | null
          related_reward_id: string | null
          related_task_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_child_id?: string | null
          related_reward_id?: string | null
          related_task_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_child_id?: string | null
          related_reward_id?: string | null
          related_task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_child_id_fkey"
            columns: ["related_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_reward_id_fkey"
            columns: ["related_reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          child_id: string
          created_at: string
          description: string | null
          id: string
          redemption_id: string | null
          task_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          child_id: string
          created_at?: string
          description?: string | null
          id?: string
          redemption_id?: string | null
          task_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          child_id?: string
          created_at?: string
          description?: string | null
          id?: string
          redemption_id?: string | null
          task_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          two_factor_code: string | null
          two_factor_code_expires_at: string | null
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          two_factor_code?: string | null
          two_factor_code_expires_at?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          two_factor_code?: string | null
          two_factor_code_expires_at?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          child_id: string
          created_at: string
          id: string
          points_spent: number
          reward_id: string
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          child_id: string
          created_at?: string
          id?: string
          points_spent: number
          reward_id: string
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          child_id?: string
          created_at?: string
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: Database["public"]["Enums"]["reward_category"] | null
          created_at: string
          description: string | null
          family_id: string
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_cost: number
          quantity_limit: number | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["reward_category"] | null
          created_at?: string
          description?: string | null
          family_id: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_cost: number
          quantity_limit?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["reward_category"] | null
          created_at?: string
          description?: string | null
          family_id?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_cost?: number
          quantity_limit?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          category: Database["public"]["Enums"]["task_category"] | null
          created_at: string
          default_points: number | null
          description: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"] | null
          family_id: string
          icon: string | null
          id: string
          name: string
          requires_photo: boolean | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string
          default_points?: number | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"] | null
          family_id: string
          icon?: string | null
          id?: string
          name: string
          requires_photo?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string
          default_points?: number | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"] | null
          family_id?: string
          icon?: string | null
          id?: string
          name?: string
          requires_photo?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string
          category: Database["public"]["Enums"]["task_category"] | null
          completed_at: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"] | null
          due_date: string | null
          family_id: string
          icon: string | null
          id: string
          name: string
          photo_url: string | null
          points: number | null
          recurrence_days: number[] | null
          recurrence_type: string | null
          rejection_reason: string | null
          requires_photo: boolean | null
          status: Database["public"]["Enums"]["task_status"] | null
          template_id: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to: string
          category?: Database["public"]["Enums"]["task_category"] | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"] | null
          due_date?: string | null
          family_id: string
          icon?: string | null
          id?: string
          name: string
          photo_url?: string | null
          points?: number | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          rejection_reason?: string | null
          requires_photo?: boolean | null
          status?: Database["public"]["Enums"]["task_status"] | null
          template_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string
          category?: Database["public"]["Enums"]["task_category"] | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"] | null
          due_date?: string | null
          family_id?: string
          icon?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          points?: number | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          rejection_reason?: string | null
          requires_photo?: boolean | null
          status?: Database["public"]["Enums"]["task_status"] | null
          template_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_2fa_code: { Args: never; Returns: string }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_owner: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      set_child_pin: {
        Args: { _child_id: string; _pin: string }
        Returns: undefined
      }
      verify_child_pin: {
        Args: { _child_id: string; _pin: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_type:
        | "task_assigned"
        | "task_completed"
        | "task_verified"
        | "task_rejected"
        | "reward_requested"
        | "reward_approved"
        | "reward_denied"
        | "points_earned"
        | "achievement_unlocked"
        | "reminder"
      reward_category:
        | "screen_time"
        | "privileges"
        | "toys"
        | "outings"
        | "treats"
        | "money"
        | "other"
      task_category:
        | "cleaning"
        | "organizing"
        | "pet_care"
        | "meal_help"
        | "yard_work"
        | "self_care"
        | "homework"
        | "other"
      task_difficulty: "beginner" | "intermediate" | "advanced"
      task_status: "pending" | "completed" | "verified" | "rejected"
      user_role: "parent" | "child"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_type: [
        "task_assigned",
        "task_completed",
        "task_verified",
        "task_rejected",
        "reward_requested",
        "reward_approved",
        "reward_denied",
        "points_earned",
        "achievement_unlocked",
        "reminder",
      ],
      reward_category: [
        "screen_time",
        "privileges",
        "toys",
        "outings",
        "treats",
        "money",
        "other",
      ],
      task_category: [
        "cleaning",
        "organizing",
        "pet_care",
        "meal_help",
        "yard_work",
        "self_care",
        "homework",
        "other",
      ],
      task_difficulty: ["beginner", "intermediate", "advanced"],
      task_status: ["pending", "completed", "verified", "rejected"],
      user_role: ["parent", "child"],
    },
  },
} as const
