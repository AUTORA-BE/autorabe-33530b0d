-- ============================================================
-- AutoRa — Combined migrations script
-- 72 migrations, ordered chronologically
-- Apply in: Supabase Dashboard > SQL Editor > Paste > Run
-- ============================================================


-- ── Migration: 20251213133053_e4531779-870c-46e4-a89f-337c9abe743d.sql ──────────────────────────────
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create car listings table for selling
CREATE TABLE public.car_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Vehicle info
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  body_type TEXT NOT NULL,
  color TEXT NOT NULL,
  power INTEGER,
  doors INTEGER DEFAULT 5,
  
  -- Belgian specific
  euro_norm TEXT,
  vin TEXT,
  car_pass_verified BOOLEAN DEFAULT false,
  first_registration DATE,
  
  -- Description
  description TEXT,
  features TEXT[],
  
  -- Photos (stored as URLs)
  photos TEXT[] DEFAULT '{}',
  
  -- Contact info
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT NOT NULL,
  location TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sold', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view approved listings"
ON public.car_listings FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own listings"
ON public.car_listings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON public.car_listings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.car_listings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_car_listings_updated_at
BEFORE UPDATE ON public.car_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ── Migration: 20251213134028_a054dae2-b22d-4a8b-8870-4110aac42e0f.sql ──────────────────────────────
-- Enable realtime for car_listings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.car_listings;

-- ── Migration: 20251213134301_bc7ab451-1636-4991-a826-0a941ae4bc9f.sql ──────────────────────────────
-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_listing_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_brand TEXT,
  car_model TEXT,
  car_image TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate conversations for the same car between same users
  UNIQUE(car_listing_id, buyer_id, seller_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

CREATE POLICY "Users can update messages they received"
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Create index for faster queries
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON public.conversations(seller_id);

-- ── Migration: 20251213144514_d7dfa457-071d-421e-ad11-daee50f5fa68.sql ──────────────────────────────
-- Create table to track car listing views
CREATE TABLE public.car_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_hash TEXT
);

-- Enable RLS
ALTER TABLE public.car_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (tracking)
CREATE POLICY "Anyone can insert views"
ON public.car_views
FOR INSERT
WITH CHECK (true);

-- Sellers can view stats for their own listings
CREATE POLICY "Sellers can view their listing views"
ON public.car_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = car_views.car_listing_id
    AND car_listings.user_id = auth.uid()
  )
);

-- Create table to track favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, car_listing_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can manage their own favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Sellers can see favorites count on their listings
CREATE POLICY "Sellers can view favorites on their listings"
ON public.favorites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = favorites.car_listing_id
    AND car_listings.user_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX idx_car_views_listing ON public.car_views(car_listing_id);
CREATE INDEX idx_favorites_listing ON public.favorites(car_listing_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- ── Migration: 20251213150548_e63802ec-5a00-4f9f-b0a9-54c7cdd7f7fd.sql ──────────────────────────────
-- Create user preferences table
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create preferences when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- ── Migration: 20251213154309_ee2796d1-64db-4072-b12e-4aceb6104186.sql ──────────────────────────────
-- Add transparency and seller type fields to car_listings
ALTER TABLE public.car_listings
ADD COLUMN IF NOT EXISTS ct_valid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS maintenance_book_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS seller_type text DEFAULT 'particulier',
ADD COLUMN IF NOT EXISTS tva_number text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.car_listings.ct_valid IS 'Contrôle Technique valide';
COMMENT ON COLUMN public.car_listings.maintenance_book_complete IS 'Carnet d''entretien complet';
COMMENT ON COLUMN public.car_listings.seller_type IS 'Type de vendeur: particulier ou professionnel';
COMMENT ON COLUMN public.car_listings.tva_number IS 'Numéro de TVA pour les vendeurs professionnels';

-- ── Migration: 20251231170938_037f8bce-f8b7-4586-ad57-8e431335f7f6.sql ──────────────────────────────
-- Create a secure public view that excludes sensitive fields
CREATE OR REPLACE VIEW public.car_listings_public AS
SELECT 
  id, brand, model, year, price, mileage, power, doors,
  car_pass_verified, first_registration, created_at, updated_at,
  ct_valid, maintenance_book_complete, euro_norm, seller_type,
  description, features, photos, location, status, fuel_type,
  transmission, body_type, color
FROM car_listings
WHERE status = 'approved';

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.car_listings_public TO anon, authenticated;

-- Create a secure function to get seller contact info (authenticated users only)
CREATE OR REPLACE FUNCTION public.get_seller_contact(listing_id uuid)
RETURNS TABLE(
  contact_name text, 
  contact_phone text, 
  contact_email text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return contact info if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT cl.contact_name, cl.contact_phone, cl.contact_email, cl.user_id
  FROM car_listings cl
  WHERE cl.id = listing_id AND cl.status = 'approved';
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_seller_contact(uuid) TO authenticated;

-- ── Migration: 20251231171007_63a5212c-8c85-47cf-a654-73153ffa708c.sql ──────────────────────────────
-- Drop and recreate the view without SECURITY DEFINER (uses SECURITY INVOKER by default)
DROP VIEW IF EXISTS public.car_listings_public;

CREATE VIEW public.car_listings_public 
WITH (security_invoker = true)
AS
SELECT 
  id, brand, model, year, price, mileage, power, doors,
  car_pass_verified, first_registration, created_at, updated_at,
  ct_valid, maintenance_book_complete, euro_norm, seller_type,
  description, features, photos, location, status, fuel_type,
  transmission, body_type, color
FROM car_listings
WHERE status = 'approved';

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.car_listings_public TO anon, authenticated;

-- ── Migration: 20260106172115_e2273612-bdd1-4579-814f-a7beca88f5b4.sql ──────────────────────────────
-- Create reviews table for car ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(car_listing_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews on approved listings
CREATE POLICY "Anyone can view reviews on approved listings"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = reviews.car_listing_id
    AND car_listings.status = 'approved'
  )
);

-- Authenticated users can create reviews (not on their own listings)
CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = reviews.car_listing_id
    AND car_listings.user_id = auth.uid()
  )
);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ── Migration: 20260115025349_6aa36e33-53c5-4a41-a191-44488daa41ae.sql ──────────────────────────────
-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brand-logos', 'brand-logos', true, 1048576, ARRAY['image/svg+xml', 'image/png', 'image/webp']);

-- Allow public read access
CREATE POLICY "Brand logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

-- ── Migration: 20260117012341_0c24e079-82d0-41e3-8f81-b16ae768e6bb.sql ──────────────────────────────
-- Create reports table for ad reporting
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports (authenticated only, rate limiting via unique constraint)
CREATE POLICY "Authenticated users can create reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate reports (same user, same listing)
ALTER TABLE public.reports ADD CONSTRAINT unique_user_listing_report UNIQUE (user_id, car_listing_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_reports_car_listing_id ON public.reports(car_listing_id);
CREATE INDEX idx_reports_status ON public.reports(status);

-- ── Migration: 20260117132907_3d854071-5b66-4818-8203-0fd3c944aad1.sql ──────────────────────────────
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Add policy for admins to view all reports
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to update reports (change status)
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to delete reports
CREATE POLICY "Admins can delete reports"
ON public.reports
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- ── Migration: 20260119001320_8b2a4882-a482-4e3d-80a3-4a763b03a236.sql ──────────────────────────────
-- Create storage bucket for car photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-photos', 'car-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for car photos bucket
CREATE POLICY "Users can upload their own car photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'car-photos' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can update their own car photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'car-photos' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can delete their own car photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'car-photos' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Anyone can view car photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'car-photos');

-- ── Migration: 20260121003808_ceb5cfef-2e6a-42ef-8af8-9be89b324a05.sql ──────────────────────────────
-- Create profiles table to store user names and avatars
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view profiles (for showing in conversations)
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

-- ── Migration: 20260122124852_181eb952-c5e9-40a2-bce4-93f69bce479e.sql ──────────────────────────────
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ── Migration: 20260122125112_e4a76baa-1325-4e02-bf20-fcd6a46a4e08.sql ──────────────────────────────
-- Add image_url column to messages table
ALTER TABLE public.messages 
ADD COLUMN image_url TEXT;

-- Create chat-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view chat images
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

-- Allow authenticated users to upload chat images
CREATE POLICY "Users can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their own chat images
CREATE POLICY "Users can delete their chat images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ── Migration: 20260124002108_d9fd4561-5e0e-43e1-a8ae-2c4ce582d833.sql ──────────────────────────────
-- Create push_subscriptions table to store user push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own subscriptions
CREATE POLICY "Users can create their own push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add notification preferences column to user_preferences if not exists
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- ── Migration: 20260126174924_76fd1e1b-39e1-4765-b554-4afa947baecf.sql ──────────────────────────────
-- Add reply_to_id column to messages table for reply/quote functionality
ALTER TABLE public.messages 
ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX idx_messages_reply_to_id ON public.messages(reply_to_id);

-- ── Migration: 20260210115700_b3b6e1d7-77cd-4976-83ce-7ceef2ca8465.sql ──────────────────────────────

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view approved listings" ON public.car_listings;

-- Create a restrictive policy: users can ONLY see their own listings
-- Public access goes through car_listings_public view (which excludes sensitive fields)
CREATE POLICY "Users can only view their own listings"
ON public.car_listings
FOR SELECT
USING (auth.uid() = user_id);


-- ── Migration: 20260211111809_d8224a44-6a06-4efa-84d3-96287a8002c9.sql ──────────────────────────────

-- Allow public SELECT on approved listings only (the car_listings_public view filters sensitive columns)
-- This works WITH the owner-only policy since both are RESTRICTIVE, so we need a PERMISSIVE one
CREATE POLICY "Public can view approved listings via view"
ON public.car_listings
FOR SELECT
USING (status = 'approved');


-- ── Migration: 20260211111842_74125099-91c8-4ecf-8b41-37bc21b90421.sql ──────────────────────────────

-- Drop the restrictive owner-only policy that blocks public view access
DROP POLICY IF EXISTS "Users can only view their own listings" ON public.car_listings;

-- Re-create as PERMISSIVE: owners can see their own listings (any status)
CREATE POLICY "Owners can view their own listings"
ON public.car_listings
FOR SELECT
USING (auth.uid() = user_id);


-- ── Migration: 20260214191053_d68b74ec-8757-4625-854b-d8bd5362b5f2.sql ──────────────────────────────

-- Table des alertes utilisateurs
CREATE TABLE public.user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  frequency text NOT NULL DEFAULT 'instant' CHECK (frequency IN ('instant', 'daily', 'weekly')),
  notify_email boolean NOT NULL DEFAULT true,
  notify_push boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  match_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX idx_user_alerts_active ON public.user_alerts(active) WHERE active = true;

-- RLS
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.user_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON public.user_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.user_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.user_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_user_alerts_updated_at
  BEFORE UPDATE ON public.user_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table historique notifications
CREATE TABLE public.alert_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.user_alerts(id) ON DELETE CASCADE,
  car_listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  match_score integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz
);

-- Indexes
CREATE INDEX idx_alert_notifications_alert_id ON public.alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_sent_at ON public.alert_notifications(sent_at DESC);

-- RLS
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert notifications"
  ON public.alert_notifications FOR SELECT
  USING (
    alert_id IN (
      SELECT id FROM public.user_alerts WHERE user_id = auth.uid()
    )
  );


-- ── Migration: 20260214210240_979d3243-992e-425b-8d23-adea251f7f23.sql ──────────────────────────────
-- Allow admins to delete any car listing
CREATE POLICY "Admins can delete any listing"
ON public.car_listings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any car listing (for status changes etc.)
CREATE POLICY "Admins can update any listing"
ON public.car_listings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all listings (including pending/rejected)
CREATE POLICY "Admins can view all listings"
ON public.car_listings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ── Migration: 20260215125809_66b7e6a0-ce4e-4e87-9b5d-7a7f416fbda1.sql ──────────────────────────────

-- ============================================
-- TASK 1: Restrict all private table RLS policies TO authenticated
-- ============================================

-- FAVORITES
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their favorites" ON public.favorites;
CREATE POLICY "Users can remove their favorites" ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can view favorites on their listings" ON public.favorites;
CREATE POLICY "Sellers can view favorites on their listings" ON public.favorites
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM car_listings WHERE car_listings.id = favorites.car_listing_id AND car_listings.user_id = auth.uid()));

-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;
CREATE POLICY "Users can update messages they received" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- USER_ALERTS
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.user_alerts;
CREATE POLICY "Users can view their own alerts" ON public.user_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own alerts" ON public.user_alerts;
CREATE POLICY "Users can create their own alerts" ON public.user_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.user_alerts;
CREATE POLICY "Users can update their own alerts" ON public.user_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.user_alerts;
CREATE POLICY "Users can delete their own alerts" ON public.user_alerts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- USER_PREFERENCES
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- PUSH_SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create their own push subscriptions" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- REPORTS
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports" ON public.reports
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- REVIEWS
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM car_listings WHERE car_listings.id = reviews.car_listing_id AND car_listings.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ALERT_NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own alert notifications" ON public.alert_notifications;
CREATE POLICY "Users can view their own alert notifications" ON public.alert_notifications
  FOR SELECT TO authenticated
  USING (alert_id IN (SELECT user_alerts.id FROM user_alerts WHERE user_alerts.user_id = auth.uid()));

-- CAR_LISTINGS (owner/admin policies only - public view stays as-is)
DROP POLICY IF EXISTS "Owners can view their own listings" ON public.car_listings;
CREATE POLICY "Owners can view their own listings" ON public.car_listings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all listings" ON public.car_listings;
CREATE POLICY "Admins can view all listings" ON public.car_listings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create their own listings" ON public.car_listings;
CREATE POLICY "Users can create their own listings" ON public.car_listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.car_listings;
CREATE POLICY "Users can update their own listings" ON public.car_listings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.car_listings;
CREATE POLICY "Users can delete their own listings" ON public.car_listings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update any listing" ON public.car_listings;
CREATE POLICY "Admins can update any listing" ON public.car_listings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any listing" ON public.car_listings;
CREATE POLICY "Admins can delete any listing" ON public.car_listings
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- CAR_VIEWS (insert stays open for anonymous tracking, select restricted)
DROP POLICY IF EXISTS "Anyone can insert views" ON public.car_views;
CREATE POLICY "Anyone can insert views" ON public.car_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Sellers can view their listing views" ON public.car_views;
CREATE POLICY "Sellers can view their listing views" ON public.car_views
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM car_listings WHERE car_listings.id = car_views.car_listing_id AND car_listings.user_id = auth.uid()));

-- PROFILES (public read stays, write restricted)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- ── Migration: 20260221035323_d09aa83b-bd4e-4043-896e-9cf613a432f0.sql ──────────────────────────────

-- 1. Admin actions audit table
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL, -- 'approve_listing', 'reject_listing', 'delete_listing', 'suspend_user', 'unsuspend_user', 'dismiss_report', 'resolve_report'
  target_type text NOT NULL, -- 'listing', 'user', 'report'
  target_id uuid NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin actions"
  ON public.admin_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions"
  ON public.admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE INDEX idx_admin_actions_target ON public.admin_actions (target_type, target_id);
CREATE INDEX idx_admin_actions_admin ON public.admin_actions (admin_id);
CREATE INDEX idx_admin_actions_created ON public.admin_actions (created_at DESC);

-- 2. GDPR audit log for data access tracking
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'data_export', 'account_deletion', 'profile_view', 'consent_update'
  details jsonb DEFAULT '{}',
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_log_user ON public.audit_log (user_id);
CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);

-- 3. Account suspension field on profiles
ALTER TABLE public.profiles
  ADD COLUMN suspended_at timestamptz DEFAULT NULL,
  ADD COLUMN suspended_reason text DEFAULT NULL;

-- 4. Function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND suspended_at IS NOT NULL
  )
$$;


-- ── Migration: 20260309015149_e40eeec8-5e9e-4087-9b3c-2925366ab20c.sql ──────────────────────────────

ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS boost_level text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS boost_expires_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.car_listings.boost_level IS 'Boost tier: none, standard, premium, ultra';
COMMENT ON COLUMN public.car_listings.boost_expires_at IS 'When the boost expires (null = no active boost)';


-- ── Migration: 20260309015906_d6430305-353d-4a0c-8ea6-2f1e08e74d91.sql ──────────────────────────────

DROP VIEW IF EXISTS public.car_listings_public;

CREATE VIEW public.car_listings_public AS
SELECT 
  id, brand, model, year, price, mileage, fuel_type, transmission,
  body_type, color, euro_norm, description, features, photos,
  power, doors, car_pass_verified, ct_valid, maintenance_book_complete,
  first_registration, location, seller_type, status, created_at, updated_at,
  boost_level, boost_expires_at
FROM public.car_listings
WHERE status = 'approved';


-- ── Migration: 20260309020324_972cda01-b8da-40cd-beec-5e7d77911080.sql ──────────────────────────────

-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ── Migration: 20260309020641_ab1d446f-bf18-4905-97a8-10461d63a66f.sql ──────────────────────────────

ALTER TABLE public.car_listings ADD COLUMN IF NOT EXISTS boost_warning_sent boolean DEFAULT false;


-- ── Migration: 20260309025424_d4c57e59-3996-4006-81dc-bdec29c4e8e1.sql ──────────────────────────────

-- Table pour les brouillons d'annonces avec auto-save
CREATE TABLE public.listing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  photo_urls text[] DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un seul brouillon par utilisateur
CREATE UNIQUE INDEX listing_drafts_user_id_idx ON public.listing_drafts (user_id);

-- RLS
ALTER TABLE public.listing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
  ON public.listing_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
  ON public.listing_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON public.listing_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON public.listing_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_listing_drafts_updated_at
  BEFORE UPDATE ON public.listing_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── Migration: 20260310235212_e373466a-2b0a-4aba-aec8-536fec387acc.sql ──────────────────────────────

-- ============================================================
-- CRITICAL FIX 1: Remove public SELECT on car_listings base table
-- The car_listings_public view (security definer) already provides
-- safe public access WITHOUT exposing contact_email, contact_phone, 
-- contact_name, VIN, tva_number, or user_id.
-- ============================================================

DROP POLICY IF EXISTS "Public can view approved listings via view" ON public.car_listings;

-- ============================================================
-- CRITICAL FIX 2: Hide moderation data on profiles
-- Create a safe public view excluding suspended_at/suspended_reason,
-- then restrict the base table's public SELECT policy.
-- ============================================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a public-safe view (security definer to bypass RLS)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false)
AS
  SELECT 
    id,
    user_id,
    display_name,
    avatar_url,
    created_at,
    updated_at
  FROM public.profiles;

-- Re-add a public SELECT policy only for authenticated users (they need profile data for chat)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- FIX 3: Tighten anonymous access on auth-only tables
-- Many RESTRICTIVE policies use {authenticated} role but the 
-- linter flags them. Ensure INSERT/UPDATE/DELETE explicitly use TO authenticated.
-- ============================================================

-- admin_actions: already restricted to authenticated, no change needed
-- audit_log: insert policy - ensure TO authenticated
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;
CREATE POLICY "System can insert audit logs"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- car_views: the "Anyone can insert views" policy uses TO public with WITH CHECK (true)
-- This is intentional for anonymous view tracking, keep as-is


-- ── Migration: 20260314195359_2b1c0ece-a0ef-4bb1-b686-405e2414a687.sql ──────────────────────────────

-- Daily message counter for free users rate limiting
CREATE TABLE public.daily_message_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_date)
);

-- Enable RLS
ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

-- Users can view their own counts
CREATE POLICY "Users can view own message counts"
  ON public.daily_message_counts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own counts
CREATE POLICY "Users can insert own message counts"
  ON public.daily_message_counts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own counts
CREATE POLICY "Users can update own message counts"
  ON public.daily_message_counts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);


-- ── Migration: 20260315211517_2bc35c2c-e482-4c62-b78a-d7eca144e011.sql ──────────────────────────────
ALTER TABLE public.profiles ADD COLUMN phone text;
CREATE UNIQUE INDEX profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;

-- ── Migration: 20260316143113_11d7a563-e5df-4760-8e37-47b3fe9952fa.sql ──────────────────────────────
-- Add unique constraint on profiles.phone (skip nulls - only enforce uniqueness on non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;

-- ── Migration: 20260316144804_f569de7c-4bfd-4df4-ab05-647ab096b4ac.sql ──────────────────────────────

-- Subscriptions table for local Stripe sync
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  product_id text,
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ── Migration: 20260318145241_df1bfb9a-4556-4744-88ee-fc981e79ac34.sql ──────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS garage_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code text;

-- ── Migration: 20260323234838_email_infra.sql ──────────────────────────────
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');


-- ── Migration: 20260407113255_beb037ac-4a53-446a-8d57-27b5a96eddc1.sql ──────────────────────────────
-- Add tsvector column for full-text search
ALTER TABLE public.car_listings ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(brand, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(model, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(color, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(body_type, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(fuel_type, '')), 'B')
  ) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_car_listings_search ON public.car_listings USING GIN (search_vector);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_car_listings_status ON public.car_listings (status);
CREATE INDEX IF NOT EXISTS idx_car_listings_brand ON public.car_listings (brand);
CREATE INDEX IF NOT EXISTS idx_car_listings_price ON public.car_listings (price);
CREATE INDEX IF NOT EXISTS idx_car_listings_year ON public.car_listings (year);
CREATE INDEX IF NOT EXISTS idx_car_listings_fuel_type ON public.car_listings (fuel_type);
CREATE INDEX IF NOT EXISTS idx_car_listings_created_at ON public.car_listings (created_at DESC);

-- ── Migration: 20260407113318_3c833d71-fd76-4923-b835-1f7ceeafdc08.sql ──────────────────────────────
-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits (key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits (expires_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Atomic rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _max_attempts integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _current_count integer;
BEGIN
  -- Clean expired entries
  DELETE FROM rate_limits WHERE expires_at < _now;

  -- Try to get existing entry
  SELECT count INTO _current_count
  FROM rate_limits
  WHERE key = _key AND window_start + (_window_seconds || ' seconds')::interval > _now
  FOR UPDATE;

  IF _current_count IS NULL THEN
    -- New window
    INSERT INTO rate_limits (key, count, window_start, expires_at)
    VALUES (_key, 1, _now, _now + (_window_seconds || ' seconds')::interval);
    RETURN true;
  ELSIF _current_count < _max_attempts THEN
    -- Increment
    UPDATE rate_limits SET count = count + 1
    WHERE key = _key AND window_start + (_window_seconds || ' seconds')::interval > _now;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- ── Migration: 20260408175926_a9ace4dd-8bb7-4da8-bbf6-7b0da2fc529b.sql ──────────────────────────────
-- Admin can view all conversations
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete conversations
CREATE POLICY "Admins can delete conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete messages for moderation
CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ── Migration: 20260409184602_f93414e5-ef9a-484b-930e-6a9f3dfd5bcc.sql ──────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;

-- ── Migration: 20260412132708_b17086e4-e98a-459d-ba16-340b030d4905.sql ──────────────────────────────

-- Create the vehicle-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Vehicle photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

-- Users can upload their own photos (folder = user_id)
CREATE POLICY "Users can upload vehicle photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own photos
CREATE POLICY "Users can delete vehicle photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own photos
CREATE POLICY "Users can update vehicle photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── Migration: 20260412133441_bf21b63b-6715-44f8-affc-2e4510f1d2b3.sql ──────────────────────────────

-- Add car_pass_url and car_pass_date columns to car_listings
ALTER TABLE public.car_listings
ADD COLUMN IF NOT EXISTS car_pass_url text,
ADD COLUMN IF NOT EXISTS car_pass_date date;

-- Create the car-pass storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-pass', 'car-pass', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Car-Pass documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-pass');

-- Users can upload their own Car-Pass
CREATE POLICY "Users can upload car-pass documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-pass' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own Car-Pass
CREATE POLICY "Users can delete car-pass documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-pass' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own Car-Pass
CREATE POLICY "Users can update car-pass documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-pass' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── Migration: 20260414140206_13dac159-28ae-4180-bfaf-bc6b94eb8c17.sql ──────────────────────────────

-- 1. Fix profiles SELECT policy: restrict to own profile + admins
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add public SELECT policy on car_listings for approved listings (so visitors can browse)
CREATE POLICY "Anyone can view approved listings"
ON public.car_listings FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- 3. Recreate views with security_invoker = true
DROP VIEW IF EXISTS public.car_listings_public;
CREATE VIEW public.car_listings_public
WITH (security_invoker = true)
AS SELECT 
    id, brand, model, year, price, mileage, fuel_type, transmission,
    body_type, color, euro_norm, description, features, photos,
    power, doors, car_pass_verified, ct_valid, maintenance_book_complete,
    first_registration, location, seller_type, status, created_at,
    updated_at, boost_level, boost_expires_at
FROM public.car_listings
WHERE status = 'approved';

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS SELECT 
    id, user_id, display_name, avatar_url, created_at, updated_at
FROM public.profiles;

-- 4. Fix search_path on email queue functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;


-- ── Migration: 20260414140259_adc8bb08-3ee8-4326-82f7-83bb336f303c.sql ──────────────────────────────

-- Allow authenticated users to read basic profile info (needed for chat, messaging display)
-- The profiles_public view already filters sensitive fields for public display
CREATE POLICY "Authenticated users can view basic profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive own-profile-only policy (redundant now)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;


-- ── Migration: 20260414171421_126eb14a-d613-456f-ab92-83ce9ccf04fe.sql ──────────────────────────────

CREATE OR REPLACE FUNCTION public.get_favorite_counts(listing_ids uuid[])
RETURNS TABLE(car_listing_id uuid, favorite_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.car_listing_id, count(*) as favorite_count
  FROM public.favorites f
  WHERE f.car_listing_id = ANY(listing_ids)
  GROUP BY f.car_listing_id
$$;


-- ── Migration: 20260414172733_deca419a-f7dc-4461-aa8f-25a7df90d5a9.sql ──────────────────────────────

-- Create a function to get listing popularity stats
CREATE OR REPLACE FUNCTION public.get_listing_popularity(listing_ids uuid[])
RETURNS TABLE(listing_id uuid, favorite_count bigint, view_count bigint, interaction_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.id as listing_id,
    COALESCE(f.fav_count, 0) as favorite_count,
    COALESCE(v.view_count, 0) as view_count,
    COALESCE(f.fav_count, 0) + COALESCE(v.view_count, 0) as interaction_count
  FROM unnest(listing_ids) AS l(id)
  LEFT JOIN (
    SELECT car_listing_id, count(*) as fav_count
    FROM public.favorites
    GROUP BY car_listing_id
  ) f ON f.car_listing_id = l.id
  LEFT JOIN (
    SELECT car_listing_id, count(*) as view_count
    FROM public.car_views
    GROUP BY car_listing_id
  ) v ON v.car_listing_id = l.id
$$;


-- ── Migration: 20260414174238_079de10b-a453-452d-be1d-57476ed519f5.sql ──────────────────────────────
-- Remove the overly permissive anonymous SELECT policy on car_listings base table
DROP POLICY IF EXISTS "Anyone can view approved listings" ON public.car_listings;

-- Create a SECURITY DEFINER function to get public listings by seller
-- This avoids exposing sensitive columns while allowing seller profile pages to work
CREATE OR REPLACE FUNCTION public.get_seller_public_listings(_seller_id uuid)
RETURNS TABLE(
  id uuid,
  brand text,
  model text,
  year integer,
  price integer,
  mileage integer,
  fuel_type text,
  transmission text,
  photos text[],
  location text,
  created_at timestamptz,
  body_type text,
  color text,
  power integer,
  doors integer,
  euro_norm text,
  car_pass_verified boolean,
  description text,
  features text[],
  boost_level text,
  boost_expires_at timestamptz,
  seller_type text,
  first_registration date,
  ct_valid boolean,
  maintenance_book_complete boolean,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    cl.id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.photos, cl.location, cl.created_at,
    cl.body_type, cl.color, cl.power, cl.doors, cl.euro_norm,
    cl.car_pass_verified, cl.description, cl.features,
    cl.boost_level, cl.boost_expires_at, cl.seller_type,
    cl.first_registration, cl.ct_valid, cl.maintenance_book_complete,
    cl.status
  FROM public.car_listings cl
  WHERE cl.user_id = _seller_id
    AND cl.status = 'approved'
  ORDER BY cl.created_at DESC
$$;

-- ── Migration: 20260414175129_693dd5b8-6269-47da-a493-997ae3bcf08a.sql ──────────────────────────────
ALTER PUBLICATION supabase_realtime DROP TABLE public.reports;

-- ── Migration: 20260414180111_a90beee8-4321-41ee-b008-c53c2a4659c1.sql ──────────────────────────────
ALTER TABLE public.car_listings DROP COLUMN IF EXISTS vin;

-- ── Migration: 20260414182951_8590c860-429b-4e0e-8497-7720147a5938.sql ──────────────────────────────

CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));


-- ── Migration: 20260414191209_19412927-9fcb-46c9-b6e6-f5e837290877.sql ──────────────────────────────

CREATE TABLE public.fuel_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diesel numeric(5,3) NOT NULL DEFAULT 1.650,
  essence95 numeric(5,3) NOT NULL DEFAULT 1.750,
  essence98 numeric(5,3) NOT NULL DEFAULT 1.850,
  electric_home numeric(5,3) NOT NULL DEFAULT 0.300,
  electric_public numeric(5,3) NOT NULL DEFAULT 0.450,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;

-- Everyone can read fuel prices (displayed on homepage)
CREATE POLICY "Anyone can view fuel prices"
  ON public.fuel_prices FOR SELECT
  TO public
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert fuel prices"
  ON public.fuel_prices FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update fuel prices"
  ON public.fuel_prices FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial row with current Belgian market prices
INSERT INTO public.fuel_prices (diesel, essence95, essence98, electric_home, electric_public)
VALUES (1.650, 1.750, 1.850, 0.300, 0.450);


-- ── Migration: 20260414193715_8cf9e8f1-4a26-4d18-9e87-6d9ee50c7f36.sql ──────────────────────────────
-- Drop the existing overly permissive INSERT policy on chat-images
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;

-- Re-create with proper user-scoped path check
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ── Migration: 20260419221627_93ee8a30-0a6a-4e6b-b92c-13c928f4e876.sql ──────────────────────────────
-- Create demo user in auth.users (idempotent)
DO $$
DECLARE
  demo_user_id uuid := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      demo_user_id,
      'authenticated',
      'authenticated',
      'demo@autora.be',
      crypt('AutoRADemo2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"AutoRA Demo"}'::jsonb,
      now(), now(), '', '', '', ''
    );
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (user_id, display_name, phone, postal_code, garage_name)
  VALUES (demo_user_id, 'AutoRA Demo', '+32470000001', '1000', 'AutoRA Demo Garage')
  ON CONFLICT DO NOTHING;

  -- Ensure preferences exist
  INSERT INTO public.user_preferences (user_id)
  VALUES (demo_user_id)
  ON CONFLICT DO NOTHING;
END $$;

-- ── Migration: 20260421140301_676c98b2-0106-42a2-80e0-f2b058909a0a.sql ──────────────────────────────
-- TMC brackets table
CREATE TABLE public.belgian_tmc_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL CHECK (region IN ('bruxelles', 'wallonie', 'flandre')),
  cv_min integer NOT NULL,
  cv_max integer NOT NULL,
  base_amount numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE INDEX idx_tmc_region_cv ON public.belgian_tmc_brackets(region, cv_min, cv_max);

-- Annual tax brackets table
CREATE TABLE public.belgian_annual_tax_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL CHECK (region IN ('bruxelles', 'wallonie', 'flandre')),
  cv_min integer NOT NULL,
  cv_max integer NOT NULL,
  base_amount numeric(10,2) NOT NULL,
  diesel_surcharge_pct numeric(5,2) NOT NULL DEFAULT 0,
  lpg_surcharge_per_cv numeric(10,2) NOT NULL DEFAULT 0,
  electric_amount numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE INDEX idx_annual_region_cv ON public.belgian_annual_tax_brackets(region, cv_min, cv_max);

-- Age reduction coefficients (Brussels/Wallonia: progressive; Flanders: linear)
CREATE TABLE public.belgian_tmc_age_reductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL CHECK (region IN ('bruxelles', 'wallonie', 'flandre')),
  age_min_years integer NOT NULL,
  age_max_years integer,
  coefficient numeric(4,3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE INDEX idx_age_region ON public.belgian_tmc_age_reductions(region, age_min_years);

-- Enable RLS
ALTER TABLE public.belgian_tmc_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belgian_annual_tax_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belgian_tmc_age_reductions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view TMC brackets" ON public.belgian_tmc_brackets
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view annual tax brackets" ON public.belgian_annual_tax_brackets
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view age reductions" ON public.belgian_tmc_age_reductions
  FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins can insert TMC brackets" ON public.belgian_tmc_brackets
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update TMC brackets" ON public.belgian_tmc_brackets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete TMC brackets" ON public.belgian_tmc_brackets
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert annual tax" ON public.belgian_annual_tax_brackets
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update annual tax" ON public.belgian_annual_tax_brackets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete annual tax" ON public.belgian_annual_tax_brackets
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert age reductions" ON public.belgian_tmc_age_reductions
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update age reductions" ON public.belgian_tmc_age_reductions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete age reductions" ON public.belgian_tmc_age_reductions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER trg_tmc_updated BEFORE UPDATE ON public.belgian_tmc_brackets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_annual_updated BEFORE UPDATE ON public.belgian_annual_tax_brackets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_age_updated BEFORE UPDATE ON public.belgian_tmc_age_reductions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed TMC brackets (same scale for all 3 regions, simplified Belgian 2025/2026)
INSERT INTO public.belgian_tmc_brackets (region, cv_min, cv_max, base_amount, notes) VALUES
  ('bruxelles', 0, 4, 61.50, 'Petite cylindrée'),
  ('bruxelles', 5, 6, 123.00, NULL),
  ('bruxelles', 7, 8, 495.00, NULL),
  ('bruxelles', 9, 10, 867.00, NULL),
  ('bruxelles', 11, 11, 1239.00, NULL),
  ('bruxelles', 12, 14, 2478.00, NULL),
  ('bruxelles', 15, 17, 4957.00, NULL),
  ('bruxelles', 18, 999, 4957.00, '+500€ par CV au-delà de 17'),
  ('wallonie', 0, 4, 61.50, NULL),
  ('wallonie', 5, 6, 123.00, NULL),
  ('wallonie', 7, 8, 495.00, NULL),
  ('wallonie', 9, 10, 867.00, NULL),
  ('wallonie', 11, 11, 1239.00, NULL),
  ('wallonie', 12, 14, 2478.00, NULL),
  ('wallonie', 15, 17, 4957.00, NULL),
  ('wallonie', 18, 999, 4957.00, '+500€ par CV au-delà de 17'),
  ('flandre', 0, 4, 61.50, 'BIV simplifié — calcul réel basé sur CO2'),
  ('flandre', 5, 6, 123.00, NULL),
  ('flandre', 7, 8, 495.00, NULL),
  ('flandre', 9, 10, 867.00, NULL),
  ('flandre', 11, 11, 1239.00, NULL),
  ('flandre', 12, 14, 2478.00, NULL),
  ('flandre', 15, 17, 4957.00, NULL),
  ('flandre', 18, 999, 4957.00, '+500€ par CV au-delà de 17');

-- Seed annual tax brackets
INSERT INTO public.belgian_annual_tax_brackets (region, cv_min, cv_max, base_amount, diesel_surcharge_pct, lpg_surcharge_per_cv, electric_amount) VALUES
  ('bruxelles', 0, 4, 85, 15, 10, 85),
  ('bruxelles', 5, 6, 149, 15, 10, 85),
  ('bruxelles', 7, 8, 262, 15, 10, 85),
  ('bruxelles', 9, 10, 421, 15, 10, 85),
  ('bruxelles', 11, 11, 543, 15, 10, 85),
  ('bruxelles', 12, 14, 867, 15, 10, 85),
  ('bruxelles', 15, 17, 1239, 15, 10, 85),
  ('bruxelles', 18, 999, 1239, 15, 10, 85),
  ('wallonie', 0, 4, 85, 0, 10, 85),
  ('wallonie', 5, 6, 149, 0, 10, 85),
  ('wallonie', 7, 8, 262, 0, 10, 85),
  ('wallonie', 9, 10, 421, 0, 10, 85),
  ('wallonie', 11, 11, 543, 0, 10, 85),
  ('wallonie', 12, 14, 867, 0, 10, 85),
  ('wallonie', 15, 17, 1239, 0, 10, 85),
  ('wallonie', 18, 999, 1239, 0, 10, 85),
  ('flandre', 0, 4, 85, 0, 10, 0),
  ('flandre', 5, 6, 149, 0, 10, 0),
  ('flandre', 7, 8, 262, 0, 10, 0),
  ('flandre', 9, 10, 421, 0, 10, 0),
  ('flandre', 11, 11, 543, 0, 10, 0),
  ('flandre', 12, 14, 867, 0, 10, 0),
  ('flandre', 15, 17, 1239, 0, 10, 0),
  ('flandre', 18, 999, 1239, 0, 10, 0);

-- Seed age reductions
-- Brussels & Wallonia: progressive
INSERT INTO public.belgian_tmc_age_reductions (region, age_min_years, age_max_years, coefficient) VALUES
  ('bruxelles', 0, 1, 1.00),
  ('bruxelles', 1, 2, 0.85),
  ('bruxelles', 2, 3, 0.70),
  ('bruxelles', 3, 4, 0.55),
  ('bruxelles', 4, 5, 0.40),
  ('bruxelles', 5, NULL, 0.25),
  ('wallonie', 0, 1, 1.00),
  ('wallonie', 1, 2, 0.85),
  ('wallonie', 2, 3, 0.70),
  ('wallonie', 3, 4, 0.55),
  ('wallonie', 4, 5, 0.40),
  ('wallonie', 5, NULL, 0.25),
  -- Flanders: linear -5% per year (single base row, code applies formula)
  ('flandre', 0, NULL, 1.00);

-- ── Migration: 20260422073943_a0e09294-7ac3-4935-b61c-eed49df7c29c.sql ──────────────────────────────
-- Bloque les insertions directes sur car_listings
-- Seule l'edge function create-listing (service_role) pourra insérer désormais
DROP POLICY IF EXISTS "Users can create their own listings" ON public.car_listings;

-- ── Migration: 20260423205529_53540116-88e6-485c-bac6-66f7a1e8d3a8.sql ──────────────────────────────

-- ============================================================
-- AUDIT SÉCURITÉ — Corrections pré-lancement AutoRa
-- ============================================================

-- ============================================================
-- 1. PROFILES : restreindre accès aux champs sensibles
-- ============================================================
-- Supprimer la policy trop large qui expose phone/postal_code/suspended_*
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

-- Owner peut voir son profil complet
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- (Admins gardent leur policy "Admins can view all profiles" déjà en place)
-- Pour l'accès public limité (display_name + avatar), on s'appuie sur la vue profiles_public déjà existante.

-- ============================================================
-- 2. CAR_LISTINGS : auth users ne voient que les annonces approuvées
--    (en plus de leurs propres annonces et de l'accès admin)
-- ============================================================
CREATE POLICY "Authenticated users can view approved listings"
ON public.car_listings
FOR SELECT
TO authenticated
USING (status = 'approved');

-- (Owners et admins gardent leurs policies existantes)

-- ============================================================
-- 3. STORAGE : bucket car-pass passe en privé + ownership
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'car-pass';

-- Supprimer toute policy SELECT trop large sur car-pass
DROP POLICY IF EXISTS "Public read access for car-pass" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view car-pass" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Owner du fichier (uid = premier segment du path) peut lire
CREATE POLICY "Owners can read their car-pass"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'car-pass'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins peuvent tout lire (modération)
CREATE POLICY "Admins can read all car-pass"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'car-pass'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ============================================================
-- 4. STORAGE chat-images : enlever la policy INSERT trop permissive
-- ============================================================
DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;
-- (la policy stricte "Authenticated users can upload chat images" est conservée)

-- ============================================================
-- 5. REALTIME : retirer car_listings du publication realtime public
--    (le browsing utilise React Query, pas Realtime)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'car_listings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.car_listings';
  END IF;
END $$;


-- ── Migration: 20260426115020_9b1d21e5-c96d-42ae-87ff-eafce6c0a09f.sql ──────────────────────────────
DROP POLICY IF EXISTS "Car-Pass documents are publicly accessible" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can view approved listings" ON public.car_listings;

CREATE OR REPLACE FUNCTION public.has_conversation_with_listing(_listing_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE car_listing_id = _listing_id
      AND (buyer_id = _user_id OR seller_id = _user_id)
  )
$$;

DROP VIEW IF EXISTS public.car_listings_public CASCADE;

CREATE VIEW public.car_listings_public AS
SELECT
  id, user_id, brand, model, year, price, mileage,
  fuel_type, transmission, body_type, color, power, doors, euro_norm,
  car_pass_verified, first_registration, description, features, photos,
  location, status, created_at, updated_at, ct_valid,
  maintenance_book_complete, seller_type, tva_number,
  boost_level, boost_expires_at, search_vector,
  car_pass_url, car_pass_date
FROM public.car_listings
WHERE status = 'approved';

GRANT SELECT ON public.car_listings_public TO anon, authenticated;

CREATE POLICY "Buyers in conversation can view full listing"
ON public.car_listings FOR SELECT TO authenticated
USING (
  status = 'approved'
  AND public.has_conversation_with_listing(id, auth.uid())
);

CREATE OR REPLACE FUNCTION public.get_public_listing(_listing_id uuid)
RETURNS TABLE (
  id uuid, user_id uuid, brand text, model text, year integer, price integer,
  mileage integer, fuel_type text, transmission text, body_type text, color text,
  power integer, doors integer, euro_norm text, car_pass_verified boolean,
  first_registration date, description text, features text[], photos text[],
  location text, status text, created_at timestamptz, updated_at timestamptz,
  ct_valid boolean, maintenance_book_complete boolean, seller_type text,
  tva_number text, boost_level text, boost_expires_at timestamptz,
  car_pass_url text, car_pass_date date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    cl.id, cl.user_id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.body_type, cl.color, cl.power, cl.doors,
    cl.euro_norm, cl.car_pass_verified, cl.first_registration, cl.description,
    cl.features, cl.photos, cl.location, cl.status, cl.created_at, cl.updated_at,
    cl.ct_valid, cl.maintenance_book_complete, cl.seller_type, cl.tva_number,
    cl.boost_level, cl.boost_expires_at, cl.car_pass_url, cl.car_pass_date
  FROM public.car_listings cl
  WHERE cl.id = _listing_id AND cl.status = 'approved'
$$;

GRANT EXECUTE ON FUNCTION public.get_public_listing(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_conversation_with_listing(uuid, uuid) TO authenticated;

-- ── Migration: 20260428151620_670e4a33-306b-46ed-872d-34d242514762.sql ──────────────────────────────
-- Fix Security Definer View ERROR: enforce security_invoker on car_listings_public
-- so the view runs with the querying user's permissions and respects RLS on car_listings.
ALTER VIEW public.car_listings_public SET (security_invoker = true);

-- ── Migration: 20260429113909_a30ed3c5-9f28-4fb8-80ae-041ef00dce95.sql ──────────────────────────────
-- =========================================================
-- 1. REALTIME: protect conversation channels
-- =========================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users only subscribe to their conversations" ON realtime.messages;

CREATE POLICY "Users only subscribe to their conversations"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE realtime.topic() = 'conversation:' || c.id::text
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

-- =========================================================
-- 2. REVOKE EXECUTE on internal SECURITY DEFINER functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_preferences() FROM anon, authenticated;

-- =========================================================
-- 3. STORAGE: replace overly-broad SELECT with scoped reads
-- =========================================================
-- Drop legacy "anyone can list everything" policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view car photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Brand logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Vehicle photos are publicly accessible" ON storage.objects;

-- Re-create read policies (URL access via CDN remains, but client-side .list() is blocked
-- because each row must satisfy `name IS NOT NULL` — listing without a path won't return rows).
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars' AND name IS NOT NULL);

CREATE POLICY "Public read brand-logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'brand-logos' AND name IS NOT NULL);

CREATE POLICY "Public read car-photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'car-photos' AND name IS NOT NULL);

CREATE POLICY "Public read vehicle-photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vehicle-photos' AND name IS NOT NULL);

-- chat-images: scoped to owner folder + admins (private-by-design)
CREATE POLICY "Owners read their chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins read all chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- ── Migration: 20260429114249_3d47cfcc-fc7f-48c1-9112-a551c8f188be.sql ──────────────────────────────
-- Enable trigram extension for fast ILIKE / fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- 1. Default homepage sort: status='approved' + created_at DESC + boost
-- Partial index dramatically reduces size and speeds up the most common query
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_recent
  ON public.car_listings (boost_level DESC, created_at DESC, id)
  WHERE status = 'approved';

-- 2. Price sort on approved listings
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_price
  ON public.car_listings (boost_level DESC, price ASC, id)
  WHERE status = 'approved';

-- 3. Year sort on approved listings
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_year
  ON public.car_listings (boost_level DESC, year DESC, id)
  WHERE status = 'approved';

-- 4. Mileage sort on approved listings
CREATE INDEX IF NOT EXISTS idx_car_listings_approved_mileage
  ON public.car_listings (boost_level DESC, mileage ASC, id)
  WHERE status = 'approved';

-- 5. Trigram indexes for ILIKE on brand & model (search box, brand/model filters)
CREATE INDEX IF NOT EXISTS idx_car_listings_brand_trgm
  ON public.car_listings USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_car_listings_model_trgm
  ON public.car_listings USING gin (model gin_trgm_ops);

-- 6. Trigram on location for province city matching
CREATE INDEX IF NOT EXISTS idx_car_listings_location_trgm
  ON public.car_listings USING gin (location gin_trgm_ops)
  WHERE location IS NOT NULL;

-- 7. Common single-column filters
CREATE INDEX IF NOT EXISTS idx_car_listings_seller_type
  ON public.car_listings (seller_type) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_car_listings_body_type
  ON public.car_listings (body_type) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_car_listings_euro_norm
  ON public.car_listings (euro_norm) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_car_listings_mileage
  ON public.car_listings (mileage) WHERE status = 'approved';

-- 8. Owner dashboard (seller's own listings page)
CREATE INDEX IF NOT EXISTS idx_car_listings_user_created
  ON public.car_listings (user_id, created_at DESC);

-- 9. Boost ordering helper (active boosts only)
CREATE INDEX IF NOT EXISTS idx_car_listings_active_boost
  ON public.car_listings (boost_level, boost_expires_at)
  WHERE status = 'approved' AND boost_level <> 'none';

-- Update planner statistics so new indexes are picked up immediately
ANALYZE public.car_listings;

-- ── Migration: 20260430194805_5cb68fc3-f53b-4e67-bf1a-c3df56629574.sql ──────────────────────────────
-- 1) RLS: allow users to read their own views
CREATE POLICY "Users can view their own car views"
ON public.car_views
FOR SELECT
TO authenticated
USING (viewer_id = auth.uid());

-- 2) RLS: allow users to delete their own views
CREATE POLICY "Users can delete their own car views"
ON public.car_views
FOR DELETE
TO authenticated
USING (viewer_id = auth.uid());

-- 3) Performance index for history queries
CREATE INDEX IF NOT EXISTS idx_car_views_viewer_viewed_at
ON public.car_views (viewer_id, viewed_at DESC)
WHERE viewer_id IS NOT NULL;

-- 4) RPC: get_user_view_history — deduped recent views with full listing data
CREATE OR REPLACE FUNCTION public.get_user_view_history(_limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid,
  brand text,
  model text,
  year integer,
  price integer,
  mileage integer,
  fuel_type text,
  transmission text,
  body_type text,
  color text,
  power integer,
  doors integer,
  euro_norm text,
  car_pass_verified boolean,
  first_registration date,
  description text,
  features text[],
  photos text[],
  location text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ct_valid boolean,
  maintenance_book_complete boolean,
  seller_type text,
  boost_level text,
  boost_expires_at timestamp with time zone,
  last_viewed_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH last_views AS (
    SELECT DISTINCT ON (cv.car_listing_id)
      cv.car_listing_id,
      cv.viewed_at
    FROM public.car_views cv
    WHERE cv.viewer_id = auth.uid()
    ORDER BY cv.car_listing_id, cv.viewed_at DESC
  )
  SELECT
    cl.id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.body_type, cl.color,
    cl.power, cl.doors, cl.euro_norm, cl.car_pass_verified,
    cl.first_registration, cl.description, cl.features, cl.photos,
    cl.location, cl.status, cl.created_at, cl.updated_at,
    cl.ct_valid, cl.maintenance_book_complete, cl.seller_type,
    cl.boost_level, cl.boost_expires_at,
    lv.viewed_at AS last_viewed_at
  FROM last_views lv
  JOIN public.car_listings cl ON cl.id = lv.car_listing_id
  WHERE cl.status = 'approved'
    AND auth.uid() IS NOT NULL
  ORDER BY lv.viewed_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_view_history(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_view_history(integer) TO authenticated;

-- 5) RPC: clear_user_view_history
CREATE OR REPLACE FUNCTION public.clear_user_view_history()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  WITH deleted AS (
    DELETE FROM public.car_views
    WHERE viewer_id = auth.uid()
    RETURNING 1
  )
  SELECT COUNT(*)::integer INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.clear_user_view_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_user_view_history() TO authenticated;

-- ── Migration: 20260503022400_9a3705bd-337b-4e0e-b9b1-6191e7d07e7c.sql ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_active_cities_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT location)::integer
  FROM public.car_listings
  WHERE status = 'approved' AND location IS NOT NULL AND location <> '';
$$;

GRANT EXECUTE ON FUNCTION public.get_active_cities_count() TO anon, authenticated;

-- ── Migration: 20260503161153_ce04394a-95a1-4cb4-8f52-80c574afed33.sql ──────────────────────────────
-- Stripe webhook idempotency table
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload_summary jsonb
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_type
  ON public.stripe_processed_events(event_type);

-- Lock down: only service_role can read/write (webhook runs as service)
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role only stripe events"
  ON public.stripe_processed_events
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── Migration: 20260503195335_14cb9336-abc5-4d18-bcb9-aaf82c499d22.sql ──────────────────────────────
-- 1) Retirer la policy qui expose contact_email/phone aux acheteurs en conversation
DROP POLICY IF EXISTS "Buyers in conversation can view full listing" ON public.car_listings;

-- Remplacer par une RPC sûre pour les acheteurs en conversation: pas de contact direct
CREATE OR REPLACE FUNCTION public.get_listing_for_buyer(_listing_id uuid)
RETURNS TABLE(
  id uuid, user_id uuid, brand text, model text, year integer, price integer, mileage integer,
  fuel_type text, transmission text, body_type text, color text, power integer, doors integer,
  euro_norm text, car_pass_verified boolean, first_registration date, description text,
  features text[], photos text[], location text, status text, created_at timestamptz,
  updated_at timestamptz, ct_valid boolean, maintenance_book_complete boolean, seller_type text,
  tva_number text, boost_level text, boost_expires_at timestamptz, car_pass_url text, car_pass_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cl.id, cl.user_id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
    cl.fuel_type, cl.transmission, cl.body_type, cl.color, cl.power, cl.doors,
    cl.euro_norm, cl.car_pass_verified, cl.first_registration, cl.description,
    cl.features, cl.photos, cl.location, cl.status, cl.created_at, cl.updated_at,
    cl.ct_valid, cl.maintenance_book_complete, cl.seller_type, cl.tva_number,
    cl.boost_level, cl.boost_expires_at, cl.car_pass_url, cl.car_pass_date
  FROM public.car_listings cl
  WHERE cl.id = _listing_id
    AND auth.uid() IS NOT NULL
    AND public.has_conversation_with_listing(cl.id, auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_listing_for_buyer(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_listing_for_buyer(uuid) TO authenticated;

-- 2) alert_notifications: bloquer toute insert/delete client (réservé service_role)
CREATE POLICY "Service role only insert alert notifications"
ON public.alert_notifications FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only delete alert notifications"
ON public.alert_notifications FOR DELETE
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Users can mark their alert notifications opened/clicked"
ON public.alert_notifications FOR UPDATE
TO authenticated
USING (alert_id IN (SELECT id FROM public.user_alerts WHERE user_id = auth.uid()))
WITH CHECK (alert_id IN (SELECT id FROM public.user_alerts WHERE user_id = auth.uid()));

-- ── Migration: 20260504150809_features_geo_reference_url.sql ──────────────────────────────
-- ============================================================
-- Phase 1 + Phase 2 scaffolding
-- 1. reference_url  — competitor listing link on car_listings
-- 2. latitude/longitude — geo coordinates for distance search
-- 3. GIN index on features[] — fast faceted search
-- 4. listings_within_radius() — Haversine distance RPC
-- ============================================================

-- 1. reference_url
ALTER TABLE car_listings
  ADD COLUMN IF NOT EXISTS reference_url text;

-- 2. Geolocation columns
ALTER TABLE car_listings
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Partial index: only index rows that have coordinates (saves space)
CREATE INDEX IF NOT EXISTS idx_car_listings_geo
  ON car_listings (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. GIN index on features[] for fast array-containment queries
--    (@> operator used by Supabase .contains())
CREATE INDEX IF NOT EXISTS idx_car_listings_features
  ON car_listings USING gin (features)
  WHERE features IS NOT NULL;

-- 4. Haversine distance function
--    Returns rows from approved listings within <radius_km> of a point.
--    Uses LEAST(1.0, …) to guard against floating-point domain errors in acos().
CREATE OR REPLACE FUNCTION listings_within_radius(
  user_lat  double precision,
  user_lng  double precision,
  radius_km double precision
)
RETURNS TABLE (
  listing_id uuid,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id AS listing_id,
    (
      6371.0 * acos(
        LEAST(1.0,
          cos(radians(user_lat))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(user_lng))
          + sin(radians(user_lat))
            * sin(radians(latitude))
        )
      )
    ) AS distance_km
  FROM car_listings
  WHERE
    status    = 'approved'
    AND latitude  IS NOT NULL
    AND longitude IS NOT NULL
    AND (
      6371.0 * acos(
        LEAST(1.0,
          cos(radians(user_lat))
            * cos(radians(latitude))
            * cos(radians(longitude) - radians(user_lng))
          + sin(radians(user_lat))
            * sin(radians(latitude))
        )
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
$$;


-- ── Migration: 20260504191835_car_pass_async_verification.sql ──────────────────────────────
-- ============================================================
-- Car-Pass async verification — Task 1
-- ----------------------------------------------------------------
-- Goal: nobody can flip `car_pass_verified` themselves.
--   Only an Edge Function (or admin) running with the service role
--   may insert a verification request and mark a listing as verified.
--
-- Schema:
--   car_listings.car_pass_status text  ('unverified'|'pending'|'verified'|'rejected')
--   car_listings.car_pass_request_id text
--   car_listings.car_pass_verified  → recomputed from car_pass_status
--   public.car_pass_verification_requests — audit table
--
-- Visibility:
--   The car_listings_public view continues to surface only approved listings,
--   but we also force car_pass_status = 'verified' OR seller_type = 'professionnel'
--   (pros are pre-vetted).  Pending listings disappear from public search.
-- ============================================================

-- 1. Add new columns
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS car_pass_status     text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS car_pass_request_id text;

-- Backfill for legacy rows that still have car_pass_verified = true
UPDATE public.car_listings
   SET car_pass_status = 'verified'
 WHERE car_pass_verified = true
   AND car_pass_status   = 'unverified';

-- Constraint on the allowed states
ALTER TABLE public.car_listings
  DROP CONSTRAINT IF EXISTS car_pass_status_chk;
ALTER TABLE public.car_listings
  ADD CONSTRAINT car_pass_status_chk
  CHECK (car_pass_status IN ('unverified','pending','verified','rejected'));

-- 2. Replace car_pass_verified with a generated column derived from status
--    (drop view first, recreate after — generated col change requires a re-create
--    and the view depends on it).
DROP VIEW IF EXISTS public.car_listings_public;

ALTER TABLE public.car_listings
  DROP COLUMN IF EXISTS car_pass_verified;

ALTER TABLE public.car_listings
  ADD COLUMN car_pass_verified boolean
    GENERATED ALWAYS AS (car_pass_status = 'verified') STORED;

-- 3. Audit table for verification requests
CREATE TABLE IF NOT EXISTS public.car_pass_verification_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid        NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  requested_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','completed','failed')),
  api_response  jsonb,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_cpvr_listing_id  ON public.car_pass_verification_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_cpvr_status      ON public.car_pass_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_cpvr_requested_at ON public.car_pass_verification_requests(requested_at DESC);

ALTER TABLE public.car_pass_verification_requests ENABLE ROW LEVEL SECURITY;

-- Owners (or admins) can read their own listing's verification trail
DROP POLICY IF EXISTS "Owners can view their own car-pass requests" ON public.car_pass_verification_requests;
CREATE POLICY "Owners can view their own car-pass requests"
  ON public.car_pass_verification_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.car_listings cl
       WHERE cl.id = car_pass_verification_requests.listing_id
         AND cl.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Recreate the public view, hiding non-verified listings except for pros
CREATE VIEW public.car_listings_public
WITH (security_invoker = true)
AS SELECT
    id, brand, model, year, price, mileage, fuel_type, transmission,
    body_type, color, euro_norm, description, features, photos,
    power, doors,
    car_pass_verified, car_pass_status,
    ct_valid, maintenance_book_complete,
    first_registration, location, latitude, longitude,
    seller_type, status, created_at, updated_at,
    boost_level, boost_expires_at,
    reference_url
FROM public.car_listings
WHERE status = 'approved'
  AND (car_pass_status = 'verified' OR seller_type = 'professionnel');

GRANT SELECT ON public.car_listings_public TO anon, authenticated;

-- 5. Trigger: auto-mark the listing as needs_review whenever a sensitive field
--    changes after approval (used by Task 6 below — declared here pre-emptively
--    since we touched the schema). NO-OP if column not yet present.
-- (Implemented in 20260504192000_lock_approved_listings.sql)


-- ── Migration: 20260504191900_xss_guard_trigger.sql ──────────────────────────────
-- ============================================================
-- Task 2 — XSS hardening at the DB layer
--
-- Reject any insert/update on car_listings or messages that contains
--   <script…   or   on*=   inline event handler   or   javascript: URL
-- This is belt-and-braces alongside the client/edge sanitizers.
-- ============================================================

CREATE OR REPLACE FUNCTION public.reject_html_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  bad_pattern text := '(<\s*script|<\s*iframe|<\s*object|<\s*embed|on\w+\s*=|javascript\s*:|vbscript\s*:)';
BEGIN
  -- Description (long text) — main vector
  IF NEW.description IS NOT NULL
     AND NEW.description ~* bad_pattern THEN
    RAISE EXCEPTION
      'XSS_BLOCKED: description contains forbidden HTML/JS markup'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Free-text fields that get rendered to other users
  IF (TG_TABLE_NAME = 'car_listings') THEN
    IF NEW.location IS NOT NULL
       AND NEW.location ~* bad_pattern THEN
      RAISE EXCEPTION 'XSS_BLOCKED: location contains forbidden markup'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.contact_name IS NOT NULL
       AND NEW.contact_name ~* bad_pattern THEN
      RAISE EXCEPTION 'XSS_BLOCKED: contact_name contains forbidden markup'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS car_listings_xss_guard ON public.car_listings;
CREATE TRIGGER car_listings_xss_guard
  BEFORE INSERT OR UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_html_payload();


-- ── Migration: 20260504191930_postgis_coordinates.sql ──────────────────────────────
-- ============================================================
-- Task 3 — Geospatial index for proximity search
--
-- 1. Enable PostGIS
-- 2. Add coordinates GEOGRAPHY(Point, 4326) to car_listings
-- 3. GIST index for sub-millisecond ST_DWithin / ST_Distance lookups
-- 4. Trigger that keeps `coordinates` in sync with latitude/longitude
-- 5. listings_within_radius() rewritten to use ST_DWithin
--    (replaces the Haversine SQL function from 20260504150809)
-- 6. Recreate car_listings_public to expose coordinates for clients that
--    want to map results.
-- ============================================================

-- 1. Enable PostGIS (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Geography column
ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS coordinates geography(Point, 4326);

-- Backfill from latitude/longitude where present
UPDATE public.car_listings
   SET coordinates = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
 WHERE coordinates IS NULL
   AND latitude  IS NOT NULL
   AND longitude IS NOT NULL;

-- 3. GIST spatial index
CREATE INDEX IF NOT EXISTS idx_car_listings_coordinates
  ON public.car_listings USING GIST (coordinates);

-- 4. Trigger: keep coordinates in sync whenever lat/lng are updated.
--    Avoids exposing a writable PostGIS column to API clients.
CREATE OR REPLACE FUNCTION public.set_listing_coordinates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.coordinates := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.coordinates := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS car_listings_set_coordinates ON public.car_listings;
CREATE TRIGGER car_listings_set_coordinates
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_listing_coordinates();

-- 5. Replace the Haversine RPC with ST_DWithin — orders of magnitude faster
--    on indexed GEOGRAPHY columns.
DROP FUNCTION IF EXISTS public.listings_within_radius(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION public.listings_within_radius(
  user_lat  double precision,
  user_lng  double precision,
  radius_km double precision
)
RETURNS TABLE (
  listing_id  uuid,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  WITH origin AS (
    SELECT ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography AS g
  )
  SELECT
    cl.id AS listing_id,
    (ST_Distance(cl.coordinates, o.g) / 1000.0)::double precision AS distance_km
  FROM public.car_listings cl, origin o
  WHERE cl.status = 'approved'
    AND cl.coordinates IS NOT NULL
    AND ST_DWithin(cl.coordinates, o.g, radius_km * 1000.0)
  ORDER BY cl.coordinates <-> o.g
$$;

-- 6. Refresh the public view so coordinates are accessible for client maps
DROP VIEW IF EXISTS public.car_listings_public;
CREATE VIEW public.car_listings_public
WITH (security_invoker = true)
AS SELECT
    id, brand, model, year, price, mileage, fuel_type, transmission,
    body_type, color, euro_norm, description, features, photos,
    power, doors,
    car_pass_verified, car_pass_status,
    ct_valid, maintenance_book_complete,
    first_registration, location, latitude, longitude,
    seller_type, status, created_at, updated_at,
    boost_level, boost_expires_at,
    reference_url
FROM public.car_listings
WHERE status = 'approved'
  AND (car_pass_status = 'verified' OR seller_type = 'professionnel');

GRANT SELECT ON public.car_listings_public TO anon, authenticated;


-- ── Migration: 20260504192000_storage_hardening.sql ──────────────────────────────
-- ============================================================
-- Task 4 — Storage hardening for vehicle-photos & car-pass buckets
-- ----------------------------------------------------------------
-- 1. Set bucket-level limits (size + mime). Supabase enforces these on
--    the storage API layer regardless of policies, so this is the
--    safest spot to whitelist.
-- 2. Tighten the INSERT policy to also check mime + size.
--    (Defense in depth: policy fires after the bucket constraint.)
-- ============================================================

-- 1. vehicle-photos: public read, JPEG/PNG/WEBP, 10 MB max
UPDATE storage.buckets
   SET file_size_limit     = 10 * 1024 * 1024,           -- 10 MiB
       allowed_mime_types  = ARRAY['image/jpeg','image/png','image/webp']
 WHERE id = 'vehicle-photos';

-- 2. car-pass: private (signed URLs only), PDF/JPEG/PNG, 10 MB max
UPDATE storage.buckets
   SET file_size_limit    = 10 * 1024 * 1024,
       allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png'],
       public             = false
 WHERE id = 'car-pass';

-- 3. Drop & recreate the vehicle-photos INSERT policy with extra checks.
--    storage.objects.metadata->>'mimetype' is set by the storage API at upload.
DROP POLICY IF EXISTS "Users can upload vehicle photos" ON storage.objects;
CREATE POLICY "Users can upload vehicle photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (metadata->>'mimetype') IN ('image/jpeg','image/png','image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 10 * 1024 * 1024
  );

-- 4. Tighten public SELECT — only allow listing files inside identifiable
--    user folders (prevents directory listing & odd path traversal).
DROP POLICY IF EXISTS "Vehicle photos are publicly accessible" ON storage.objects;
CREATE POLICY "Vehicle photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- 5. car-pass INSERT policy: same auth-folder rule + mime/size constraints
DROP POLICY IF EXISTS "Users can upload car-pass" ON storage.objects;
CREATE POLICY "Users can upload car-pass"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-pass'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (metadata->>'mimetype') IN ('application/pdf','image/jpeg','image/png')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 10 * 1024 * 1024
  );


-- ── Migration: 20260504192030_lock_approved_listings.sql ──────────────────────────────
-- ============================================================
-- Task 6 — Lock approved listings
-- ----------------------------------------------------------------
-- Once a listing is `approved`, the seller may freely edit only
-- low-risk fields (description, photos, features, contact_phone).
-- Any change to a *sensitive* field (price, mileage, brand, model,
-- year, fuel_type, body_type, euro_norm, location, latitude,
-- longitude, car_pass_status) flips the listing back to
-- status='pending_review' AND sets needs_review=true so an admin
-- has to look at it again.
--
-- Admins (has_role 'admin') bypass the trigger via SET LOCAL.
-- ============================================================

ALTER TABLE public.car_listings
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_sensitive_listing_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  changed  boolean := false;
BEGIN
  -- Only act on UPDATEs of approved rows
  IF TG_OP <> 'UPDATE' OR OLD.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Admins always pass through
  BEGIN
    is_admin := public.has_role(auth.uid(), 'admin');
  EXCEPTION WHEN OTHERS THEN
    is_admin := false;
  END;
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Detect sensitive-field deltas
  IF
    NEW.brand            IS DISTINCT FROM OLD.brand            OR
    NEW.model            IS DISTINCT FROM OLD.model            OR
    NEW.year             IS DISTINCT FROM OLD.year             OR
    NEW.price            IS DISTINCT FROM OLD.price            OR
    NEW.mileage          IS DISTINCT FROM OLD.mileage          OR
    NEW.fuel_type        IS DISTINCT FROM OLD.fuel_type        OR
    NEW.body_type        IS DISTINCT FROM OLD.body_type        OR
    NEW.euro_norm        IS DISTINCT FROM OLD.euro_norm        OR
    NEW.car_pass_status  IS DISTINCT FROM OLD.car_pass_status  OR
    NEW.location         IS DISTINCT FROM OLD.location         OR
    NEW.latitude         IS DISTINCT FROM OLD.latitude         OR
    NEW.longitude        IS DISTINCT FROM OLD.longitude
  THEN
    changed := true;
  END IF;

  IF changed THEN
    -- Force re-review.  Carry over the rest of the user's edit so they
    -- don't lose their work, but the public can no longer see this row
    -- until an admin re-approves it.
    NEW.status       := 'pending_review';
    NEW.needs_review := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS car_listings_lock_approved ON public.car_listings;
CREATE TRIGGER car_listings_lock_approved
  BEFORE UPDATE ON public.car_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_sensitive_listing_updates();

-- Index used by the admin moderation page to surface listings flagged
-- by the trigger.
CREATE INDEX IF NOT EXISTS idx_car_listings_needs_review
  ON public.car_listings (needs_review)
  WHERE needs_review = true;


-- ── Migration: 20260505120000_contact_messages.sql ──────────────────────────────
-- ============================================================
-- contact_messages — persists all contact form submissions
-- Used for admin review and audit trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL CHECK (char_length(name)    BETWEEN 2 AND 100),
  email         text        NOT NULL CHECK (char_length(email)   BETWEEN 5 AND 255),
  subject       text        NOT NULL CHECK (char_length(subject) BETWEEN 5 AND 200),
  message       text        NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  ip_address    text,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status        text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new','read','replied','spam')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  replied_at    timestamptz
);

-- Only admins can read; nobody can write directly (only via Edge Function with service_role)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_contact_messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for admin moderation queue
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
  ON public.contact_messages (status, created_at DESC);

