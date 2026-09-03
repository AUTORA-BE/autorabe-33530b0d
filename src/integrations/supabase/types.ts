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
          boost_rank: number | null
          boost_warning_sent: boolean | null
          brand: string
          car_pass_date: string | null
          car_pass_request_id: string | null
          car_pass_status: string
          car_pass_url: string | null
          car_pass_verified: boolean | null
          co2: number | null
          co2_cycle: string | null
          color: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          coordinates: unknown
          created_at: string
          ct_valid: boolean | null
          description: string | null
          doors: number | null
          euro_norm: string | null
          features: string[] | null
          first_registration: string | null
          fuel_consumption: number | null
          fuel_type: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          maintenance_book_complete: boolean | null
          mileage: number
          mma: number | null
          model: string
          needs_review: boolean
          photos: string[] | null
          power: number | null
          price: number
          puissance_cv: number | null
          reference_url: string | null
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
          boost_rank?: number | null
          boost_warning_sent?: boolean | null
          brand: string
          car_pass_date?: string | null
          car_pass_request_id?: string | null
          car_pass_status?: string
          car_pass_url?: string | null
          car_pass_verified?: boolean | null
          co2?: number | null
          co2_cycle?: string | null
          color: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          coordinates?: unknown
          created_at?: string
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_consumption?: number | null
          fuel_type: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          maintenance_book_complete?: boolean | null
          mileage: number
          mma?: number | null
          model: string
          needs_review?: boolean
          photos?: string[] | null
          power?: number | null
          price: number
          puissance_cv?: number | null
          reference_url?: string | null
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
          boost_rank?: number | null
          boost_warning_sent?: boolean | null
          brand?: string
          car_pass_date?: string | null
          car_pass_request_id?: string | null
          car_pass_status?: string
          car_pass_url?: string | null
          car_pass_verified?: boolean | null
          co2?: number | null
          co2_cycle?: string | null
          color?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          coordinates?: unknown
          created_at?: string
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_consumption?: number | null
          fuel_type?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          maintenance_book_complete?: boolean | null
          mileage?: number
          mma?: number | null
          model?: string
          needs_review?: boolean
          photos?: string[] | null
          power?: number | null
          price?: number
          puissance_cv?: number | null
          reference_url?: string | null
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
      car_pass_verification_requests: {
        Row: {
          api_response: Json | null
          completed_at: string | null
          error_message: string | null
          id: string
          listing_id: string
          requested_at: string
          requested_by: string | null
          status: string
        }
        Insert: {
          api_response?: Json | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          listing_id: string
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          api_response?: Json | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          listing_id?: string
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_pass_verification_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_pass_verification_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
            referencedColumns: ["id"]
          },
        ]
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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          message: string
          name: string
          replied_at: string | null
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          message: string
          name: string
          replied_at?: string | null
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          message?: string
          name?: string
          replied_at?: string | null
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
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
      dealer_kyc: {
        Row: {
          address: string | null
          bce_number: string | null
          created_at: string
          document_path: string | null
          id: string
          legal_name: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_note: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          bce_number?: string | null
          created_at?: string
          document_path?: string | null
          id?: string
          legal_name?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          bce_number?: string | null
          created_at?: string
          document_path?: string | null
          id?: string
          legal_name?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
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
      ops_alerts: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          notified_at: string | null
          severity: string
          source: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          notified_at?: string | null
          severity?: string
          source: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          notified_at?: string | null
          severity?: string
          source?: string
        }
        Relationships: []
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
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
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
          boost_rank: number | null
          brand: string | null
          car_pass_date: string | null
          car_pass_status: string | null
          car_pass_verified: boolean | null
          co2: number | null
          co2_cycle: string | null
          color: string | null
          created_at: string | null
          ct_valid: boolean | null
          description: string | null
          doors: number | null
          euro_norm: string | null
          features: string[] | null
          first_registration: string | null
          fuel_consumption: number | null
          fuel_type: string | null
          id: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          maintenance_book_complete: boolean | null
          mileage: number | null
          mma: number | null
          model: string | null
          photos: string[] | null
          power: number | null
          price: number | null
          puissance_cv: number | null
          reference_url: string | null
          seller_type: string | null
          status: string | null
          transmission: string | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          boost_expires_at?: string | null
          boost_level?: string | null
          boost_rank?: number | null
          brand?: string | null
          car_pass_date?: string | null
          car_pass_status?: string | null
          car_pass_verified?: boolean | null
          co2?: number | null
          co2_cycle?: string | null
          color?: string | null
          created_at?: string | null
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_consumption?: number | null
          fuel_type?: string | null
          id?: string | null
          latitude?: never
          location?: string | null
          longitude?: never
          maintenance_book_complete?: boolean | null
          mileage?: number | null
          mma?: number | null
          model?: string | null
          photos?: string[] | null
          power?: number | null
          price?: number | null
          puissance_cv?: number | null
          reference_url?: string | null
          seller_type?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          boost_expires_at?: string | null
          boost_level?: string | null
          boost_rank?: number | null
          brand?: string | null
          car_pass_date?: string | null
          car_pass_status?: string | null
          car_pass_verified?: boolean | null
          co2?: number | null
          co2_cycle?: string | null
          color?: string | null
          created_at?: string | null
          ct_valid?: boolean | null
          description?: string | null
          doors?: number | null
          euro_norm?: string | null
          features?: string[] | null
          first_registration?: string | null
          fuel_consumption?: number | null
          fuel_type?: string | null
          id?: string | null
          latitude?: never
          location?: string | null
          longitude?: never
          maintenance_book_complete?: boolean | null
          mileage?: number | null
          mma?: number | null
          model?: string | null
          photos?: string[] | null
          power?: number | null
          price?: number | null
          puissance_cv?: number | null
          reference_url?: string | null
          seller_type?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
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
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_get_listing_contacts: {
        Args: { _ids: string[] }
        Returns: {
          contact_email: string
          contact_name: string
          contact_phone: string
          id: string
        }[]
      }
      admin_get_user_contact: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bce_number: string
          created_at: string
          display_name: string
          email: string
          garage_name: string
          listing_count: number
          phone: string
          postal_code: string
          subscription_end: string
          subscription_product_id: string
          subscription_status: string
          suspended_at: string
          suspended_reason: string
          user_id: string
          user_type: string
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
          boost_expires_at: string
          boost_level: string
          boost_rank: number
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
      admin_review_car_pass: {
        Args: { _decision: string; _listing_id: string; _note?: string }
        Returns: {
          out_car_pass_status: string
          out_listing_id: string
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
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enablelongtransactions: { Args: never; Returns: string }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_unique_vitrine_slug: {
        Args: { _desired: string; _user_id: string }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
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
      get_public_seller_identity: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          garage_name: string
          is_admin: boolean
          user_id: string
          user_type: string
        }[]
      }
      get_public_vitrine: {
        Args: { _slug_or_user: string }
        Returns: {
          avatar_url: string
          display_name: string
          garage_name: string
          is_admin: boolean
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
      get_reviewers_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          is_admin: boolean
          user_id: string
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
          is_admin: boolean
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
      get_unread_message_count: { Args: never; Returns: number }
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
      gettransactionid: { Args: never; Returns: unknown }
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
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_user_suspended: { Args: { _user_id: string }; Returns: boolean }
      is_vitrine_eligible: { Args: { _user_id: string }; Returns: boolean }
      is_vitrine_slug_available: {
        Args: { _slug: string; _user_id: string }
        Returns: boolean
      }
      listings_within_radius: {
        Args: { radius_km: number; user_lat: number; user_lng: number }
        Returns: {
          distance_km: number
          listing_id: string
        }[]
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: number
      }
      mark_message_read: { Args: { _message_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
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
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
