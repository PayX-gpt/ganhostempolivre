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
      funnel_audit_logs: {
        Row: {
          conversion_id: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_id: string | null
          payment_id: string | null
          redirect_url: string | null
          session_id: string
          status: string | null
          user_agent: string | null
        }
        Insert: {
          conversion_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_id?: string | null
          payment_id?: string | null
          redirect_url?: string | null
          session_id: string
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          conversion_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_id?: string | null
          payment_id?: string | null
          redirect_url?: string | null
          session_id?: string
          status?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          page_url: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          page_url?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          page_url?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      lead_behavior: {
        Row: {
          account_balance: string | null
          ai_insights: string | null
          checkout_click_count: number | null
          checkout_clicked: boolean | null
          created_at: string
          cta_clicks: number | null
          cta_hesitation_count: number | null
          cta_views: number | null
          dynamic_price: number | null
          faq_opened: string[] | null
          first_cta_click_ms: number | null
          first_cta_view_ms: number | null
          id: string
          intent_label: string | null
          intent_score: number | null
          max_scroll_depth: number | null
          quiz_answers: Json | null
          section_times: Json | null
          sections_viewed: string[] | null
          segment_tags: string[] | null
          session_id: string
          time_on_page_ms: number | null
          video_started: boolean | null
          video_watch_time_ms: number | null
        }
        Insert: {
          account_balance?: string | null
          ai_insights?: string | null
          checkout_click_count?: number | null
          checkout_clicked?: boolean | null
          created_at?: string
          cta_clicks?: number | null
          cta_hesitation_count?: number | null
          cta_views?: number | null
          dynamic_price?: number | null
          faq_opened?: string[] | null
          first_cta_click_ms?: number | null
          first_cta_view_ms?: number | null
          id?: string
          intent_label?: string | null
          intent_score?: number | null
          max_scroll_depth?: number | null
          quiz_answers?: Json | null
          section_times?: Json | null
          sections_viewed?: string[] | null
          segment_tags?: string[] | null
          session_id: string
          time_on_page_ms?: number | null
          video_started?: boolean | null
          video_watch_time_ms?: number | null
        }
        Update: {
          account_balance?: string | null
          ai_insights?: string | null
          checkout_click_count?: number | null
          checkout_clicked?: boolean | null
          created_at?: string
          cta_clicks?: number | null
          cta_hesitation_count?: number | null
          cta_views?: number | null
          dynamic_price?: number | null
          faq_opened?: string[] | null
          first_cta_click_ms?: number | null
          first_cta_view_ms?: number | null
          id?: string
          intent_label?: string | null
          intent_score?: number | null
          max_scroll_depth?: number | null
          quiz_answers?: Json | null
          section_times?: Json | null
          sections_viewed?: string[] | null
          segment_tags?: string[] | null
          session_id?: string
          time_on_page_ms?: number | null
          video_started?: boolean | null
          video_watch_time_ms?: number | null
        }
        Relationships: []
      }
      purchase_tracking: {
        Row: {
          amount: number | null
          conversion_api_sent: boolean | null
          created_at: string
          email: string | null
          event_id: string | null
          failure_reason: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          funnel_step: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          pixel_sent: boolean | null
          plan_id: string | null
          product_name: string | null
          redirect_completed: boolean | null
          redirect_completed_at: string | null
          redirect_source: string | null
          referrer: string | null
          session_id: string | null
          status: string | null
          transaction_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          utmify_sent: boolean | null
          vsl_variant: string | null
          whop_payment_id: string | null
        }
        Insert: {
          amount?: number | null
          conversion_api_sent?: boolean | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          failure_reason?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          funnel_step?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          pixel_sent?: boolean | null
          plan_id?: string | null
          product_name?: string | null
          redirect_completed?: boolean | null
          redirect_completed_at?: string | null
          redirect_source?: string | null
          referrer?: string | null
          session_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          utmify_sent?: boolean | null
          vsl_variant?: string | null
          whop_payment_id?: string | null
        }
        Update: {
          amount?: number | null
          conversion_api_sent?: boolean | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          failure_reason?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          funnel_step?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          pixel_sent?: boolean | null
          plan_id?: string | null
          product_name?: string | null
          redirect_completed?: boolean | null
          redirect_completed_at?: string | null
          redirect_source?: string | null
          referrer?: string | null
          session_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          utmify_sent?: boolean | null
          vsl_variant?: string | null
          whop_payment_id?: string | null
        }
        Relationships: []
      }
      redirect_metrics: {
        Row: {
          created_at: string
          from_page: string
          id: string
          redirect_duration_ms: number
          session_id: string
          to_page: string
        }
        Insert: {
          created_at?: string
          from_page: string
          id?: string
          redirect_duration_ms: number
          session_id: string
          to_page: string
        }
        Update: {
          created_at?: string
          from_page?: string
          id?: string
          redirect_duration_ms?: number
          session_id?: string
          to_page?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
