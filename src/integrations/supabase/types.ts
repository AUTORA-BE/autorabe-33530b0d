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
      belgian_annual_tax_brackets: {
        Row: {
          base_amount: number
          created_at: string
          cv_max: number
          cv_min: number
          diesel_surcharge_pct: number
          electric_amount: number
          id: string
          lpg_surcharge_per_cv: number
          notes: string | null
          region: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_amount: number
          created_at?: string
          cv_max: number
          cv_min: number
          diesel_surcharge_pct?: number
          electric_amount?: number
          id?: string
          lpg_surcharge_per_cv?: number
          notes?: string | null
          region: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_amount?: number
          created_at?: string
          cv_max?: number
          cv_min?: number
          diesel_surcharge_pct?: number
          electric_amount?: number
          id?: string
          lpg_surcharge_per_cv?: number
          notes?: string | null
          region?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      belgian_tmc_age_reductions: {
        Row: {
          age_max_years: number | null
          age_min_years: number
          coefficient: number
          created_at: string
          id: string
          region: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          age_max_years?: number | null
          age_min_years: number
          coefficient: number
          created_at?: string
          id?: string
          region: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          age_max_years?: number | null
          age_min_years?: number
          coefficient?: number
          created_at?: string
          id?: string
          region?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      belgian_tmc_brackets: {
        Row: {
          base_amount: number
          created_at: string
          cv_max: number
          cv_min: number
          id: string
          notes: string | null
          region: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_amount: number
          created_at?: string
          cv_max: number
          cv_min: number
          id?: string
          notes?: string | null
          region: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_amount?: number
          created_at?: string
          cv_max?: number
          cv_min?: number
          id?: string
          notes?: string | null
          region?: string
          updated_at?: string
          updated_by?: string | null
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
          car_pass_date: string | null
          car_pass_url: string | null
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
          search_vector: unknown
          seller_type: string | null
          status: string | null
          transmission: string
          tva_number: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          body_type: string
          boost_expires_at?: string | null
          boost_level?: string | null
          boost_warning_sent?: boolean | null
          brand: string
          car_pass_date?: string | null
          car_pass_url?: string | null
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
          search_vector?: unknown
          seller_type?: string | null
          status?: string | null
          transmission: string
          tva_number?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          body_type?: string
          boost_expires_at?: string | null
          boost_level?: string | null
          boost_warning_sent?: boolean | null
          brand?: string
          car_pass_date?: string | null
          car_pass_url?: string | null
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
          search_vector?: unknown
          seller_type?: string | null
          status?: string | null
          transmission?: string
          tva_number?: string | null
          updated_at?: string
          user_id?: string
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
      dealer_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          meta: Json
          queue_id: string | null
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
          queue_id?: string | null
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
          queue_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dealer_verification_queue: {
        Row: {
          admin_notes: string | null
          bce_snapshot: string | null
          garage_name_snapshot: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          bce_snapshot?: string | null
          garage_name_snapshot?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          bce_snapshot?: string | null
          garage_name_snapshot?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
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
      fuel_prices: {
        Row: {
          created_at: string
          diesel: number
          electric_home: number
          electric_public: number
          essence95: number
          essence98: number
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          diesel?: number
          electric_home?: number
          electric_public?: number
          essence95?: number
          essence98?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          diesel?: number
          electric_home?: number
          electric_public?: number
          essence95?: number
          essence98?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
          bce_number: string | null
          cover_image_url: string | null
          created_at: string
          display_name: string | null
          garage_name: string | null
          id: string
          opening_hours: string | null
          phone: string | null
          postal_code: string | null
          presentation: string | null
          services: string[] | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          user_id: string
          user_type: string
          vitrine_about: string | null
          vitrine_cover_url: string | null
          vitrine_email_public: string | null
          vitrine_phone: string | null
          vitrine_published: boolean
          vitrine_services: string[]
          vitrine_slug: string | null
        }
        Insert: {
          avatar_url?: string | null
          bce_number?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          garage_name?: string | null
          id?: string
          opening_hours?: string | null
          phone?: string | null
          postal_code?: string | null
          presentation?: string | null
          services?: string[] | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
          vitrine_about?: string | null
          vitrine_cover_url?: string | null
          vitrine_email_public?: string | null
          vitrine_phone?: string | null
          vitrine_published?: boolean
          vitrine_services?: string[]
          vitrine_slug?: string | null
        }
        Update: {
          avatar_url?: string | null
          bce_number?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          garage_name?: string | null
          id?: string
          opening_hours?: string | null
          phone?: string | null
          postal_code?: string | null
          presentation?: string | null
          services?: string[] | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          vitrine_about?: string | null
          vitrine_cover_url?: string | null
          vitrine_email_public?: string | null
          vitrine_phone?: string | null
          vitrine_published?: boolean
          vitrine_services?: string[]
          vitrine_slug?: string | null
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
      rate_limits: {
        Row: {
          count: number
          expires_at: string
          id: string
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          expires_at: string
          id?: string
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          expires_at?: string
          id?: string
          key?: string
          window_start?: string
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
      stripe_processed_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          payload_summary: Json | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          payload_summary?: Json | null
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          payload_summary?: Json | null
          processed_at?: string
        }
        Relationships: []
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
          car_pass_date: string | null
          car_pass_url: string | null
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
          search_vector: unknown
          seller_type: string | null
          status: string | null
          transmission: string | null
          tva_number: string | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          boost_expires_at?: string | null
          boost_level?: string | null
          brand?: string | null
          car_pass_date?: string | null
          car_pass_url?: string | null
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
          search_vector?: unknown
          seller_type?: string | null
          status?: string | null
          transmission?: string | null
          tva_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          boost_expires_at?: string | null
          boost_level?: string | null
          brand?: string | null
          car_pass_date?: string | null
          car_pass_url?: string | null
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
          search_vector?: unknown
          seller_type?: string | null
          status?: string | null
          transmission?: string | null
          tva_number?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      admin_get_listing_contacts: {
        Args: { _ids: string[] }
        Returns: {
          contact_email: string
          contact_name: string
          contact_phone: string
          id: string
        }[]
      }
      admin_get_user_emails: {
        Args: { _user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      admin_list_listings_with_contacts: {
        Args: { _limit?: number }
        Returns: {
          boost_level: string
          brand: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          description: string
          euro_norm: string
          fuel_type: string
          id: string
          location: string
          mileage: number
          model: string
          photos: string[]
          price: number
          seller_type: string
          status: string
          transmission: string
          user_id: string
          year: number
        }[]
      }
      check_rate_limit: {
        Args: { _key: string; _max_attempts: number; _window_seconds: number }
        Returns: boolean
      }
      clear_user_view_history: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_unique_vitrine_slug: {
        Args: { _desired: string; _user_id: string }
        Returns: string
      }
      get_active_cities_count: { Args: never; Returns: number }
      get_favorite_counts: {
        Args: { listing_ids: string[] }
        Returns: {
          car_listing_id: string
          favorite_count: number
        }[]
      }
      get_listing_for_buyer: {
        Args: { _listing_id: string }
        Returns: {
          body_type: string
          boost_expires_at: string
          boost_level: string
          brand: string
          car_pass_date: string
          car_pass_url: string
          car_pass_verified: boolean
          color: string
          created_at: string
          ct_valid: boolean
          description: string
          doors: number
          euro_norm: string
          features: string[]
          first_registration: string
          fuel_type: string
          id: string
          location: string
          maintenance_book_complete: boolean
          mileage: number
          model: string
          photos: string[]
          power: number
          price: number
          seller_type: string
          status: string
          transmission: string
          tva_number: string
          updated_at: string
          user_id: string
          year: number
        }[]
      }
      get_listing_popularity: {
        Args: { listing_ids: string[] }
        Returns: {
          favorite_count: number
          interaction_count: number
          listing_id: string
          view_count: number
        }[]
      }
      get_public_listing: {
        Args: { _listing_id: string }
        Returns: {
          body_type: string
          boost_expires_at: string
          boost_level: string
          brand: string
          car_pass_date: string
          car_pass_url: string
          car_pass_verified: boolean
          color: string
          created_at: string
          ct_valid: boolean
          description: string
          doors: number
          euro_norm: string
          features: string[]
          first_registration: string
          fuel_type: string
          id: string
          location: string
          maintenance_book_complete: boolean
          mileage: number
          model: string
          photos: string[]
          power: number
          price: number
          seller_type: string
          status: string
          transmission: string
          tva_number: string
          updated_at: string
          user_id: string
          year: number
        }[]
      }
      get_public_vitrine: {
        Args: { _slug_or_user: string }
        Returns: {
          avatar_url: string
          display_name: string
          garage_name: string
          postal_code: string
          user_id: string
          vitrine_about: string
          vitrine_cover_url: string
          vitrine_email_public: string
          vitrine_phone: string
          vitrine_services: string[]
          vitrine_slug: string
        }[]
      }
      get_seller_contact: {
        Args: { listing_id: string }
        Returns: {
          contact_email: string
          contact_name: string
          contact_phone: string
          user_id: string
        }[]
      }
      get_seller_display: {
        Args: { listing_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          garage_name: string
          user_id: string
          user_type: string
          vitrine_published: boolean
          vitrine_slug: string
        }[]
      }
      get_seller_public_listings: {
        Args: { _seller_id: string }
        Returns: {
          body_type: string
          boost_expires_at: string
          boost_level: string
          brand: string
          car_pass_verified: boolean
          color: string
          created_at: string
          ct_valid: boolean
          description: string
          doors: number
          euro_norm: string
          features: string[]
          first_registration: string
          fuel_type: string
          id: string
          location: string
          maintenance_book_complete: boolean
          mileage: number
          model: string
          photos: string[]
          power: number
          price: number
          seller_type: string
          status: string
          transmission: string
          year: number
        }[]
      }
      get_user_view_history: {
        Args: { _limit?: number }
        Returns: {
          body_type: string
          boost_expires_at: string
          boost_level: string
          brand: string
          car_pass_verified: boolean
          color: string
          created_at: string
          ct_valid: boolean
          description: string
          doors: number
          euro_norm: string
          features: string[]
          first_registration: string
          fuel_type: string
          id: string
          last_viewed_at: string
          location: string
          maintenance_book_complete: boolean
          mileage: number
          model: string
          photos: string[]
          power: number
          price: number
          seller_type: string
          status: string
          transmission: string
          updated_at: string
          year: number
        }[]
      }
      has_conversation_with_listing: {
        Args: { _listing_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_suspended: { Args: { _user_id: string }; Returns: boolean }
      is_vitrine_eligible: { Args: { _user_id: string }; Returns: boolean }
      is_vitrine_slug_available: {
        Args: { _slug: string; _user_id: string }
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
      search_public_vitrines: {
        Args: { _city?: string; _limit?: number; _q?: string }
        Returns: {
          avatar_url: string
          display_name: string
          garage_name: string
          postal_code: string
          user_id: string
          vitrine_about: string
          vitrine_cover_url: string
          vitrine_services: string[]
          vitrine_slug: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify_garage_name: { Args: { _input: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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
