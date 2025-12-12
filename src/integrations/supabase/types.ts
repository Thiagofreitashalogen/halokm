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
      knowledge_entries: {
        Row: {
          category: Database["public"]["Enums"]["knowledge_category"]
          client: string | null
          created_at: string
          date_delivered: string | null
          deliverables: string[] | null
          description: string | null
          domain: string | null
          field: string | null
          full_description: string | null
          id: string
          learnings: string[] | null
          loss_factors: string[] | null
          loss_reasons: string | null
          offer_status: Database["public"]["Enums"]["offer_status"] | null
          offer_work_status:
            | Database["public"]["Enums"]["offer_work_status"]
            | null
          position: string | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          references_links: string[] | null
          source_drive_link: string | null
          source_miro_link: string | null
          start_date: string | null
          studio: string | null
          tags: string[] | null
          title: string
          updated_at: string
          use_cases: string[] | null
          win_factors: string[] | null
          winning_strategy: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["knowledge_category"]
          client?: string | null
          created_at?: string
          date_delivered?: string | null
          deliverables?: string[] | null
          description?: string | null
          domain?: string | null
          field?: string | null
          full_description?: string | null
          id?: string
          learnings?: string[] | null
          loss_factors?: string[] | null
          loss_reasons?: string | null
          offer_status?: Database["public"]["Enums"]["offer_status"] | null
          offer_work_status?:
            | Database["public"]["Enums"]["offer_work_status"]
            | null
          position?: string | null
          project_status?: Database["public"]["Enums"]["project_status"] | null
          references_links?: string[] | null
          source_drive_link?: string | null
          source_miro_link?: string | null
          start_date?: string | null
          studio?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          use_cases?: string[] | null
          win_factors?: string[] | null
          winning_strategy?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["knowledge_category"]
          client?: string | null
          created_at?: string
          date_delivered?: string | null
          deliverables?: string[] | null
          description?: string | null
          domain?: string | null
          field?: string | null
          full_description?: string | null
          id?: string
          learnings?: string[] | null
          loss_factors?: string[] | null
          loss_reasons?: string | null
          offer_status?: Database["public"]["Enums"]["offer_status"] | null
          offer_work_status?:
            | Database["public"]["Enums"]["offer_work_status"]
            | null
          position?: string | null
          project_status?: Database["public"]["Enums"]["project_status"] | null
          references_links?: string[] | null
          source_drive_link?: string | null
          source_miro_link?: string | null
          start_date?: string | null
          studio?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          use_cases?: string[] | null
          win_factors?: string[] | null
          winning_strategy?: string | null
        }
        Relationships: []
      }
      offer_method_links: {
        Row: {
          created_at: string
          id: string
          method_id: string
          offer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method_id: string
          offer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          method_id?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_method_links_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_method_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_people_links: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          person_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          person_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_people_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_people_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      people_client_links: {
        Row: {
          client_id: string
          created_at: string
          id: string
          person_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          person_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_client_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      people_method_expertise: {
        Row: {
          created_at: string
          id: string
          method_id: string
          person_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method_id: string
          person_id: string
        }
        Update: {
          created_at?: string
          id?: string
          method_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_method_expertise_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_method_expertise_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      project_method_links: {
        Row: {
          created_at: string
          id: string
          method_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          method_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_method_links_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_method_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      project_people_links: {
        Row: {
          created_at: string
          id: string
          person_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          person_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          person_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_people_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_people_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      knowledge_category: "project" | "offer" | "method" | "client" | "person"
      offer_status: "draft" | "pending" | "won" | "lost"
      offer_work_status: "under_development" | "delivered"
      project_status: "active" | "completed" | "archived"
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
      knowledge_category: ["project", "offer", "method", "client", "person"],
      offer_status: ["draft", "pending", "won", "lost"],
      offer_work_status: ["under_development", "delivered"],
      project_status: ["active", "completed", "archived"],
    },
  },
} as const
