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
      website_page_views: {
        Row: { id: string; viewed_at: string }
        Insert: { id: string; viewed_at?: string }
        Update: { id?: string; viewed_at?: string }
        Relationships: []
      }
      organization_branding: {
        Row: { id: boolean; logo_path: string | null; updated_at: string }
        Insert: { id?: boolean; logo_path?: string | null; updated_at?: string }
        Update: { id?: boolean; logo_path?: string | null; updated_at?: string }
        Relationships: []
      }
      document_download_requests: {
        Row: {
          id: string
          document_id: string | null
          document_name: string
          requester_name: string
          requester_email: string
          decision: 'pending' | 'approved' | 'rejected'
          email_status: 'not_sent' | 'sending' | 'sent' | 'failed' | 'unknown'
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          approved_storage_path: string | null
          approved_document_name: string | null
          current_attempt_id: string | null
          sending_started_at: string | null
          sent_at: string | null
          link_expires_at: string | null
          last_error: string | null
        }
        Insert: {
          id?: string
          document_id?: string | null
          document_name: string
          requester_name: string
          requester_email: string
          decision?: 'pending' | 'approved' | 'rejected'
          email_status?: 'not_sent' | 'sending' | 'sent' | 'failed' | 'unknown'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          approved_storage_path?: string | null
          approved_document_name?: string | null
          current_attempt_id?: string | null
          sending_started_at?: string | null
          sent_at?: string | null
          link_expires_at?: string | null
          last_error?: string | null
        }
        Update: {
          id?: string
          document_id?: string | null
          document_name?: string
          requester_name?: string
          requester_email?: string
          decision?: 'pending' | 'approved' | 'rejected'
          email_status?: 'not_sent' | 'sending' | 'sent' | 'failed' | 'unknown'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          approved_storage_path?: string | null
          approved_document_name?: string | null
          current_attempt_id?: string | null
          sending_started_at?: string | null
          sent_at?: string | null
          link_expires_at?: string | null
          last_error?: string | null
        }
        Relationships: [{ foreignKeyName: 'document_download_requests_document_id_fkey'; columns: ['document_id']; isOneToOne: false; referencedRelation: 'documents'; referencedColumns: ['id'] }]
      }
      document_email_attempts: {
        Row: {
          id: string
          request_id: string
          actor_id: string | null
          status: 'sending' | 'sent' | 'failed' | 'unknown'
          created_at: string
          finished_at: string | null
          link_expires_at: string | null
          message_id: string | null
          error_code: string | null
        }
        Insert: {
          id: string
          request_id: string
          actor_id?: string | null
          status?: 'sending' | 'sent' | 'failed' | 'unknown'
          created_at?: string
          finished_at?: string | null
          link_expires_at?: string | null
          message_id?: string | null
          error_code?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          actor_id?: string | null
          status?: 'sending' | 'sent' | 'failed' | 'unknown'
          created_at?: string
          finished_at?: string | null
          link_expires_at?: string | null
          message_id?: string | null
          error_code?: string | null
        }
        Relationships: [{ foreignKeyName: 'document_email_attempts_request_id_fkey'; columns: ['request_id']; isOneToOne: false; referencedRelation: 'document_download_requests'; referencedColumns: ['id'] }]
      }
      gallery_albums: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      gallery_photos: {
        Row: { sort_order: number; id: string; storage_path: string; caption: string; album_id: string | null; created_at: string }
        Insert: { sort_order?: number; id?: string; storage_path: string; caption?: string; album_id?: string | null; created_at?: string }
        Update: { sort_order?: number; id?: string; storage_path?: string; caption?: string; album_id?: string | null; created_at?: string }
        Relationships: [{ foreignKeyName: "gallery_photos_album_id_fkey"; columns: ["album_id"]; isOneToOne: false; referencedRelation: "gallery_albums"; referencedColumns: ["id"] }]
      }
      agenda: {
        Row: {
          created_at: string
          event_date: string
          event_time: string
          id: string
          location: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_time: string
          id?: string
          location: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_time?: string
          id?: string
          location?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          category: string
          content: string | null
          created_at: string
          id: string
          is_new: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          is_new?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          is_new?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          category: string
          created_at: string
          department: string | null
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          department?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_type: string
          storage_path: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string
          storage_path: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string
          storage_path?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotline_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      organization_structure: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string
          id: string
          jobdesk: string | null
          level: number
          name: string
          parent_id: string | null
          position: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department: string
          id?: string
          jobdesk?: string | null
          level?: number
          name: string
          parent_id?: string | null
          position: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string
          id?: string
          jobdesk?: string | null
          level?: number
          name?: string
          parent_id?: string | null
          position?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_structure_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organization_structure"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      record_website_view: { Args: { p_event_id: string }; Returns: undefined }
      get_website_view_stats: { Args: Record<PropertyKey, never>; Returns: Json }
      set_organization_logo: { Args: { p_path: string; p_expected_path: string | null }; Returns: undefined }
      save_gallery_order: { Args: { p_photo_ids: string[]; p_expected_ids: string[] }; Returns: undefined }
      list_document_catalog: {
        Args: Record<PropertyKey, never>
        Returns: { id: string; name: string; description: string | null; file_type: string; created_at: string }[]
      }
      submit_document_request: { Args: { p_document_id: string; p_name: string; p_email: string }; Returns: string }
      claim_document_review: { Args: { p_request_id: string; p_actor: string; p_action: string; p_confirm_unknown?: boolean }; Returns: Json }
      finish_document_email: { Args: { p_request_id: string; p_attempt_id: string; p_status: string; p_expires_at?: string | null; p_error?: string | null; p_message_id?: string | null }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
