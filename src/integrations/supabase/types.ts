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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      alert_notifications: {
        Row: {
          alert_id: string
          car_listing_id: string
          clicked_at: string | null
          id: string
          match_score: number
          opened_at: string | null
          sent_at: string
        }
        Insert: {
          alert_id: string
          car_listing_id: string
          clicked_at?: string | null
          id?: string
          match_score: number
          opened_at?: string | null
          sent_at?: string
        }
        Update: {
          alert_id?: string
          car_listing_id?: string
          clicked_at?: string | null
          id?: string
          match_score?: number
          opened_at?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "user_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_hash: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_hash?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      car_listings: {
        Row: {
          body_type: string
          boost_expires_at: string | null
          boost_level: string | null
          boost_warning_sent: boolean | null
          brand: string
          car_pass_verified: boolean | null
          color: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          ct_valid: boolean | null
          description: string | null
          doors: number | null
          euro_norm: string | null
          features: string[] | null
          first_registration: string | null
          fuel_type: string
          id: string
          location: string | null
          maintenance_book_complete: boolean | null
          mileage: number
          model: string
          photos: string[] | null
          power: number | null
          price: number
          seller_type: string | null
          status: string | null
          transmission: string
          tva_number: string | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number
        }
        Insert: {
          body_type: string
          boost_expires_at?: string | null
          boost_level?: string | null
          boost_warning_sent?: boolean | null
          brand: string
          car_pass_verified?: boolean | null
          color: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_type: string
          id?: string
          location?: string | null
          maintenance_book_complete?: boolean | null
          mileage: number
          model: string
          photos?: string[] | null
          power?: number | null
          price: number
          seller_type?: string | null
          status?: string | null
          transmission: string
          tva_number?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year: number
        }
        Update: {
          body_type?: string
          boost_expires_at?: string | null
          boost_level?: string | null
          boost_warning_sent?: boolean | null
          brand?: string
          car_pass_verified?: boolean | null
          color?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_type?: string
          id?: string
          location?: string | null
          maintenance_book_complete?: boolean | null
          mileage?: number
          model?: string
          photos?: string[] | null
          power?: number | null
          price?: number
          seller_type?: string | null
          status?: string | null
          transmission?: string
          tva_number?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      car_views: {
        Row: {
          car_listing_id: string
          id: string
          ip_hash: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          car_listing_id: string
          id?: string
          ip_hash?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          car_listing_id?: string
          id?: string
          ip_hash?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_views_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_views_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          car_brand: string | null
          car_image: string | null
          car_listing_id: string | null
          car_model: string | null
          created_at: string
          id: string
          last_message_at: string | null
          seller_id: string
        }
        Insert: {
          buyer_id: string
          car_brand?: string | null
          car_image?: string | null
          car_listing_id?: string | null
          car_model?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          seller_id: string
        }
        Update: {
          buyer_id?: string
          car_brand?: string | null
          car_image?: string | null
          car_listing_id?: string | null
          car_model?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_message_counts: {
        Row: {
          count: number
          created_at: string
          id: string
          message_date: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          message_date?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          message_date?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          car_listing_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          car_listing_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          car_listing_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_drafts: {
        Row: {
          created_at: string
          form_data: Json
          id: string
          photo_urls: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_data?: Json
          id?: string
          photo_urls?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_data?: Json
          id?: string
          photo_urls?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
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
      reports: {
        Row: {
          car_listing_id: string
          comment: string | null
          created_at: string
          id: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          car_listing_id: string
          comment?: string | null
          created_at?: string
          id?: string
          reason: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          car_listing_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          car_listing_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          car_listing_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          car_listing_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_car_listing_id_fkey"
            columns: ["car_listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          active: boolean
          created_at: string
          filters: Json
          frequency: string
          id: string
          last_sent_at: string | null
          match_count: number
          name: string
          notify_email: boolean
          notify_push: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          filters?: Json
          frequency?: string
          id?: string
          last_sent_at?: string | null
          match_count?: number
          name: string
          notify_email?: boolean
          notify_push?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          filters?: Json
          frequency?: string
          id?: string
          last_sent_at?: string | null
          match_count?: number
          name?: string
          notify_email?: boolean
          notify_push?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications_enabled: boolean
          id: string
          push_notifications_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          push_notifications_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          push_notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
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
      car_listings_public: {
        Row: {
          body_type: string | null
          boost_expires_at: string | null
          boost_level: string | null
          brand: string | null
          car_pass_verified: boolean | null
          color: string | null
          created_at: string | null
          ct_valid: boolean | null
          description: string | null
          doors: number | null
          euro_norm: string | null
          features: string[] | null
          first_registration: string | null
          fuel_type: string | null
          id: string | null
          location: string | null
          maintenance_book_complete: boolean | null
          mileage: number | null
          model: string | null
          photos: string[] | null
          power: number | null
          price: number | null
          seller_type: string | null
          status: string | null
          transmission: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          boost_expires_at?: string | null
          boost_level?: string | null
          brand?: string | null
          car_pass_verified?: boolean | null
          color?: string | null
          created_at?: string | null
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_type?: string | null
          id?: string | null
          location?: string | null
          maintenance_book_complete?: boolean | null
          mileage?: number | null
          model?: string | null
          photos?: string[] | null
          power?: number | null
          price?: number | null
          seller_type?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          boost_expires_at?: string | null
          boost_level?: string | null
          brand?: string | null
          car_pass_verified?: boolean | null
          color?: string | null
          created_at?: string | null
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_type?: string | null
          id?: string | null
          location?: string | null
          maintenance_book_complete?: boolean | null
          mileage?: number | null
          model?: string | null
          photos?: string[] | null
          power?: number | null
          price?: number | null
          seller_type?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_seller_contact: {
        Args: { listing_id: string }
        Returns: {
          contact_email: string
          contact_name: string
          contact_phone: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_suspended: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
