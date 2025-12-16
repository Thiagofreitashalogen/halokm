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
      content_draft_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          content: string
          created_at: string
          draft_id: string
          id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          content: string
          created_at?: string
          draft_id: string
          id?: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          content?: string
          created_at?: string
          draft_id?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_draft_versions_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "content_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          challenges: string[] | null
          created_at: string
          created_by: string | null
          currently_editing_by: string | null
          currently_editing_since: string | null
          deliverables: string[] | null
          draft_content: string | null
          id: string
          referenced_methods: string[] | null
          referenced_offers: string[] | null
          requirements: string[] | null
          selected_style_guide_id: string | null
          selected_template_id: string | null
          status: string
          tender_summary: string | null
          title: string
          updated_at: string
          winning_strategy: string | null
        }
        Insert: {
          challenges?: string[] | null
          created_at?: string
          created_by?: string | null
          currently_editing_by?: string | null
          currently_editing_since?: string | null
          deliverables?: string[] | null
          draft_content?: string | null
          id?: string
          referenced_methods?: string[] | null
          referenced_offers?: string[] | null
          requirements?: string[] | null
          selected_style_guide_id?: string | null
          selected_template_id?: string | null
          status?: string
          tender_summary?: string | null
          title: string
          updated_at?: string
          winning_strategy?: string | null
        }
        Update: {
          challenges?: string[] | null
          created_at?: string
          created_by?: string | null
          currently_editing_by?: string | null
          currently_editing_since?: string | null
          deliverables?: string[] | null
          draft_content?: string | null
          id?: string
          referenced_methods?: string[] | null
          referenced_offers?: string[] | null
          requirements?: string[] | null
          selected_style_guide_id?: string | null
          selected_template_id?: string | null
          status?: string
          tender_summary?: string | null
          title?: string
          updated_at?: string
          winning_strategy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_selected_style_guide_id_fkey"
            columns: ["selected_style_guide_id"]
            isOneToOne: false
            referencedRelation: "style_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_selected_template_id_fkey"
            columns: ["selected_template_id"]
            isOneToOne: false
            referencedRelation: "offer_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_parsing_jobs: {
        Row: {
          content: string | null
          created_at: string
          error: string | null
          file_name: string
          id: string
          metadata: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          error?: string | null
          file_name: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          error?: string | null
          file_name?: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_entries: {
        Row: {
          category: Database["public"]["Enums"]["knowledge_category"]
          client: string | null
          created_at: string
          date_delivered: string | null
          deliverables: string[] | null
          description: string | null
          domain: string | null
          end_date: string | null
          field: string | null
          full_description: string | null
          id: string
          industry: string | null
          learnings: string[] | null
          learnings_text: string | null
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
          end_date?: string | null
          field?: string | null
          full_description?: string | null
          id?: string
          industry?: string | null
          learnings?: string[] | null
          learnings_text?: string | null
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
          end_date?: string | null
          field?: string | null
          full_description?: string | null
          id?: string
          industry?: string | null
          learnings?: string[] | null
          learnings_text?: string | null
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
      offer_client_links: {
        Row: {
          client_id: string
          created_at: string
          id: string
          offer_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          offer_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_client_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
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
      offer_templates: {
        Row: {
          created_at: string
          description: string | null
          extracted_structure: Json | null
          file_name: string
          file_url: string
          id: string
          name: string
          placeholders: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          extracted_structure?: Json | null
          file_name: string
          file_url: string
          id?: string
          name: string
          placeholders?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          extracted_structure?: Json | null
          file_name?: string
          file_url?: string
          id?: string
          name?: string
          placeholders?: string[] | null
          updated_at?: string
        }
        Relationships: []
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
      project_client_links: {
        Row: {
          client_id: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: []
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
      style_guides: {
        Row: {
          brand_colors: Json | null
          created_at: string
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          name: string
          tone_of_voice: string | null
          typography_rules: Json | null
          updated_at: string
          writing_guidelines: string | null
        }
        Insert: {
          brand_colors?: Json | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name: string
          tone_of_voice?: string | null
          typography_rules?: Json | null
          updated_at?: string
          writing_guidelines?: string | null
        }
        Update: {
          brand_colors?: Json | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
          tone_of_voice?: string | null
          typography_rules?: Json | null
          updated_at?: string
          writing_guidelines?: string | null
        }
        Relationships: []
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
