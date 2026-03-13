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
      campaign_costs: {
        Row: {
          campaign_name: string
          cost_date: string
          created_at: string
          daily_spend: number
          id: string
          updated_at: string
        }
        Insert: {
          campaign_name: string
          cost_date?: string
          created_at?: string
          daily_spend?: number
          id?: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          cost_date?: string
          created_at?: string
          daily_spend?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_session_map: {
        Row: {
          created_at: string
          email: string
          id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          session_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          session_id?: string
        }
        Relationships: []
      }
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
      phone_session_map: {
        Row: {
          created_at: string
          id: string
          phone: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
          session_id?: string
        }
        Relationships: []
      }
      purchase_tracking: {
        Row: {
          amount: number | null
          buyer_name: string | null
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
          buyer_name?: string | null
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
          buyer_name?: string | null
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
      session_attribution: {
        Row: {
          attribution_method: string | null
          created_at: string
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          quiz_variant: string | null
          referrer: string | null
          session_id: string
          ttclid: string | null
          ttp: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          attribution_method?: string | null
          created_at?: string
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          quiz_variant?: string | null
          referrer?: string | null
          session_id: string
          ttclid?: string | null
          ttp?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          attribution_method?: string | null
          created_at?: string
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          quiz_variant?: string | null
          referrer?: string | null
          session_id?: string
          ttclid?: string | null
          ttp?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          direction: string
          id: string
          lead_name: string | null
          message: string
          phone: string
          session_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          direction?: string
          id?: string
          lead_name?: string | null
          message: string
          phone: string
          session_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          direction?: string
          id?: string
          lead_name?: string | null
          message?: string
          phone?: string
          session_id?: string | null
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          health_status: string | null
          id: string
          instance_id: string
          is_active: boolean
          label: string
          last_error: string | null
          last_health_check: string | null
          messages_sent: number | null
          priority: number | null
          token: string
        }
        Insert: {
          created_at?: string
          health_status?: string | null
          id?: string
          instance_id: string
          is_active?: boolean
          label?: string
          last_error?: string | null
          last_health_check?: string | null
          messages_sent?: number | null
          priority?: number | null
          token: string
        }
        Update: {
          created_at?: string
          health_status?: string | null
          id?: string
          instance_id?: string
          is_active?: boolean
          label?: string
          last_error?: string | null
          last_health_check?: string | null
          messages_sent?: number | null
          priority?: number | null
          token?: string
        }
        Relationships: []
      }
      whatsapp_pending_followups: {
        Row: {
          created_at: string
          id: string
          last_incoming_message: string | null
          lead_name: string | null
          phone: string
          reason: string | null
          resolved: boolean | null
          resolved_at: string | null
          unanswered_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_incoming_message?: string | null
          lead_name?: string | null
          phone: string
          reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          unanswered_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_incoming_message?: string | null
          lead_name?: string | null
          phone?: string
          reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          unanswered_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_welcome_queue: {
        Row: {
          created_at: string
          id: string
          lead_name: string | null
          lead_type: string
          phone: string
          purchased: boolean
          purchased_at: string | null
          send_at: string
          sent: boolean
          sent_at: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_name?: string | null
          lead_type?: string
          phone: string
          purchased?: boolean
          purchased_at?: string | null
          send_at: string
          sent?: boolean
          sent_at?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_name?: string | null
          lead_type?: string
          phone?: string
          purchased?: boolean
          purchased_at?: string | null
          send_at?: string
          sent?: boolean
          sent_at?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ab_summary_by_date: { Args: { target_date?: string }; Returns: Json }
      get_ab_summary_range: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      get_campaign_stats_today: {
        Args: never
        Returns: {
          campaign: string
          checkouts: number
          conv_rate: number
          leads: number
          refunds: number
          revenue: number
          sales: number
        }[]
      }
      get_creative_stats_today: {
        Args: never
        Returns: {
          channel: string
          checkouts: number
          conv_rate: number
          creative: string
          leads: number
          revenue: number
          sales: number
        }[]
      }
      get_dashboard_summary_today: { Args: never; Returns: Json }
      url_decode: { Args: { input: string }; Returns: string }
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
