
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
