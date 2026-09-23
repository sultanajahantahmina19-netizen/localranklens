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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_demo: boolean
          metadata: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      audit_findings: {
        Row: {
          audit_id: string
          category: string
          check_key: string
          created_at: string
          id: string
          impact: string
          label: string
          points_earned: number
          recommendation: string
          sort_order: number
          status: Database["public"]["Enums"]["check_status"]
          weight: number
        }
        Insert: {
          audit_id: string
          category: string
          check_key: string
          created_at?: string
          id?: string
          impact: string
          label: string
          points_earned: number
          recommendation: string
          sort_order?: number
          status: Database["public"]["Enums"]["check_status"]
          weight: number
        }
        Update: {
          audit_id?: string
          category?: string
          check_key?: string
          created_at?: string
          id?: string
          impact?: string
          label?: string
          points_earned?: number
          recommendation?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["check_status"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          business_name: string
          category_scores: Json
          city: string
          created_at: string
          engine_version: string
          grade: string
          id: string
          inputs: Json
          is_demo: boolean
          location_id: string | null
          overall_score: number
          primary_category: string
          user_id: string
        }
        Insert: {
          business_name: string
          category_scores?: Json
          city: string
          created_at?: string
          engine_version?: string
          grade: string
          id?: string
          inputs?: Json
          is_demo?: boolean
          location_id?: string | null
          overall_score: number
          primary_category: string
          user_id: string
        }
        Update: {
          business_name?: string
          category_scores?: Json
          city?: string
          created_at?: string
          engine_version?: string
          grade?: string
          id?: string
          inputs?: Json
          is_demo?: boolean
          location_id?: string | null
          overall_score?: number
          primary_category?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_demo: boolean
          message: string
          name: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_demo?: boolean
          message: string
          name: string
          status?: Database["public"]["Enums"]["message_status"]
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_demo?: boolean
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          business_name: string
          city: string
          country: string | null
          created_at: string
          id: string
          is_demo: boolean
          notes: string | null
          phone: string | null
          primary_category: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          business_name: string
          city: string
          country?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          phone?: string | null
          primary_category: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          business_name?: string
          city?: string
          country?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          phone?: string | null
          primary_category?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          audits_per_month: number | null
          description: string
          features: Json
          key: Database["public"]["Enums"]["plan_key"]
          location_limit: number | null
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          sort_order: number
          white_label: boolean
        }
        Insert: {
          audits_per_month?: number | null
          description: string
          features?: Json
          key: Database["public"]["Enums"]["plan_key"]
          location_limit?: number | null
          name: string
          price_monthly_cents: number
          price_yearly_cents: number
          sort_order?: number
          white_label?: boolean
        }
        Update: {
          audits_per_month?: number | null
          description?: string
          features?: Json
          key?: Database["public"]["Enums"]["plan_key"]
          location_limit?: number | null
          name?: string
          price_monthly_cents?: number
          price_yearly_cents?: number
          sort_order?: number
          white_label?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          plan: Database["public"]["Enums"]["plan_key"]
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_demo?: boolean
          plan?: Database["public"]["Enums"]["plan_key"]
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          plan?: Database["public"]["Enums"]["plan_key"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audits_used_this_month: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      check_status: "pass" | "warn" | "fail"
      message_status: "new" | "read" | "archived"
      plan_key: "free" | "pro" | "agency"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      check_status: ["pass", "warn", "fail"],
      message_status: ["new", "read", "archived"],
      plan_key: ["free", "pro", "agency"],
    },
  },
} as const
