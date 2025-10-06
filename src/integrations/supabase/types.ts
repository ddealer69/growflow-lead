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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          account_id: string
          created_at: string
          encrypted_key_ciphertext: string
          id: string
          is_active: boolean
          key_name: string | null
          service_name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          encrypted_key_ciphertext: string
          id?: string
          is_active?: boolean
          key_name?: string | null
          service_name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          encrypted_key_ciphertext?: string
          id?: string
          is_active?: boolean
          key_name?: string | null
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          id: string
          industry: string | null
          is_deleted: boolean
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_deleted?: boolean
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_deleted?: boolean
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_banners: {
        Row: {
          account_id: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_deleted: boolean
          name: string
          target_audience: string | null
          updated_at: string
          value_proposition: string | null
        }
        Insert: {
          account_id: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          target_audience?: string | null
          updated_at?: string
          value_proposition?: string | null
        }
        Update: {
          account_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          target_audience?: string | null
          updated_at?: string
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_banners_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_banners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      smtp_credentials: {
        Row: {
          account_id: string
          created_at: string
          encrypted_password_ciphertext: string
          from_email: string
          from_name: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          provider_name: string
          rate_limit_per_hour: number
          smtp_host: string
          smtp_port: number
          smtp_username: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          encrypted_password_ciphertext: string
          from_email: string
          from_name?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          provider_name: string
          rate_limit_per_hour?: number
          smtp_host: string
          smtp_port: number
          smtp_username: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          encrypted_password_ciphertext?: string
          from_email?: string
          from_name?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          provider_name?: string
          rate_limit_per_hour?: number
          smtp_host?: string
          smtp_port?: number
          smtp_username?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smtp_credentials_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_id: string
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "member"
      campaign_status:
        | "draft"
        | "scheduled"
        | "in_progress"
        | "paused"
        | "completed"
        | "cancelled"
      enrichment_status: "pending" | "in_progress" | "enriched" | "failed"
      query_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "failed"
        | "paused"
      send_status:
        | "queued"
        | "sending"
        | "sent"
        | "failed"
        | "bounced"
        | "opened"
        | "clicked"
      social_platform:
        | "instagram"
        | "facebook"
        | "youtube"
        | "blog"
        | "linkedin"
      task_status:
        | "pending"
        | "claimed"
        | "processing"
        | "completed"
        | "failed"
        | "retry"
      task_type:
        | "fetch_google_page"
        | "apify_enrich"
        | "send_email"
        | "generate_social"
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
      app_role: ["owner", "admin", "member"],
      campaign_status: [
        "draft",
        "scheduled",
        "in_progress",
        "paused",
        "completed",
        "cancelled",
      ],
      enrichment_status: ["pending", "in_progress", "enriched", "failed"],
      query_status: ["pending", "in_progress", "completed", "failed", "paused"],
      send_status: [
        "queued",
        "sending",
        "sent",
        "failed",
        "bounced",
        "opened",
        "clicked",
      ],
      social_platform: ["instagram", "facebook", "youtube", "blog", "linkedin"],
      task_status: [
        "pending",
        "claimed",
        "processing",
        "completed",
        "failed",
        "retry",
      ],
      task_type: [
        "fetch_google_page",
        "apify_enrich",
        "send_email",
        "generate_social",
      ],
    },
  },
} as const
