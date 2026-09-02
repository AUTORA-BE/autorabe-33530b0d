-- =====================================================================
-- BASELINE SCHEMA — reference snapshot of the LIVE public schema
-- Generated: %Y-%m-%dT%H:%M:%SZ (pg_dump --schema-only --schema=public --no-owner)
--
-- DO NOT RUN THIS FILE against an existing database and DO NOT EDIT IT.
-- It exists only to stop the repo drifting from production: every object
-- below is what actually exists in the database as of this date.
-- Any further change must be a NEW migration file after this baseline.
-- =====================================================================

--
-- PostgreSQL database dump
--

\restrict Oqkrm2Q7g6kqAuJKuo4ITMMN41U9uz3fIxJdt5cmEeJU6a1ho0eLZTceKkLv9ly

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: admin_get_listing_contacts(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_listing_contacts(_ids uuid[]) RETURNS TABLE(id uuid, contact_name text, contact_email text, contact_phone text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cl.id, cl.contact_name, cl.contact_email, cl.contact_phone
  FROM public.car_listings cl
  WHERE cl.id = ANY(_ids);
END;
$$;


--
-- Name: admin_get_user_contact(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_user_contact(_user_id uuid) RETURNS TABLE(user_id uuid, email text, display_name text, garage_name text, user_type text, phone text, postal_code text, avatar_url text, bce_number text, suspended_at timestamp with time zone, suspended_reason text, created_at timestamp with time zone, listing_count bigint, subscription_product_id text, subscription_status text, subscription_end timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.garage_name,
    p.user_type,
    p.phone,
    p.postal_code,
    p.avatar_url,
    p.bce_number,
    p.suspended_at,
    p.suspended_reason,
    p.created_at,
    COALESCE((SELECT count(*) FROM public.car_listings cl WHERE cl.user_id = p.user_id), 0)::bigint,
    s.product_id,
    s.status,
    s.current_period_end
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN LATERAL (
    SELECT sub.product_id, sub.status, sub.current_period_end
    FROM public.subscriptions sub
    WHERE sub.user_id = p.user_id
    ORDER BY (sub.status = 'active') DESC, sub.updated_at DESC
    LIMIT 1
  ) s ON true
  WHERE p.user_id = _user_id
  LIMIT 1;
END;
$$;


--
-- Name: admin_get_user_emails(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_user_emails(_user_ids uuid[]) RETURNS TABLE(user_id uuid, email text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT u.id AS user_id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(_user_ids);
END;
$$;


--
-- Name: admin_list_listings_with_contacts(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_listings_with_contacts(_limit integer DEFAULT 500) RETURNS TABLE(id uuid, user_id uuid, brand text, model text, year integer, price integer, mileage integer, fuel_type text, transmission text, location text, photos text[], contact_name text, contact_email text, contact_phone text, created_at timestamp with time zone, status text, seller_type text, description text, euro_norm text, boost_level text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT cl.id, cl.user_id, cl.brand, cl.model, cl.year, cl.price, cl.mileage,
         cl.fuel_type, cl.transmission, cl.location, cl.photos,
         cl.contact_name, cl.contact_email, cl.contact_phone,
         cl.created_at, cl.status, cl.seller_type, cl.description,
         cl.euro_norm, cl.boost_level
  FROM public.car_listings cl
  ORDER BY cl.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 5000));
END;
$$;


--
-- Name: admin_review_car_pass(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_review_car_pass(_listing_id uuid, _decision text, _note text DEFAULT NULL::text) RETURNS TABLE(out_listing_id uuid, out_car_pass_status text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_admin, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Reserve aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF _decision NOT IN ('verified','rejected') THEN
    RAISE EXCEPTION 'Decision invalide: %', _decision USING ERRCODE = '22023';
  END IF;

  UPDATE public.car_listings cl SET car_pass_status = _decision WHERE cl.id = _listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Annonce introuvable' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.car_pass_verification_requests r
     SET status = 'completed',
         completed_at = now(),
         error_message = CASE WHEN _decision = 'rejected' THEN _note ELSE NULL END
   WHERE r.listing_id = _listing_id AND r.status = 'pending';

  INSERT INTO public.audit_log (user_id, action, details)
  VALUES (v_admin, 'car_pass_review',
          jsonb_build_object('listing_id', _listing_id, 'decision', _decision, 'note', _note));

  RETURN QUERY SELECT cl.id, cl.car_pass_status FROM public.car_listings cl WHERE cl.id = _listing_id;
END;
$$;


--
-- Name: check_rate_limit(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_rate_limit(_key text, _max_attempts integer, _window_seconds integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: clear_user_view_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clear_user_view_history() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: delete_email(text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_email(queue_name text, message_id bigint) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pgmq'
    AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;


--
-- Name: email_queue_dispatch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.email_queue_dispatch() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pgmq.q_auth_emails)
     AND NOT EXISTS (SELECT 1 FROM pgmq.q_transactional_emails) THEN
    BEGIN
      -- Serialize disarm against email_queue_wake on a shared advisory lock, then
      -- re-read under it: an enqueue racing the unschedule either committed (we
      -- see its row and leave the cron) or waits and re-arms after we commit.
      PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000001);
      IF EXISTS (SELECT 1 FROM pgmq.q_auth_emails)
         OR EXISTS (SELECT 1 FROM pgmq.q_transactional_emails) THEN
        RETURN;
      END IF;
      PERFORM cron.unschedule('process-email-queue');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email_queue_dispatch: cron unschedule failed: %', SQLERRM;
    END;
    RETURN;
  END IF;

  IF (SELECT retry_after_until FROM public.email_send_state WHERE id = 1) > now() THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://jbdsjqoonpieusfvkhyo.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
END;
$$;


--
-- Name: email_queue_wake(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.email_queue_wake() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
BEGIN
  -- Runs inside the enqueue transaction; the outer handler guarantees nothing
  -- below can roll back the customer's email. Shared advisory lock serializes
  -- arming against email_queue_dispatch's disarm.
  PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000001);
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue') THEN
    BEGIN
      PERFORM cron.schedule('process-email-queue', '5 seconds', $cron$ SELECT public.email_queue_dispatch(); $cron$);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email_queue_wake: cron schedule failed: %', SQLERRM;
    END;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://jbdsjqoonpieusfvkhyo.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Lovable-Context', 'cron',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'email_queue_wake failed (enqueue preserved): %', SQLERRM;
  RETURN NULL;
END;
$_$;


--
-- Name: enforce_car_view_rate_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_car_view_rate_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ip_hash IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.car_views WHERE car_listing_id = NEW.car_listing_id
      AND ip_hash = NEW.ip_hash AND viewed_at > NOW() - INTERVAL '1 hour' LIMIT 1)
  THEN RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001'; END IF;
  RETURN NEW;
END; $$;


--
-- Name: enforce_pro_car_pass(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_pro_car_pass() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.seller_type = 'professionnel' AND COALESCE(NEW.status,'active') <> 'draft' THEN
    IF NEW.car_pass_url IS NULL OR length(trim(NEW.car_pass_url)) = 0 THEN
      RAISE EXCEPTION 'car_pass_required_for_professional' USING ERRCODE = 'P0001',
        HINT = 'Les vendeurs professionnels doivent fournir un document Car-Pass.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: enqueue_email(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enqueue_email(queue_name text, payload jsonb) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pgmq'
    AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;


--
-- Name: ensure_vitrine_slug(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_vitrine_slug() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  IF NEW.vitrine_slug IS NULL OR NEW.vitrine_slug = '' THEN
    base := COALESCE(
      NULLIF(regexp_replace(lower(unaccent(coalesce(NEW.garage_name, ''))), '[^a-z0-9]+', '-', 'g'), ''),
      NULLIF(regexp_replace(lower(unaccent(coalesce(NEW.display_name, ''))), '[^a-z0-9]+', '-', 'g'), ''),
      'garage-' || substr(NEW.user_id::text, 1, 8)
    );
    base := trim(both '-' from base);
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE vitrine_slug = candidate AND user_id <> NEW.user_id) LOOP
      i := i + 1;
      candidate := base || '-' || i::text;
    END LOOP;
    NEW.vitrine_slug := candidate;
  END IF;
  IF NEW.vitrine_published IS NULL THEN
    NEW.vitrine_published := true;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: generate_unique_vitrine_slug(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_vitrine_slug(_desired text, _user_id uuid) RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _base text;
  _candidate text;
  _suffix int := 0;
BEGIN
  _base := public.slugify_garage_name(_desired);
  IF _base IS NULL OR length(_base) < 3 THEN
    SELECT public.slugify_garage_name(coalesce(garage_name, display_name, ''))
      INTO _base
    FROM public.profiles
    WHERE user_id = _user_id;
  END IF;
  IF _base IS NULL OR length(_base) < 3 THEN
    _base := 'garage-' || substr(_user_id::text, 1, 8);
  END IF;

  _candidate := _base;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(vitrine_slug) = _candidate
      AND user_id <> _user_id
  ) LOOP
    _suffix := _suffix + 1;
    _candidate := left(_base, 60 - length(_suffix::text) - 1) || '-' || _suffix::text;
  END LOOP;

  RETURN _candidate;
END;
$$;


--
-- Name: get_active_cities_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_active_cities_count() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COUNT(DISTINCT location)::integer
  FROM public.car_listings
  WHERE status = 'approved' AND location IS NOT NULL AND location <> '';
$$;


--
-- Name: get_favorite_counts(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_favorite_counts(listing_ids uuid[]) RETURNS TABLE(car_listing_id uuid, favorite_count bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT f.car_listing_id, count(*) as favorite_count
  FROM public.favorites f
  WHERE f.car_listing_id = ANY(listing_ids)
  GROUP BY f.car_listing_id
$$;


--
-- Name: get_listing_for_buyer(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_listing_for_buyer(_listing_id uuid) RETURNS TABLE(id uuid, user_id uuid, brand text, model text, year integer, price integer, mileage integer, fuel_type text, transmission text, body_type text, color text, power integer, doors integer, euro_norm text, car_pass_verified boolean, first_registration date, description text, features text[], photos text[], location text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, ct_valid boolean, maintenance_book_complete boolean, seller_type text, tva_number text, boost_level text, boost_expires_at timestamp with time zone, car_pass_url text, car_pass_date date)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_listing_popularity(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_listing_popularity(listing_ids uuid[]) RETURNS TABLE(listing_id uuid, favorite_count bigint, view_count bigint, interaction_count bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_public_listing(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_public_listing(_listing_id uuid) RETURNS TABLE(id uuid, user_id uuid, brand text, model text, year integer, price integer, mileage integer, fuel_type text, transmission text, body_type text, color text, power integer, doors integer, euro_norm text, car_pass_verified boolean, first_registration date, description text, features text[], photos text[], location text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, ct_valid boolean, maintenance_book_complete boolean, seller_type text, tva_number text, boost_level text, boost_expires_at timestamp with time zone, car_pass_url text, car_pass_date date)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: get_public_seller_identity(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_public_seller_identity(_user_id uuid) RETURNS TABLE(user_id uuid, display_name text, garage_name text, avatar_url text, user_type text, created_at timestamp with time zone, is_admin boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url,
         p.user_type, p.created_at,
         public.has_role(p.user_id, 'admin'::app_role)
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND EXISTS (SELECT 1 FROM public.car_listings cl
                 WHERE cl.user_id = p.user_id AND cl.status = 'approved')
  LIMIT 1
$$;


--
-- Name: FUNCTION get_public_seller_identity(_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_public_seller_identity(_user_id uuid) IS 'Identite publique minimale d un vendeur ayant au moins une annonce approuvee. Comble le trou de /seller/:userId qui interrogeait profiles en direct sans policy SELECT pour anon.';


--
-- Name: get_public_vitrine(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_public_vitrine(_slug_or_user text) RETURNS TABLE(user_id uuid, display_name text, garage_name text, avatar_url text, postal_code text, vitrine_slug text, vitrine_cover_url text, vitrine_about text, vitrine_services text[], vitrine_phone text, vitrine_email_public text, is_admin boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url, p.postal_code,
         p.vitrine_slug, p.vitrine_cover_url, p.vitrine_about, p.vitrine_services,
         p.vitrine_phone, p.vitrine_email_public,
         public.has_role(p.user_id, 'admin'::app_role)
  FROM public.profiles p
  WHERE (p.vitrine_slug = _slug_or_user OR p.user_id::text = _slug_or_user)
    AND public.is_vitrine_eligible(p.user_id)
  LIMIT 1
$$;


--
-- Name: get_reviewers_profiles(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_reviewers_profiles(_user_ids uuid[]) RETURNS TABLE(user_id uuid, display_name text, avatar_url text, is_admin boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT p.id, COALESCE(p.display_name, p.garage_name, 'Utilisateur'), p.avatar_url, public.is_admin_user(p.id)
  FROM public.profiles p WHERE p.id = ANY(_user_ids);
$$;


--
-- Name: get_seller_contact(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_seller_contact(listing_id uuid) RETURNS TABLE(contact_name text, contact_phone text, contact_email text, user_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid uuid := auth.uid();
  _allowed boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  SELECT public.check_rate_limit('get_seller_contact:' || _uid::text, 30, 3600) INTO _allowed;
  IF _allowed IS NOT TRUE THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cl.contact_name,
    CASE
      WHEN cl.user_id = _uid
        OR public.has_role(_uid, 'admin'::app_role)
        OR public.has_conversation_with_listing(cl.id, _uid)
      THEN cl.contact_phone
    END,
    CASE
      WHEN cl.user_id = _uid
        OR public.has_role(_uid, 'admin'::app_role)
        OR public.has_conversation_with_listing(cl.id, _uid)
      THEN cl.contact_email
    END,
    cl.user_id
  FROM public.car_listings cl
  WHERE cl.id = listing_id
    AND cl.status = 'approved';
END;
$$;


--
-- Name: get_seller_display(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_seller_display(listing_id uuid) RETURNS TABLE(user_id uuid, display_name text, garage_name text, user_type text, avatar_url text, vitrine_slug text, vitrine_published boolean, is_admin boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT p.user_id,
         p.display_name,
         p.garage_name,
         p.user_type,
         p.avatar_url,
         CASE WHEN public.is_vitrine_eligible(p.user_id) THEN p.vitrine_slug ELSE NULL END,
         CASE WHEN public.is_vitrine_eligible(p.user_id) THEN p.vitrine_published ELSE false END,
         public.has_role(p.user_id, 'admin'::app_role)
  FROM public.car_listings cl
  JOIN public.profiles p ON p.user_id = cl.user_id
  WHERE cl.id = listing_id
    AND cl.status = 'approved'
  LIMIT 1
$$;


--
-- Name: get_seller_public_listings(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_seller_public_listings(_seller_id uuid) RETURNS TABLE(id uuid, brand text, model text, year integer, price integer, mileage integer, fuel_type text, transmission text, photos text[], location text, created_at timestamp with time zone, body_type text, color text, power integer, doors integer, euro_norm text, car_pass_verified boolean, description text, features text[], boost_level text, boost_expires_at timestamp with time zone, seller_type text, first_registration date, ct_valid boolean, maintenance_book_complete boolean, status text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_unread_message_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unread_message_count() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(COUNT(m.id), 0)::integer
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE auth.uid() IS NOT NULL
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    AND m.sender_id <> auth.uid()
    AND m.is_read = false;
$$;


--
-- Name: get_user_view_history(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_view_history(_limit integer DEFAULT 50) RETURNS TABLE(id uuid, brand text, model text, year integer, price integer, mileage integer, fuel_type text, transmission text, body_type text, color text, power integer, doors integer, euro_norm text, car_pass_verified boolean, first_registration date, description text, features text[], photos text[], location text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, ct_valid boolean, maintenance_book_complete boolean, seller_type text, boost_level text, boost_expires_at timestamp with time zone, last_viewed_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
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


--
-- Name: guard_sensitive_listing_updates(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_sensitive_listing_updates() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE is_admin boolean := false; changed boolean := false;
BEGIN
  IF TG_OP <> 'UPDATE' OR OLD.status <> 'approved' THEN RETURN NEW; END IF;
  BEGIN is_admin := public.has_role(auth.uid(), 'admin'); EXCEPTION WHEN OTHERS THEN is_admin := false; END;
  IF is_admin THEN RETURN NEW; END IF;
  IF NEW.brand IS DISTINCT FROM OLD.brand OR NEW.model IS DISTINCT FROM OLD.model
     OR NEW.year IS DISTINCT FROM OLD.year OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.mileage IS DISTINCT FROM OLD.mileage OR NEW.fuel_type IS DISTINCT FROM OLD.fuel_type
     OR NEW.body_type IS DISTINCT FROM OLD.body_type OR NEW.euro_norm IS DISTINCT FROM OLD.euro_norm
     OR NEW.car_pass_status IS DISTINCT FROM OLD.car_pass_status
     OR NEW.location IS DISTINCT FROM OLD.location
     OR NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude
  THEN changed := true; END IF;
  IF changed THEN
    PERFORM set_config('autora.rereview', '1', true);
    NEW.status := 'pending_review'; NEW.needs_review := true;
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: handle_new_user_preferences(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_preferences() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _user_type text := COALESCE(NULLIF(_meta->>'user_type',''), 'particulier');
  _garage_name text := NULLIF(_meta->>'garage_name','');
  _bce text := NULLIF(_meta->>'bce_number','');
  _phone text := NULLIF(_meta->>'phone','');
  _postal text := NULLIF(_meta->>'postal_code','');
  _full_name text := COALESCE(_meta->>'full_name', NEW.email);
  _queue_id uuid;
BEGIN
  IF _user_type NOT IN ('particulier','professionnel') THEN
    _user_type := 'particulier';
  END IF;

  BEGIN
    INSERT INTO public.profiles (
      user_id, display_name, user_type, garage_name, bce_number, phone, postal_code
    ) VALUES (
      NEW.id, _full_name, _user_type,
      CASE WHEN _user_type = 'professionnel' THEN _garage_name ELSE NULL END,
      CASE WHEN _user_type = 'professionnel' THEN _bce ELSE NULL END,
      _phone, _postal
    )
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      user_type = EXCLUDED.user_type,
      garage_name = EXCLUDED.garage_name,
      bce_number = EXCLUDED.bce_number,
      phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
      postal_code = COALESCE(public.profiles.postal_code, EXCLUDED.postal_code);

    IF _user_type = 'professionnel' THEN
      INSERT INTO public.dealer_verification_queue (
        user_id, status, garage_name_snapshot, bce_snapshot
      ) VALUES (NEW.id, 'pending', _garage_name, _bce)
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id INTO _queue_id;

      -- Log non-PII : on stocke seulement des booléens et longueurs
      INSERT INTO public.dealer_events (event_type, user_id, queue_id, meta)
      VALUES (
        'pro_signup', NEW.id, _queue_id,
        jsonb_build_object(
          'has_garage_name', _garage_name IS NOT NULL,
          'has_bce', _bce IS NOT NULL,
          'has_phone', _phone IS NOT NULL,
          'postal_prefix', LEFT(COALESCE(_postal,''), 1)
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- On capture l'erreur sans bloquer la création auth
    INSERT INTO public.dealer_events (event_type, user_id, meta)
    VALUES (
      'trigger_error', NEW.id,
      jsonb_build_object(
        'sqlstate', SQLSTATE,
        'context', 'handle_new_user_profile',
        'user_type', _user_type
      )
    );
  END;

  RETURN NEW;
END;
$$;


--
-- Name: has_conversation_with_listing(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_conversation_with_listing(_listing_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE car_listing_id = _listing_id
      AND (buyer_id = _user_id OR seller_id = _user_id)
  )
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_user(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;


--
-- Name: is_user_suspended(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_suspended(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND suspended_at IS NOT NULL
  )
$$;


--
-- Name: is_vitrine_eligible(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_vitrine_eligible(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    _user_id IS NOT NULL
    AND (
      public.has_role(_user_id, 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.user_id = _user_id
          AND s.status = 'active'
          AND s.product_id IN (
            'prod_UKno1VUDM4yfzP', -- Pro Garage
            'prod_UKo0UuUbuB5vdq'  -- Premium
          )
          AND (s.current_period_end IS NULL OR s.current_period_end > now())
      )
    );
$$;


--
-- Name: is_vitrine_slug_available(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_vitrine_slug_available(_slug text, _user_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  _normalized text;
BEGIN
  _normalized := NULLIF(regexp_replace(lower(trim(coalesce(_slug, ''))), '[^a-z0-9-]', '', 'g'), '');
  -- Format invalid → not available
  IF _normalized IS NULL OR _normalized !~ '^[a-z0-9-]{3,60}$' THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(vitrine_slug) = _normalized
      AND user_id <> _user_id
  );
END;
$_$;


--
-- Name: listings_within_radius(double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.listings_within_radius(user_lat double precision, user_lng double precision, radius_km double precision) RETURNS TABLE(listing_id uuid, distance_km double precision)
    LANGUAGE sql STABLE
    AS $$
  WITH origin AS (SELECT ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography AS g)
  SELECT cl.id, (ST_Distance(cl.coordinates, o.g) / 1000.0)::double precision
  FROM public.car_listings cl, origin o
  WHERE cl.status = 'approved' AND cl.coordinates IS NOT NULL
    AND ST_DWithin(cl.coordinates, o.g, radius_km * 1000.0)
  ORDER BY cl.coordinates <-> o.g
$$;


--
-- Name: move_to_dlq(text, text, bigint, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pgmq'
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


--
-- Name: normalize_vitrine_slug(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.normalize_vitrine_slug() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Normalize: lowercase, trim, strip invalid chars
  IF NEW.vitrine_slug IS NOT NULL THEN
    NEW.vitrine_slug := NULLIF(
      regexp_replace(lower(trim(NEW.vitrine_slug)), '[^a-z0-9-]', '', 'g'),
      ''
    );
    -- If normalization left it too short/long, drop it (CHECK would block otherwise)
    IF NEW.vitrine_slug IS NOT NULL
       AND (length(NEW.vitrine_slug) < 3 OR length(NEW.vitrine_slug) > 60) THEN
      NEW.vitrine_slug := NULL;
    END IF;
  END IF;

  -- Cannot publish without a valid slug — force back to draft
  IF NEW.vitrine_published = true AND NEW.vitrine_slug IS NULL THEN
    NEW.vitrine_published := false;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: notify_alerts_on_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_alerts_on_approval() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_key text;
BEGIN
  -- Uniquement au passage vers 'approved'
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';
  IF v_key IS NULL THEN
    RAISE WARNING 'notify_alerts_on_approval: secret introuvable, alertes non declenchees';
    RETURN NEW;
  END IF;

  -- Appel asynchrone : n'allonge pas la transaction et ne peut pas la faire echouer.
  PERFORM net.http_post(
    url := 'https://jbdsjqoonpieusfvkhyo.supabase.co/functions/v1/match-new-vehicle',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer ' || v_key),
    body := jsonb_build_object('vehicle', jsonb_build_object(
      'id', NEW.id, 'brand', NEW.brand, 'model', NEW.model, 'price', NEW.price,
      'year', NEW.year, 'mileage', NEW.mileage, 'fuel_type', NEW.fuel_type,
      'euro_norm', NEW.euro_norm, 'car_pass_verified', NEW.car_pass_verified,
      'location', NEW.location, 'photos', NEW.photos))
  );
  RETURN NEW;
END;
$$;


--
-- Name: prevent_status_self_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_status_self_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF coalesce(current_setting('autora.rereview', true), '') = '1' THEN RETURN NEW; END IF;
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only administrators can change listing status' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: protect_privileged_profile_columns(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_privileged_profile_columns() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR public.has_role(_uid, 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF  NEW.user_type        IS DISTINCT FROM OLD.user_type
   OR NEW.garage_name      IS DISTINCT FROM OLD.garage_name
   OR NEW.bce_number       IS DISTINCT FROM OLD.bce_number
   OR NEW.suspended_at     IS DISTINCT FROM OLD.suspended_at
   OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
  THEN
    RAISE EXCEPTION 'privileged_profile_column_change_denied'
      USING ERRCODE = '42501',
            HINT = 'Statut professionnel et suspension sont reserves aux administrateurs.';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: read_email_batch(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pgmq'
    AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;


--
-- Name: reject_html_payload(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reject_html_payload() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  -- \m = début de mot (Postgres). Sans lui, « Consommation = 5.2L » et
  -- « Options = CarPlay » étaient bloqués à tort : le motif on\w+\s*=
  -- matchait le « on » au milieu du mot. Corrigé le 2026-08-06.
  bad_pattern text := '(<\s*script|<\s*iframe|<\s*object|<\s*embed|\mon\w+\s*=|javascript\s*:|vbscript\s*:)';
BEGIN
  IF NEW.description IS NOT NULL AND NEW.description ~* bad_pattern THEN
    RAISE EXCEPTION 'XSS_BLOCKED: description contient du balisage interdit'
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_TABLE_NAME = 'car_listings' THEN
    IF NEW.location IS NOT NULL AND NEW.location ~* bad_pattern THEN
      RAISE EXCEPTION 'XSS_BLOCKED: location' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.contact_name IS NOT NULL AND NEW.contact_name ~* bad_pattern THEN
      RAISE EXCEPTION 'XSS_BLOCKED: contact_name' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: search_public_vitrines(text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_public_vitrines(_q text DEFAULT NULL::text, _city text DEFAULT NULL::text, _limit integer DEFAULT 60) RETURNS TABLE(user_id uuid, display_name text, garage_name text, avatar_url text, postal_code text, vitrine_slug text, vitrine_cover_url text, vitrine_about text, vitrine_services text[])
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT p.user_id, p.display_name, p.garage_name, p.avatar_url, p.postal_code,
         p.vitrine_slug, p.vitrine_cover_url, p.vitrine_about, p.vitrine_services
  FROM public.profiles p
  WHERE p.vitrine_published = true
    AND p.user_type = 'professionnel'
    AND p.vitrine_slug IS NOT NULL
    AND public.is_vitrine_eligible(p.user_id)
    AND (
      _q IS NULL OR length(trim(_q)) = 0
      OR p.garage_name ILIKE '%' || _q || '%'
      OR p.display_name ILIKE '%' || _q || '%'
      OR p.vitrine_slug ILIKE '%' || _q || '%'
    )
    AND (
      _city IS NULL OR length(trim(_city)) = 0
      OR p.postal_code ILIKE _city || '%'
    )
  ORDER BY p.garage_name NULLS LAST, p.display_name
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;


--
-- Name: set_listing_coordinates(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_listing_coordinates() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.coordinates := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE NEW.coordinates := NULL; END IF;
  RETURN NEW;
END; $$;


--
-- Name: slugify_garage_name(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.slugify_garage_name(_input text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public', 'extensions'
    AS $_$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(
        trim(BOTH '-' FROM regexp_replace(
          lower(public.unaccent(coalesce(_input, ''))),
          '[^a-z0-9]+', '-', 'g'
        )),
        '-{2,}', '-', 'g'
      ),
      '^(.{1,60}).*$', '\1'
    ),
    ''
  );
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    action_type text NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alert_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alert_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_id uuid NOT NULL,
    car_listing_id uuid NOT NULL,
    match_score integer NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: belgian_annual_tax_brackets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.belgian_annual_tax_brackets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    region text NOT NULL,
    cv_min integer NOT NULL,
    cv_max integer NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    diesel_surcharge_pct numeric(5,2) DEFAULT 0 NOT NULL,
    lpg_surcharge_per_cv numeric(10,2) DEFAULT 0 NOT NULL,
    electric_amount numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT belgian_annual_tax_brackets_region_check CHECK ((region = ANY (ARRAY['bruxelles'::text, 'wallonie'::text, 'flandre'::text])))
);


--
-- Name: belgian_tmc_age_reductions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.belgian_tmc_age_reductions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    region text NOT NULL,
    age_min_years integer NOT NULL,
    age_max_years integer,
    coefficient numeric(4,3) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT belgian_tmc_age_reductions_region_check CHECK ((region = ANY (ARRAY['bruxelles'::text, 'wallonie'::text, 'flandre'::text])))
);


--
-- Name: belgian_tmc_brackets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.belgian_tmc_brackets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    region text NOT NULL,
    cv_min integer NOT NULL,
    cv_max integer NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT belgian_tmc_brackets_region_check CHECK ((region = ANY (ARRAY['bruxelles'::text, 'wallonie'::text, 'flandre'::text])))
);


--
-- Name: car_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    price integer NOT NULL,
    mileage integer NOT NULL,
    fuel_type text NOT NULL,
    transmission text NOT NULL,
    body_type text NOT NULL,
    color text NOT NULL,
    power integer,
    doors integer DEFAULT 5,
    euro_norm text,
    first_registration date,
    description text,
    features text[],
    photos text[] DEFAULT '{}'::text[],
    contact_name text NOT NULL,
    contact_phone text,
    contact_email text NOT NULL,
    location text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ct_valid boolean DEFAULT false,
    maintenance_book_complete boolean DEFAULT false,
    seller_type text DEFAULT 'particulier'::text,
    tva_number text,
    boost_level text DEFAULT 'none'::text,
    boost_expires_at timestamp with time zone,
    boost_warning_sent boolean DEFAULT false,
    search_vector tsvector GENERATED ALWAYS AS (((((((setweight(to_tsvector('french'::regconfig, COALESCE(brand, ''::text)), 'A'::"char") || setweight(to_tsvector('french'::regconfig, COALESCE(model, ''::text)), 'A'::"char")) || setweight(to_tsvector('french'::regconfig, COALESCE(description, ''::text)), 'C'::"char")) || setweight(to_tsvector('french'::regconfig, COALESCE(location, ''::text)), 'B'::"char")) || setweight(to_tsvector('french'::regconfig, COALESCE(color, ''::text)), 'B'::"char")) || setweight(to_tsvector('french'::regconfig, COALESCE(body_type, ''::text)), 'B'::"char")) || setweight(to_tsvector('french'::regconfig, COALESCE(fuel_type, ''::text)), 'B'::"char"))) STORED,
    car_pass_url text,
    car_pass_date date,
    reference_url text,
    latitude double precision,
    longitude double precision,
    car_pass_status text DEFAULT 'unverified'::text NOT NULL,
    car_pass_request_id text,
    car_pass_verified boolean GENERATED ALWAYS AS ((car_pass_status = 'verified'::text)) STORED,
    coordinates public.geography(Point,4326),
    needs_review boolean DEFAULT false NOT NULL,
    fuel_consumption numeric(5,2),
    boost_rank smallint GENERATED ALWAYS AS (
CASE boost_level
    WHEN 'boost_7d'::text THEN 4
    WHEN 'boost_72h'::text THEN 3
    WHEN 'boost_48h'::text THEN 2
    WHEN 'boost_24h'::text THEN 1
    ELSE 0
END) STORED,
    co2 integer,
    co2_cycle text,
    mma integer,
    puissance_cv smallint,
    CONSTRAINT car_listings_co2_chk CHECK (((co2 IS NULL) OR ((co2 >= 0) AND (co2 <= 600)))),
    CONSTRAINT car_listings_co2_cycle_chk CHECK (((co2_cycle IS NULL) OR (co2_cycle = ANY (ARRAY['WLTP'::text, 'NEDC'::text])))),
    CONSTRAINT car_listings_mileage_chk CHECK (((mileage >= 0) AND (mileage <= 999999))),
    CONSTRAINT car_listings_mma_chk CHECK (((mma IS NULL) OR ((mma >= 500) AND (mma <= 7500)))),
    CONSTRAINT car_listings_price_chk CHECK (((price >= 100) AND (price <= 1000000))),
    CONSTRAINT car_listings_puissance_cv_chk CHECK (((puissance_cv IS NULL) OR ((puissance_cv >= 1) AND (puissance_cv <= 70)))),
    CONSTRAINT car_listings_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'pending_review'::text, 'approved'::text, 'sold'::text, 'rejected'::text, 'archived'::text]))),
    CONSTRAINT car_listings_year_chk CHECK (((year >= 1900) AND (year <= ((EXTRACT(year FROM now()))::integer + 1)))),
    CONSTRAINT car_pass_status_chk CHECK ((car_pass_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'verified'::text, 'rejected'::text]))),
    CONSTRAINT car_pass_url_safe CHECK (((car_pass_url IS NULL) OR (car_pass_url ~* '^https://'::text) OR (car_pass_url ~ '^[A-Za-z0-9._/-]+$'::text)))
);


--
-- Name: COLUMN car_listings.ct_valid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.ct_valid IS 'Contrôle Technique valide';


--
-- Name: COLUMN car_listings.maintenance_book_complete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.maintenance_book_complete IS 'Carnet d''entretien complet';


--
-- Name: COLUMN car_listings.seller_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.seller_type IS 'Type de vendeur: particulier ou professionnel';


--
-- Name: COLUMN car_listings.tva_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.tva_number IS 'Numéro de TVA pour les vendeurs professionnels';


--
-- Name: COLUMN car_listings.boost_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.boost_level IS 'Boost tier: none, standard, premium, ultra';


--
-- Name: COLUMN car_listings.boost_expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.boost_expires_at IS 'When the boost expires (null = no active boost)';


--
-- Name: COLUMN car_listings.boost_rank; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.boost_rank IS 'Rang numérique du boost (0 = aucun, 4 = 7 jours). Le tri alphabetique sur boost_level plaçait "none" avant "boost_*" : les annonces gratuites passaient devant les annonces payantes.';


--
-- Name: COLUMN car_listings.co2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.co2 IS 'Emissions CO2 en g/km — carte grise rubrique V.7';


--
-- Name: COLUMN car_listings.co2_cycle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.co2_cycle IS 'Cycle d homologation : WLTP (diviseur 136) ou NEDC (115)';


--
-- Name: COLUMN car_listings.mma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.mma IS 'Masse maximale autorisee en kg — carte grise rubrique F.2';


--
-- Name: COLUMN car_listings.puissance_cv; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.car_listings.puissance_cv IS 'Puissance fiscale en CV — base de la taxe de circulation';


--
-- Name: car_listings_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.car_listings_public WITH (security_invoker='true') AS
 SELECT id,
    user_id,
    brand,
    model,
    year,
    price,
    mileage,
    fuel_type,
    transmission,
    body_type,
    color,
    power,
    doors,
    euro_norm,
    car_pass_verified,
    car_pass_status,
    car_pass_date,
    first_registration,
    description,
    features,
    photos,
    location,
    latitude,
    longitude,
    status,
    created_at,
    updated_at,
    ct_valid,
    maintenance_book_complete,
    seller_type,
    tva_number,
    boost_level,
    boost_expires_at,
    boost_rank,
    reference_url,
    fuel_consumption,
    co2,
    co2_cycle,
    mma,
    puissance_cv
   FROM public.car_listings
  WHERE (status = 'approved'::text);


--
-- Name: VIEW car_listings_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.car_listings_public IS 'NE PAS passer en security_invoker = true. car_listings n a AUCUNE policy SELECT pour anon : cette vue en security definer est la SEULE chose qui rend le catalogue public visible. Teste le 2026-08-06 : avec security_invoker = true, un visiteur anonyme voit 0 annonce, le site se vide. La vue n expose que des colonnes publiques et filtre sur status = approved. Les scanners signalent ce motif generiquement : faux positif ici.';


--
-- Name: car_pass_verification_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_pass_verification_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    requested_by uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    api_response jsonb,
    error_message text,
    CONSTRAINT car_pass_verification_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: car_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    car_listing_id uuid NOT NULL,
    viewer_id uuid,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_hash text
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    ip_address text,
    user_id uuid,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    replied_at timestamp with time zone,
    CONSTRAINT contact_messages_email_check CHECK (((char_length(email) >= 5) AND (char_length(email) <= 255))),
    CONSTRAINT contact_messages_message_check CHECK (((char_length(message) >= 10) AND (char_length(message) <= 2000))),
    CONSTRAINT contact_messages_name_check CHECK (((char_length(name) >= 2) AND (char_length(name) <= 100))),
    CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text, 'spam'::text]))),
    CONSTRAINT contact_messages_subject_check CHECK (((char_length(subject) >= 5) AND (char_length(subject) <= 200)))
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    car_listing_id uuid,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    car_brand text,
    car_model text,
    car_image text,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_message_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_message_counts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message_date date DEFAULT CURRENT_DATE NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dealer_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dealer_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    user_id uuid,
    queue_id uuid,
    actor_id uuid,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dealer_events_event_type_check CHECK ((event_type = ANY (ARRAY['pro_signup'::text, 'dealer_approved'::text, 'dealer_rejected'::text, 'trigger_error'::text])))
);


--
-- Name: dealer_kyc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dealer_kyc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    document_path text,
    submitted_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    reviewer_id uuid,
    reviewer_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bce_number text,
    vat_number text,
    legal_name text,
    address text,
    CONSTRAINT dealer_kyc_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]))),
    CONSTRAINT dealer_kyc_vat_chk CHECK (((vat_number IS NULL) OR (vat_number ~ '^BE0[0-9]{9}$'::text)))
);


--
-- Name: dealer_verification_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dealer_verification_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    admin_notes text,
    garage_name_snapshot text,
    bce_snapshot text,
    CONSTRAINT dealer_verification_queue_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: email_send_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_send_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id text,
    template_name text NOT NULL,
    recipient_email text NOT NULL,
    status text NOT NULL,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_send_log_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'suppressed'::text, 'failed'::text, 'bounced'::text, 'complained'::text, 'dlq'::text])))
);


--
-- Name: email_send_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_send_state (
    id integer DEFAULT 1 NOT NULL,
    retry_after_until timestamp with time zone,
    batch_size integer DEFAULT 10 NOT NULL,
    send_delay_ms integer DEFAULT 200 NOT NULL,
    auth_email_ttl_minutes integer DEFAULT 15 NOT NULL,
    transactional_email_ttl_minutes integer DEFAULT 60 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_send_state_id_check CHECK ((id = 1))
);


--
-- Name: email_unsubscribe_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_unsubscribe_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    car_listing_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fuel_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    diesel numeric(5,3) DEFAULT 1.650 NOT NULL,
    essence95 numeric(5,3) DEFAULT 1.750 NOT NULL,
    essence98 numeric(5,3) DEFAULT 1.850 NOT NULL,
    electric_home numeric(5,3) DEFAULT 0.300 NOT NULL,
    electric_public numeric(5,3) DEFAULT 0.450 NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: listing_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    form_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    photo_urls text[] DEFAULT '{}'::text[],
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text,
    reply_to_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    suspended_at timestamp with time zone,
    suspended_reason text,
    phone text,
    garage_name text,
    postal_code text,
    cover_image_url text,
    opening_hours text,
    services text[] DEFAULT '{}'::text[],
    presentation text,
    vitrine_slug text,
    vitrine_cover_url text,
    vitrine_about text,
    vitrine_services text[] DEFAULT '{}'::text[] NOT NULL,
    vitrine_published boolean DEFAULT false NOT NULL,
    vitrine_phone text,
    vitrine_email_public text,
    user_type text DEFAULT 'particulier'::text NOT NULL,
    bce_number text,
    CONSTRAINT profiles_user_type_check CHECK ((user_type = ANY (ARRAY['particulier'::text, 'professionnel'::text]))),
    CONSTRAINT profiles_vitrine_about_length CHECK (((vitrine_about IS NULL) OR (char_length(vitrine_about) <= 2000))),
    CONSTRAINT profiles_vitrine_services_max CHECK (((array_length(vitrine_services, 1) IS NULL) OR (array_length(vitrine_services, 1) <= 10))),
    CONSTRAINT profiles_vitrine_slug_format CHECK (((vitrine_slug IS NULL) OR (vitrine_slug ~ '^[a-z0-9-]{3,60}$'::text)))
);


--
-- Name: profiles_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.profiles_public WITH (security_invoker='true') AS
 SELECT id,
    user_id,
    display_name,
    avatar_url,
    created_at,
    updated_at
   FROM public.profiles;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    car_listing_id uuid NOT NULL,
    user_id uuid NOT NULL,
    reason text NOT NULL,
    comment text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    car_listing_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: stripe_processed_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_processed_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id text NOT NULL,
    event_type text NOT NULL,
    processed_at timestamp with time zone DEFAULT now() NOT NULL,
    payload_summary jsonb
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    product_id text,
    status text DEFAULT 'inactive'::text NOT NULL,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: suppressed_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppressed_emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    reason text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT suppressed_emails_reason_check CHECK ((reason = ANY (ARRAY['unsubscribe'::text, 'bounce'::text, 'complaint'::text])))
);


--
-- Name: user_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    frequency text DEFAULT 'instant'::text NOT NULL,
    notify_email boolean DEFAULT true NOT NULL,
    notify_push boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    last_sent_at timestamp with time zone,
    match_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_alerts_frequency_check CHECK ((frequency = ANY (ARRAY['instant'::text, 'daily'::text, 'weekly'::text])))
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_notifications_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    push_notifications_enabled boolean DEFAULT true NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: alert_notifications alert_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_notifications
    ADD CONSTRAINT alert_notifications_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: belgian_annual_tax_brackets belgian_annual_tax_brackets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgian_annual_tax_brackets
    ADD CONSTRAINT belgian_annual_tax_brackets_pkey PRIMARY KEY (id);


--
-- Name: belgian_tmc_age_reductions belgian_tmc_age_reductions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgian_tmc_age_reductions
    ADD CONSTRAINT belgian_tmc_age_reductions_pkey PRIMARY KEY (id);


--
-- Name: belgian_tmc_brackets belgian_tmc_brackets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.belgian_tmc_brackets
    ADD CONSTRAINT belgian_tmc_brackets_pkey PRIMARY KEY (id);


--
-- Name: car_listings car_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_listings
    ADD CONSTRAINT car_listings_pkey PRIMARY KEY (id);


--
-- Name: car_pass_verification_requests car_pass_verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_pass_verification_requests
    ADD CONSTRAINT car_pass_verification_requests_pkey PRIMARY KEY (id);


--
-- Name: car_views car_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_views
    ADD CONSTRAINT car_views_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_car_listing_id_buyer_id_seller_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_car_listing_id_buyer_id_seller_id_key UNIQUE (car_listing_id, buyer_id, seller_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: daily_message_counts daily_message_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_message_counts
    ADD CONSTRAINT daily_message_counts_pkey PRIMARY KEY (id);


--
-- Name: daily_message_counts daily_message_counts_user_id_message_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_message_counts
    ADD CONSTRAINT daily_message_counts_user_id_message_date_key UNIQUE (user_id, message_date);


--
-- Name: dealer_events dealer_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_events
    ADD CONSTRAINT dealer_events_pkey PRIMARY KEY (id);


--
-- Name: dealer_kyc dealer_kyc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_kyc
    ADD CONSTRAINT dealer_kyc_pkey PRIMARY KEY (id);


--
-- Name: dealer_kyc dealer_kyc_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_kyc
    ADD CONSTRAINT dealer_kyc_user_id_key UNIQUE (user_id);


--
-- Name: dealer_verification_queue dealer_verification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_verification_queue
    ADD CONSTRAINT dealer_verification_queue_pkey PRIMARY KEY (id);


--
-- Name: dealer_verification_queue dealer_verification_queue_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_verification_queue
    ADD CONSTRAINT dealer_verification_queue_user_id_key UNIQUE (user_id);


--
-- Name: email_send_log email_send_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_send_log
    ADD CONSTRAINT email_send_log_pkey PRIMARY KEY (id);


--
-- Name: email_send_state email_send_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_send_state
    ADD CONSTRAINT email_send_state_pkey PRIMARY KEY (id);


--
-- Name: email_unsubscribe_tokens email_unsubscribe_tokens_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_email_key UNIQUE (email);


--
-- Name: email_unsubscribe_tokens email_unsubscribe_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_unsubscribe_tokens email_unsubscribe_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_unsubscribe_tokens
    ADD CONSTRAINT email_unsubscribe_tokens_token_key UNIQUE (token);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_car_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_car_listing_id_key UNIQUE (user_id, car_listing_id);


--
-- Name: fuel_prices fuel_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_pkey PRIMARY KEY (id);


--
-- Name: listing_drafts listing_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_drafts
    ADD CONSTRAINT listing_drafts_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_car_listing_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_car_listing_id_user_id_key UNIQUE (car_listing_id, user_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: stripe_processed_events stripe_processed_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_processed_events
    ADD CONSTRAINT stripe_processed_events_event_id_key UNIQUE (event_id);


--
-- Name: stripe_processed_events stripe_processed_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_processed_events
    ADD CONSTRAINT stripe_processed_events_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: suppressed_emails suppressed_emails_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppressed_emails
    ADD CONSTRAINT suppressed_emails_email_key UNIQUE (email);


--
-- Name: suppressed_emails suppressed_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppressed_emails
    ADD CONSTRAINT suppressed_emails_pkey PRIMARY KEY (id);


--
-- Name: reports unique_user_listing_report; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT unique_user_listing_report UNIQUE (user_id, car_listing_id);


--
-- Name: user_alerts user_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_alerts
    ADD CONSTRAINT user_alerts_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_admin_actions_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_admin ON public.admin_actions USING btree (admin_id);


--
-- Name: idx_admin_actions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_created ON public.admin_actions USING btree (created_at DESC);


--
-- Name: idx_admin_actions_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_target ON public.admin_actions USING btree (target_type, target_id);


--
-- Name: idx_age_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_age_region ON public.belgian_tmc_age_reductions USING btree (region, age_min_years);


--
-- Name: idx_alert_notifications_alert_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alert_notifications_alert_id ON public.alert_notifications USING btree (alert_id);


--
-- Name: idx_alert_notifications_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alert_notifications_sent_at ON public.alert_notifications USING btree (sent_at DESC);


--
-- Name: idx_annual_region_cv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_annual_region_cv ON public.belgian_annual_tax_brackets USING btree (region, cv_min, cv_max);


--
-- Name: idx_audit_log_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created ON public.audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_log_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_user ON public.audit_log USING btree (user_id);


--
-- Name: idx_car_listings_active_boost; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_active_boost ON public.car_listings USING btree (boost_level, boost_expires_at) WHERE ((status = 'approved'::text) AND (boost_level <> 'none'::text));


--
-- Name: idx_car_listings_approved_mileage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_approved_mileage ON public.car_listings USING btree (boost_rank DESC, mileage, id) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_approved_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_approved_price ON public.car_listings USING btree (boost_rank DESC, price, id) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_approved_recent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_approved_recent ON public.car_listings USING btree (boost_rank DESC, created_at DESC, id) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_approved_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_approved_year ON public.car_listings USING btree (boost_rank DESC, year DESC, id) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_body_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_body_type ON public.car_listings USING btree (body_type) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_brand ON public.car_listings USING btree (brand);


--
-- Name: idx_car_listings_brand_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_brand_trgm ON public.car_listings USING gin (brand public.gin_trgm_ops);


--
-- Name: idx_car_listings_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_coordinates ON public.car_listings USING gist (coordinates);


--
-- Name: idx_car_listings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_created_at ON public.car_listings USING btree (created_at DESC);


--
-- Name: idx_car_listings_euro_norm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_euro_norm ON public.car_listings USING btree (euro_norm) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_features; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_features ON public.car_listings USING gin (features) WHERE (features IS NOT NULL);


--
-- Name: idx_car_listings_fuel_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_fuel_type ON public.car_listings USING btree (fuel_type);


--
-- Name: idx_car_listings_geo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_geo ON public.car_listings USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: idx_car_listings_location_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_location_trgm ON public.car_listings USING gin (location public.gin_trgm_ops) WHERE (location IS NOT NULL);


--
-- Name: idx_car_listings_mileage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_mileage ON public.car_listings USING btree (mileage) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_model_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_model_trgm ON public.car_listings USING gin (model public.gin_trgm_ops);


--
-- Name: idx_car_listings_needs_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_needs_review ON public.car_listings USING btree (needs_review) WHERE (needs_review = true);


--
-- Name: idx_car_listings_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_price ON public.car_listings USING btree (price);


--
-- Name: idx_car_listings_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_search ON public.car_listings USING gin (search_vector);


--
-- Name: idx_car_listings_seller_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_seller_type ON public.car_listings USING btree (seller_type) WHERE (status = 'approved'::text);


--
-- Name: idx_car_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_status ON public.car_listings USING btree (status);


--
-- Name: idx_car_listings_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_user_created ON public.car_listings USING btree (user_id, created_at DESC);


--
-- Name: idx_car_listings_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_listings_year ON public.car_listings USING btree (year);


--
-- Name: idx_car_views_ip_listing_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_views_ip_listing_time ON public.car_views USING btree (car_listing_id, ip_hash, viewed_at DESC) WHERE (ip_hash IS NOT NULL);


--
-- Name: idx_car_views_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_views_listing ON public.car_views USING btree (car_listing_id);


--
-- Name: idx_car_views_viewer_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_car_views_viewer_viewed_at ON public.car_views USING btree (viewer_id, viewed_at DESC) WHERE (viewer_id IS NOT NULL);


--
-- Name: idx_contact_messages_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_status_created ON public.contact_messages USING btree (status, created_at DESC);


--
-- Name: idx_conversations_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_buyer_id ON public.conversations USING btree (buyer_id);


--
-- Name: idx_conversations_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_seller_id ON public.conversations USING btree (seller_id);


--
-- Name: idx_cpvr_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cpvr_listing_id ON public.car_pass_verification_requests USING btree (listing_id);


--
-- Name: idx_cpvr_requested_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cpvr_requested_at ON public.car_pass_verification_requests USING btree (requested_at DESC);


--
-- Name: idx_cpvr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cpvr_status ON public.car_pass_verification_requests USING btree (status);


--
-- Name: idx_dealer_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dealer_events_created_at ON public.dealer_events USING btree (created_at DESC);


--
-- Name: idx_dealer_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dealer_events_type ON public.dealer_events USING btree (event_type);


--
-- Name: idx_dealer_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dealer_events_user ON public.dealer_events USING btree (user_id);


--
-- Name: idx_dvq_status_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dvq_status_submitted ON public.dealer_verification_queue USING btree (status, submitted_at DESC);


--
-- Name: idx_dvq_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dvq_user ON public.dealer_verification_queue USING btree (user_id);


--
-- Name: idx_email_send_log_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_send_log_created ON public.email_send_log USING btree (created_at DESC);


--
-- Name: idx_email_send_log_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_send_log_message ON public.email_send_log USING btree (message_id);


--
-- Name: idx_email_send_log_message_sent_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_email_send_log_message_sent_unique ON public.email_send_log USING btree (message_id) WHERE (status = 'sent'::text);


--
-- Name: idx_email_send_log_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_send_log_recipient ON public.email_send_log USING btree (recipient_email);


--
-- Name: idx_favorites_listing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_listing ON public.favorites USING btree (car_listing_id);


--
-- Name: idx_favorites_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_reply_to_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_reply_to_id ON public.messages USING btree (reply_to_id);


--
-- Name: idx_profiles_phone_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_profiles_phone_unique ON public.profiles USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: idx_profiles_vitrine_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_vitrine_published ON public.profiles USING btree (vitrine_published) WHERE (vitrine_published = true);


--
-- Name: idx_rate_limits_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_expires ON public.rate_limits USING btree (expires_at);


--
-- Name: idx_rate_limits_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_key ON public.rate_limits USING btree (key);


--
-- Name: idx_reports_car_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_car_listing_id ON public.reports USING btree (car_listing_id);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status);


--
-- Name: idx_stripe_processed_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_processed_events_type ON public.stripe_processed_events USING btree (event_type);


--
-- Name: idx_subscriptions_stripe_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_subscriptions_stripe_customer ON public.subscriptions USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);


--
-- Name: idx_suppressed_emails_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppressed_emails_email ON public.suppressed_emails USING btree (email);


--
-- Name: idx_tmc_region_cv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tmc_region_cv ON public.belgian_tmc_brackets USING btree (region, cv_min, cv_max);


--
-- Name: idx_unsubscribe_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens USING btree (token);


--
-- Name: idx_user_alerts_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_alerts_active ON public.user_alerts USING btree (active) WHERE (active = true);


--
-- Name: idx_user_alerts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_alerts_user_id ON public.user_alerts USING btree (user_id);


--
-- Name: listing_drafts_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX listing_drafts_user_id_idx ON public.listing_drafts USING btree (user_id);


--
-- Name: profiles_phone_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_phone_unique ON public.profiles USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: profiles_vitrine_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_vitrine_slug_unique ON public.profiles USING btree (lower(vitrine_slug)) WHERE (vitrine_slug IS NOT NULL);


--
-- Name: car_listings car_listings_lock_approved; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_listings_lock_approved BEFORE UPDATE ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.guard_sensitive_listing_updates();


--
-- Name: car_listings car_listings_notify_alerts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_listings_notify_alerts AFTER UPDATE OF status ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.notify_alerts_on_approval();


--
-- Name: car_listings car_listings_prevent_status_self_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_listings_prevent_status_self_change BEFORE UPDATE ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.prevent_status_self_change();


--
-- Name: car_listings car_listings_set_coordinates; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_listings_set_coordinates BEFORE INSERT OR UPDATE OF latitude, longitude ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.set_listing_coordinates();


--
-- Name: car_listings car_listings_xss_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_listings_xss_guard BEFORE INSERT OR UPDATE ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.reject_html_payload();


--
-- Name: profiles profiles_normalize_vitrine_slug; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_normalize_vitrine_slug BEFORE INSERT OR UPDATE OF vitrine_slug, vitrine_published ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.normalize_vitrine_slug();


--
-- Name: belgian_tmc_age_reductions trg_age_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_age_updated BEFORE UPDATE ON public.belgian_tmc_age_reductions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: belgian_annual_tax_brackets trg_annual_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_annual_updated BEFORE UPDATE ON public.belgian_annual_tax_brackets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: car_views trg_car_views_rate_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_car_views_rate_limit BEFORE INSERT ON public.car_views FOR EACH ROW EXECUTE FUNCTION public.enforce_car_view_rate_limit();


--
-- Name: car_listings trg_enforce_pro_car_pass; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_pro_car_pass BEFORE INSERT OR UPDATE OF seller_type, car_pass_url, status ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.enforce_pro_car_pass();


--
-- Name: profiles trg_ensure_vitrine_slug; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ensure_vitrine_slug BEFORE INSERT OR UPDATE OF garage_name, display_name, vitrine_slug ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_vitrine_slug();


--
-- Name: profiles trg_protect_privileged_profile_columns; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_privileged_profile_columns BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_profile_columns();


--
-- Name: belgian_tmc_brackets trg_tmc_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tmc_updated BEFORE UPDATE ON public.belgian_tmc_brackets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: car_listings update_car_listings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_car_listings_updated_at BEFORE UPDATE ON public.car_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: listing_drafts update_listing_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_listing_drafts_updated_at BEFORE UPDATE ON public.listing_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: push_subscriptions update_push_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reports update_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_alerts update_user_alerts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_alerts_updated_at BEFORE UPDATE ON public.user_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alert_notifications alert_notifications_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_notifications
    ADD CONSTRAINT alert_notifications_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.user_alerts(id) ON DELETE CASCADE;


--
-- Name: alert_notifications alert_notifications_car_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_notifications
    ADD CONSTRAINT alert_notifications_car_listing_id_fkey FOREIGN KEY (car_listing_id) REFERENCES public.car_listings(id) ON DELETE CASCADE;


--
-- Name: car_listings car_listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_listings
    ADD CONSTRAINT car_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: car_pass_verification_requests car_pass_verification_requests_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_pass_verification_requests
    ADD CONSTRAINT car_pass_verification_requests_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.car_listings(id) ON DELETE CASCADE;


--
-- Name: car_pass_verification_requests car_pass_verification_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_pass_verification_requests
    ADD CONSTRAINT car_pass_verification_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: car_views car_views_car_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_views
    ADD CONSTRAINT car_views_car_listing_id_fkey FOREIGN KEY (car_listing_id) REFERENCES public.car_listings(id) ON DELETE CASCADE;


--
-- Name: car_views car_views_viewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_views
    ADD CONSTRAINT car_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: contact_messages contact_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_car_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_car_listing_id_fkey FOREIGN KEY (car_listing_id) REFERENCES public.car_listings(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: dealer_kyc dealer_kyc_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_kyc
    ADD CONSTRAINT dealer_kyc_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: dealer_kyc dealer_kyc_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_kyc
    ADD CONSTRAINT dealer_kyc_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: dealer_verification_queue dealer_verification_queue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dealer_verification_queue
    ADD CONSTRAINT dealer_verification_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_car_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_car_listing_id_fkey FOREIGN KEY (car_listing_id) REFERENCES public.car_listings(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_car_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_car_listing_id_fkey FOREIGN KEY (car_listing_id) REFERENCES public.car_listings(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_car_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_car_listing_id_fkey FOREIGN KEY (car_listing_id) REFERENCES public.car_listings(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: dealer_verification_queue Admin can update queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update queue" ON public.dealer_verification_queue FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_tmc_brackets Admins can delete TMC brackets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete TMC brackets" ON public.belgian_tmc_brackets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_tmc_age_reductions Admins can delete age reductions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete age reductions" ON public.belgian_tmc_age_reductions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_annual_tax_brackets Admins can delete annual tax; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete annual tax" ON public.belgian_annual_tax_brackets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: car_listings Admins can delete any listing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any listing" ON public.car_listings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: conversations Admins can delete conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete conversations" ON public.conversations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can delete messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reports Admins can delete reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete reports" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_tmc_brackets Admins can insert TMC brackets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert TMC brackets" ON public.belgian_tmc_brackets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_actions Admins can insert admin actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (auth.uid() = admin_id)));


--
-- Name: belgian_tmc_age_reductions Admins can insert age reductions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert age reductions" ON public.belgian_tmc_age_reductions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_annual_tax_brackets Admins can insert annual tax; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert annual tax" ON public.belgian_annual_tax_brackets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fuel_prices Admins can insert fuel prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert fuel prices" ON public.fuel_prices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can insert subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_tmc_brackets Admins can update TMC brackets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update TMC brackets" ON public.belgian_tmc_brackets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_tmc_age_reductions Admins can update age reductions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update age reductions" ON public.belgian_tmc_age_reductions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: belgian_annual_tax_brackets Admins can update annual tax; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update annual tax" ON public.belgian_annual_tax_brackets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: car_listings Admins can update any listing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any listing" ON public.car_listings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: fuel_prices Admins can update fuel prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update fuel prices" ON public.fuel_prices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reports Admins can update reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can update subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_actions Admins can view all admin actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all admin actions" ON public.admin_actions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_log Admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all audit logs" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: conversations Admins can view all conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: car_listings Admins can view all listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all listings" ON public.car_listings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reports Admins can view all reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: stripe_processed_events Admins can view stripe webhook events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view stripe webhook events" ON public.stripe_processed_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: dealer_events Admins insert dealer events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins insert dealer events" ON public.dealer_events FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (actor_id = auth.uid())));


--
-- Name: dealer_kyc Admins read all KYC; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all KYC" ON public.dealer_kyc FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: dealer_events Admins read dealer events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read dealer events" ON public.dealer_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: dealer_kyc Admins update any KYC; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update any KYC" ON public.dealer_kyc FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: car_views Anyone can insert views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert views" ON public.car_views FOR INSERT WITH CHECK (true);


--
-- Name: belgian_tmc_brackets Anyone can view TMC brackets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view TMC brackets" ON public.belgian_tmc_brackets FOR SELECT USING (true);


--
-- Name: belgian_tmc_age_reductions Anyone can view age reductions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view age reductions" ON public.belgian_tmc_age_reductions FOR SELECT USING (true);


--
-- Name: belgian_annual_tax_brackets Anyone can view annual tax brackets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view annual tax brackets" ON public.belgian_annual_tax_brackets FOR SELECT USING (true);


--
-- Name: fuel_prices Anyone can view fuel prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view fuel prices" ON public.fuel_prices FOR SELECT USING (true);


--
-- Name: reviews Anyone can view reviews on approved listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reviews on approved listings" ON public.reviews FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.car_listings
  WHERE ((car_listings.id = reviews.car_listing_id) AND (car_listings.status = 'approved'::text)))));


--
-- Name: conversations Authenticated users can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: reports Authenticated users can create reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: dealer_kyc Dealer inserts own KYC; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dealer inserts own KYC" ON public.dealer_kyc FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: dealer_kyc Dealer reads own KYC; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dealer reads own KYC" ON public.dealer_kyc FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dealer_kyc Dealer updates own pending KYC; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Dealer updates own pending KYC" ON public.dealer_kyc FOR UPDATE USING (((auth.uid() = user_id) AND (status = 'pending'::text)));


--
-- Name: dealer_verification_queue Owner or admin can view queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner or admin can view queue" ON public.dealer_verification_queue FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: car_pass_verification_requests Owners can view their own car-pass requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view their own car-pass requests" ON public.car_pass_verification_requests FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.car_listings cl
  WHERE ((cl.id = car_pass_verification_requests.listing_id) AND (cl.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: car_listings Owners can view their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view their own listings" ON public.car_listings FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: car_listings Public can read approved listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read approved listings" ON public.car_listings FOR SELECT TO anon, authenticated USING ((status = 'approved'::text));


--
-- Name: favorites Sellers can view favorites on their listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view favorites on their listings" ON public.favorites FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.car_listings
  WHERE ((car_listings.id = favorites.car_listing_id) AND (car_listings.user_id = auth.uid())))));


--
-- Name: car_views Sellers can view their listing views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers can view their listing views" ON public.car_views FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.car_listings
  WHERE ((car_listings.id = car_views.car_listing_id) AND (car_listings.user_id = auth.uid())))));


--
-- Name: email_send_log Service role can insert send log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert send log" ON public.email_send_log FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: suppressed_emails Service role can insert suppressed emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert suppressed emails" ON public.suppressed_emails FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: email_unsubscribe_tokens Service role can insert tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: email_send_state Service role can manage send state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage send state" ON public.email_send_state USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: email_unsubscribe_tokens Service role can mark tokens as used; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens FOR UPDATE USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: email_send_log Service role can read send log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can read send log" ON public.email_send_log FOR SELECT USING ((auth.role() = 'service_role'::text));


--
-- Name: suppressed_emails Service role can read suppressed emails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can read suppressed emails" ON public.suppressed_emails FOR SELECT USING ((auth.role() = 'service_role'::text));


--
-- Name: email_unsubscribe_tokens Service role can read tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens FOR SELECT USING ((auth.role() = 'service_role'::text));


--
-- Name: email_send_log Service role can update send log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can update send log" ON public.email_send_log FOR UPDATE USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: rate_limits Service role only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role only" ON public.rate_limits USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: alert_notifications Service role only delete alert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role only delete alert notifications" ON public.alert_notifications FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: alert_notifications Service role only insert alert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role only insert alert notifications" ON public.alert_notifications FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: dealer_verification_queue User can submit own request; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can submit own request" ON public.dealer_verification_queue FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorites Users can add favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (NOT (EXISTS ( SELECT 1
   FROM public.car_listings
  WHERE ((car_listings.id = reviews.car_listing_id) AND (car_listings.user_id = auth.uid())))))));


--
-- Name: user_alerts Users can create their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own alerts" ON public.user_alerts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can create their own push subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own push subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_alerts Users can delete their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own alerts" ON public.user_alerts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: car_views Users can delete their own car views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own car views" ON public.car_views FOR DELETE TO authenticated USING ((viewer_id = auth.uid()));


--
-- Name: listing_drafts Users can delete their own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own drafts" ON public.listing_drafts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: car_listings Users can delete their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own listings" ON public.car_listings FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can delete their own push subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: daily_message_counts Users can insert own message counts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own message counts" ON public.daily_message_counts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: listing_drafts Users can insert their own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own drafts" ON public.listing_drafts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: alert_notifications Users can mark their alert notifications opened/clicked; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can mark their alert notifications opened/clicked" ON public.alert_notifications FOR UPDATE TO authenticated USING ((alert_id IN ( SELECT user_alerts.id
   FROM public.user_alerts
  WHERE (user_alerts.user_id = auth.uid())))) WITH CHECK ((alert_id IN ( SELECT user_alerts.id
   FROM public.user_alerts
  WHERE (user_alerts.user_id = auth.uid()))));


--
-- Name: favorites Users can remove their favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove their favorites" ON public.favorites FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: messages Users can send messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid())))))));


--
-- Name: messages Users can update messages they received; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update messages they received" ON public.messages FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid()))))));


--
-- Name: daily_message_counts Users can update own message counts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own message counts" ON public.daily_message_counts FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_alerts Users can update their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own alerts" ON public.user_alerts FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE TO authenticated USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: listing_drafts Users can update their own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own drafts" ON public.listing_drafts FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: car_listings Users can update their own listings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own listings" ON public.car_listings FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can update their own push subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR (c.seller_id = auth.uid()))))));


--
-- Name: daily_message_counts Users can view own message counts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own message counts" ON public.daily_message_counts FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: alert_notifications Users can view their own alert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alert notifications" ON public.alert_notifications FOR SELECT TO authenticated USING ((alert_id IN ( SELECT user_alerts.id
   FROM public.user_alerts
  WHERE (user_alerts.user_id = auth.uid()))));


--
-- Name: user_alerts Users can view their own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own alerts" ON public.user_alerts FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: audit_log Users can view their own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own audit logs" ON public.audit_log FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: car_views Users can view their own car views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own car views" ON public.car_views FOR SELECT TO authenticated USING ((viewer_id = auth.uid()));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT TO authenticated USING (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));


--
-- Name: listing_drafts Users can view their own drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own drafts" ON public.listing_drafts FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can view their own push subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: reports Users can view their own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: admin_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages admins_read_contact_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_read_contact_messages ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: alert_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: belgian_annual_tax_brackets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.belgian_annual_tax_brackets ENABLE ROW LEVEL SECURITY;

--
-- Name: belgian_tmc_age_reductions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.belgian_tmc_age_reductions ENABLE ROW LEVEL SECURITY;

--
-- Name: belgian_tmc_brackets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.belgian_tmc_brackets ENABLE ROW LEVEL SECURITY;

--
-- Name: car_listings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;

--
-- Name: car_pass_verification_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.car_pass_verification_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: car_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.car_views ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_message_counts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

--
-- Name: dealer_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dealer_events ENABLE ROW LEVEL SECURITY;

--
-- Name: dealer_kyc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dealer_kyc ENABLE ROW LEVEL SECURITY;

--
-- Name: dealer_verification_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dealer_verification_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: email_send_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

--
-- Name: email_send_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

--
-- Name: email_unsubscribe_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: fuel_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: stripe_processed_events service_role only stripe events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service_role only stripe events" ON public.stripe_processed_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: stripe_processed_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: suppressed_emails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

--
-- Name: user_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT USAGE ON SCHEMA public TO sandbox_exec;


--
-- Name: FUNCTION admin_get_listing_contacts(_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.admin_get_listing_contacts(_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.admin_get_listing_contacts(_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.admin_get_listing_contacts(_ids uuid[]) TO service_role;
GRANT ALL ON FUNCTION public.admin_get_listing_contacts(_ids uuid[]) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION admin_get_user_contact(_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.admin_get_user_contact(_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.admin_get_user_contact(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_get_user_contact(_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.admin_get_user_contact(_user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION admin_get_user_emails(_user_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_get_user_emails(_user_ids uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_get_user_emails(_user_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.admin_get_user_emails(_user_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.admin_get_user_emails(_user_ids uuid[]) TO service_role;
GRANT ALL ON FUNCTION public.admin_get_user_emails(_user_ids uuid[]) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION admin_list_listings_with_contacts(_limit integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO anon;
GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO service_role;
GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION admin_review_car_pass(_listing_id uuid, _decision text, _note text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_review_car_pass(_listing_id uuid, _decision text, _note text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_review_car_pass(_listing_id uuid, _decision text, _note text) TO anon;
GRANT ALL ON FUNCTION public.admin_review_car_pass(_listing_id uuid, _decision text, _note text) TO authenticated;
GRANT ALL ON FUNCTION public.admin_review_car_pass(_listing_id uuid, _decision text, _note text) TO service_role;
GRANT ALL ON FUNCTION public.admin_review_car_pass(_listing_id uuid, _decision text, _note text) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION check_rate_limit(_key text, _max_attempts integer, _window_seconds integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_rate_limit(_key text, _max_attempts integer, _window_seconds integer) TO service_role;
GRANT ALL ON FUNCTION public.check_rate_limit(_key text, _max_attempts integer, _window_seconds integer) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION clear_user_view_history(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.clear_user_view_history() FROM PUBLIC;
GRANT ALL ON FUNCTION public.clear_user_view_history() TO authenticated;
GRANT ALL ON FUNCTION public.clear_user_view_history() TO service_role;
GRANT ALL ON FUNCTION public.clear_user_view_history() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION delete_email(queue_name text, message_id bigint); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_email(queue_name text, message_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_email(queue_name text, message_id bigint) TO service_role;
GRANT ALL ON FUNCTION public.delete_email(queue_name text, message_id bigint) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION email_queue_dispatch(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC;
GRANT ALL ON FUNCTION public.email_queue_dispatch() TO anon;
GRANT ALL ON FUNCTION public.email_queue_dispatch() TO authenticated;
GRANT ALL ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT ALL ON FUNCTION public.email_queue_dispatch() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION email_queue_wake(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC;
GRANT ALL ON FUNCTION public.email_queue_wake() TO anon;
GRANT ALL ON FUNCTION public.email_queue_wake() TO authenticated;
GRANT ALL ON FUNCTION public.email_queue_wake() TO service_role;
GRANT ALL ON FUNCTION public.email_queue_wake() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION enforce_car_view_rate_limit(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.enforce_car_view_rate_limit() TO anon;
GRANT ALL ON FUNCTION public.enforce_car_view_rate_limit() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_car_view_rate_limit() TO service_role;
GRANT ALL ON FUNCTION public.enforce_car_view_rate_limit() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION enforce_pro_car_pass(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.enforce_pro_car_pass() TO anon;
GRANT ALL ON FUNCTION public.enforce_pro_car_pass() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_pro_car_pass() TO service_role;
GRANT ALL ON FUNCTION public.enforce_pro_car_pass() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION enqueue_email(queue_name text, payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.enqueue_email(queue_name text, payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.enqueue_email(queue_name text, payload jsonb) TO service_role;
GRANT ALL ON FUNCTION public.enqueue_email(queue_name text, payload jsonb) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION ensure_vitrine_slug(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.ensure_vitrine_slug() TO anon;
GRANT ALL ON FUNCTION public.ensure_vitrine_slug() TO authenticated;
GRANT ALL ON FUNCTION public.ensure_vitrine_slug() TO service_role;
GRANT ALL ON FUNCTION public.ensure_vitrine_slug() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION generate_unique_vitrine_slug(_desired text, _user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.generate_unique_vitrine_slug(_desired text, _user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.generate_unique_vitrine_slug(_desired text, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.generate_unique_vitrine_slug(_desired text, _user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.generate_unique_vitrine_slug(_desired text, _user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_active_cities_count(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_active_cities_count() TO anon;
GRANT ALL ON FUNCTION public.get_active_cities_count() TO authenticated;
GRANT ALL ON FUNCTION public.get_active_cities_count() TO service_role;
GRANT ALL ON FUNCTION public.get_active_cities_count() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_favorite_counts(listing_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_favorite_counts(listing_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.get_favorite_counts(listing_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_favorite_counts(listing_ids uuid[]) TO service_role;
GRANT ALL ON FUNCTION public.get_favorite_counts(listing_ids uuid[]) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_listing_for_buyer(_listing_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_listing_for_buyer(_listing_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_listing_for_buyer(_listing_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.get_listing_for_buyer(_listing_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_listing_popularity(listing_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_listing_popularity(listing_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.get_listing_popularity(listing_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_listing_popularity(listing_ids uuid[]) TO service_role;
GRANT ALL ON FUNCTION public.get_listing_popularity(listing_ids uuid[]) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_public_listing(_listing_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_public_listing(_listing_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_public_listing(_listing_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_public_listing(_listing_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.get_public_listing(_listing_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_public_seller_identity(_user_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_public_seller_identity(_user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_public_seller_identity(_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_public_seller_identity(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_public_seller_identity(_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.get_public_seller_identity(_user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_public_vitrine(_slug_or_user text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_public_vitrine(_slug_or_user text) TO anon;
GRANT ALL ON FUNCTION public.get_public_vitrine(_slug_or_user text) TO authenticated;
GRANT ALL ON FUNCTION public.get_public_vitrine(_slug_or_user text) TO service_role;
GRANT ALL ON FUNCTION public.get_public_vitrine(_slug_or_user text) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_reviewers_profiles(_user_ids uuid[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_reviewers_profiles(_user_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.get_reviewers_profiles(_user_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_reviewers_profiles(_user_ids uuid[]) TO service_role;
GRANT ALL ON FUNCTION public.get_reviewers_profiles(_user_ids uuid[]) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_seller_contact(listing_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_seller_contact(listing_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_seller_contact(listing_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_seller_contact(listing_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.get_seller_contact(listing_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_seller_display(listing_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_seller_display(listing_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_seller_display(listing_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_seller_display(listing_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.get_seller_display(listing_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_seller_public_listings(_seller_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_seller_public_listings(_seller_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_seller_public_listings(_seller_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_seller_public_listings(_seller_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.get_seller_public_listings(_seller_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_unread_message_count(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_unread_message_count() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_unread_message_count() TO authenticated;
GRANT ALL ON FUNCTION public.get_unread_message_count() TO service_role;
GRANT ALL ON FUNCTION public.get_unread_message_count() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION get_user_view_history(_limit integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_user_view_history(_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_user_view_history(_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_view_history(_limit integer) TO service_role;
GRANT ALL ON FUNCTION public.get_user_view_history(_limit integer) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION guard_sensitive_listing_updates(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.guard_sensitive_listing_updates() TO anon;
GRANT ALL ON FUNCTION public.guard_sensitive_listing_updates() TO authenticated;
GRANT ALL ON FUNCTION public.guard_sensitive_listing_updates() TO service_role;
GRANT ALL ON FUNCTION public.guard_sensitive_listing_updates() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION handle_new_user_preferences(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user_preferences() TO service_role;
GRANT ALL ON FUNCTION public.handle_new_user_preferences() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION handle_new_user_profile(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user_profile() TO service_role;
GRANT ALL ON FUNCTION public.handle_new_user_profile() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION has_conversation_with_listing(_listing_id uuid, _user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.has_conversation_with_listing(_listing_id uuid, _user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.has_conversation_with_listing(_listing_id uuid, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.has_conversation_with_listing(_listing_id uuid, _user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.has_conversation_with_listing(_listing_id uuid, _user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION has_role(_user_id uuid, _role public.app_role); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO anon;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION is_admin_user(_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_admin_user(_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_admin_user(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_user(_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.is_admin_user(_user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION is_user_suspended(_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_user_suspended(_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_user_suspended(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_user_suspended(_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.is_user_suspended(_user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION is_vitrine_eligible(_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_vitrine_eligible(_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_vitrine_eligible(_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_vitrine_eligible(_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.is_vitrine_eligible(_user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION is_vitrine_slug_available(_slug text, _user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_vitrine_slug_available(_slug text, _user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_vitrine_slug_available(_slug text, _user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_vitrine_slug_available(_slug text, _user_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.is_vitrine_slug_available(_slug text, _user_id uuid) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION listings_within_radius(user_lat double precision, user_lng double precision, radius_km double precision); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.listings_within_radius(user_lat double precision, user_lng double precision, radius_km double precision) TO anon;
GRANT ALL ON FUNCTION public.listings_within_radius(user_lat double precision, user_lng double precision, radius_km double precision) TO authenticated;
GRANT ALL ON FUNCTION public.listings_within_radius(user_lat double precision, user_lng double precision, radius_km double precision) TO service_role;
GRANT ALL ON FUNCTION public.listings_within_radius(user_lat double precision, user_lng double precision, radius_km double precision) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) TO service_role;
GRANT ALL ON FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION normalize_vitrine_slug(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.normalize_vitrine_slug() TO anon;
GRANT ALL ON FUNCTION public.normalize_vitrine_slug() TO authenticated;
GRANT ALL ON FUNCTION public.normalize_vitrine_slug() TO service_role;
GRANT ALL ON FUNCTION public.normalize_vitrine_slug() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION notify_alerts_on_approval(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.notify_alerts_on_approval() TO anon;
GRANT ALL ON FUNCTION public.notify_alerts_on_approval() TO authenticated;
GRANT ALL ON FUNCTION public.notify_alerts_on_approval() TO service_role;
GRANT ALL ON FUNCTION public.notify_alerts_on_approval() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION prevent_status_self_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.prevent_status_self_change() TO anon;
GRANT ALL ON FUNCTION public.prevent_status_self_change() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_status_self_change() TO service_role;
GRANT ALL ON FUNCTION public.prevent_status_self_change() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION protect_privileged_profile_columns(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.protect_privileged_profile_columns() TO anon;
GRANT ALL ON FUNCTION public.protect_privileged_profile_columns() TO authenticated;
GRANT ALL ON FUNCTION public.protect_privileged_profile_columns() TO service_role;
GRANT ALL ON FUNCTION public.protect_privileged_profile_columns() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION read_email_batch(queue_name text, batch_size integer, vt integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) TO service_role;
GRANT ALL ON FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION reject_html_payload(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.reject_html_payload() TO anon;
GRANT ALL ON FUNCTION public.reject_html_payload() TO authenticated;
GRANT ALL ON FUNCTION public.reject_html_payload() TO service_role;
GRANT ALL ON FUNCTION public.reject_html_payload() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION search_public_vitrines(_q text, _city text, _limit integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.search_public_vitrines(_q text, _city text, _limit integer) TO anon;
GRANT ALL ON FUNCTION public.search_public_vitrines(_q text, _city text, _limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.search_public_vitrines(_q text, _city text, _limit integer) TO service_role;
GRANT ALL ON FUNCTION public.search_public_vitrines(_q text, _city text, _limit integer) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION set_listing_coordinates(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_listing_coordinates() TO anon;
GRANT ALL ON FUNCTION public.set_listing_coordinates() TO authenticated;
GRANT ALL ON FUNCTION public.set_listing_coordinates() TO service_role;
GRANT ALL ON FUNCTION public.set_listing_coordinates() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION slugify_garage_name(_input text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.slugify_garage_name(_input text) TO anon;
GRANT ALL ON FUNCTION public.slugify_garage_name(_input text) TO authenticated;
GRANT ALL ON FUNCTION public.slugify_garage_name(_input text) TO service_role;
GRANT ALL ON FUNCTION public.slugify_garage_name(_input text) TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: TABLE admin_actions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.admin_actions TO anon;
GRANT ALL ON TABLE public.admin_actions TO authenticated;
GRANT ALL ON TABLE public.admin_actions TO service_role;
GRANT SELECT,INSERT ON TABLE public.admin_actions TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.admin_actions TO sandbox_exec;


--
-- Name: TABLE alert_notifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.alert_notifications TO anon;
GRANT ALL ON TABLE public.alert_notifications TO authenticated;
GRANT ALL ON TABLE public.alert_notifications TO service_role;
GRANT SELECT,INSERT ON TABLE public.alert_notifications TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.alert_notifications TO sandbox_exec;


--
-- Name: TABLE audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.audit_log TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.audit_log TO authenticated;
GRANT ALL ON TABLE public.audit_log TO service_role;
GRANT SELECT,INSERT ON TABLE public.audit_log TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.audit_log TO sandbox_exec;


--
-- Name: TABLE belgian_annual_tax_brackets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.belgian_annual_tax_brackets TO anon;
GRANT ALL ON TABLE public.belgian_annual_tax_brackets TO authenticated;
GRANT ALL ON TABLE public.belgian_annual_tax_brackets TO service_role;
GRANT SELECT,INSERT ON TABLE public.belgian_annual_tax_brackets TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.belgian_annual_tax_brackets TO sandbox_exec;


--
-- Name: TABLE belgian_tmc_age_reductions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.belgian_tmc_age_reductions TO anon;
GRANT ALL ON TABLE public.belgian_tmc_age_reductions TO authenticated;
GRANT ALL ON TABLE public.belgian_tmc_age_reductions TO service_role;
GRANT SELECT,INSERT ON TABLE public.belgian_tmc_age_reductions TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.belgian_tmc_age_reductions TO sandbox_exec;


--
-- Name: TABLE belgian_tmc_brackets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.belgian_tmc_brackets TO anon;
GRANT ALL ON TABLE public.belgian_tmc_brackets TO authenticated;
GRANT ALL ON TABLE public.belgian_tmc_brackets TO service_role;
GRANT SELECT,INSERT ON TABLE public.belgian_tmc_brackets TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.belgian_tmc_brackets TO sandbox_exec;


--
-- Name: TABLE car_listings; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,MAINTAIN ON TABLE public.car_listings TO anon;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.car_listings TO authenticated;
GRANT ALL ON TABLE public.car_listings TO service_role;
GRANT SELECT,INSERT ON TABLE public.car_listings TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.car_listings TO sandbox_exec;


--
-- Name: COLUMN car_listings.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(id) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.user_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(user_id) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(user_id) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.brand; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(brand),UPDATE(brand) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(brand) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.model; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(model),UPDATE(model) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(model) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.year; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(year),UPDATE(year) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(year) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.price; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(price),UPDATE(price) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(price) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.mileage; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(mileage),UPDATE(mileage) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(mileage) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.fuel_type; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(fuel_type),UPDATE(fuel_type) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(fuel_type) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.transmission; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(transmission),UPDATE(transmission) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(transmission) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.body_type; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(body_type),UPDATE(body_type) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(body_type) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.color; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(color),UPDATE(color) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(color) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.power; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(power),UPDATE(power) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(power) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.doors; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(doors),UPDATE(doors) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(doors) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.euro_norm; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(euro_norm),UPDATE(euro_norm) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(euro_norm) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.first_registration; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(first_registration),UPDATE(first_registration) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(first_registration) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.description; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(description),UPDATE(description) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(description) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.features; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(features),UPDATE(features) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(features) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.photos; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(photos),UPDATE(photos) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(photos) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.contact_name; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(contact_name) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.contact_phone; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(contact_phone) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.contact_email; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(contact_email) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.location; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(location),UPDATE(location) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(location) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.status; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(status),UPDATE(status) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(status) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.created_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(created_at) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(created_at) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(updated_at),UPDATE(updated_at) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(updated_at) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.ct_valid; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ct_valid),UPDATE(ct_valid) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(ct_valid) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.maintenance_book_complete; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(maintenance_book_complete),UPDATE(maintenance_book_complete) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(maintenance_book_complete) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.seller_type; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(seller_type),UPDATE(seller_type) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(seller_type) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.tva_number; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(tva_number),UPDATE(tva_number) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(tva_number) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.boost_level; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(boost_level) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(boost_level) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.boost_expires_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(boost_expires_at) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(boost_expires_at) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.boost_warning_sent; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(boost_warning_sent) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.search_vector; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(search_vector) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.car_pass_url; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(car_pass_url),UPDATE(car_pass_url) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.car_pass_date; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(car_pass_date),UPDATE(car_pass_date) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(car_pass_date) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.reference_url; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(reference_url),UPDATE(reference_url) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(reference_url) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.latitude; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(latitude),UPDATE(latitude) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(latitude) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.longitude; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(longitude),UPDATE(longitude) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(longitude) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.car_pass_status; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(car_pass_status) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(car_pass_status) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.car_pass_request_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(car_pass_request_id) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.car_pass_verified; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(car_pass_verified) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(car_pass_verified) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.coordinates; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(coordinates) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.needs_review; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(needs_review) ON TABLE public.car_listings TO authenticated;


--
-- Name: COLUMN car_listings.fuel_consumption; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(fuel_consumption),UPDATE(fuel_consumption) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(fuel_consumption) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.boost_rank; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(boost_rank) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(boost_rank) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.co2; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(co2),UPDATE(co2) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(co2) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.co2_cycle; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(co2_cycle),UPDATE(co2_cycle) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(co2_cycle) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.mma; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(mma),UPDATE(mma) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(mma) ON TABLE public.car_listings TO anon;


--
-- Name: COLUMN car_listings.puissance_cv; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(puissance_cv),UPDATE(puissance_cv) ON TABLE public.car_listings TO authenticated;
GRANT SELECT(puissance_cv) ON TABLE public.car_listings TO anon;


--
-- Name: TABLE car_listings_public; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.car_listings_public TO anon;
GRANT ALL ON TABLE public.car_listings_public TO authenticated;
GRANT ALL ON TABLE public.car_listings_public TO service_role;
GRANT SELECT,INSERT ON TABLE public.car_listings_public TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.car_listings_public TO sandbox_exec;


--
-- Name: TABLE car_pass_verification_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.car_pass_verification_requests TO anon;
GRANT ALL ON TABLE public.car_pass_verification_requests TO authenticated;
GRANT ALL ON TABLE public.car_pass_verification_requests TO service_role;
GRANT SELECT,INSERT ON TABLE public.car_pass_verification_requests TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.car_pass_verification_requests TO sandbox_exec;


--
-- Name: TABLE car_views; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.car_views TO anon;
GRANT ALL ON TABLE public.car_views TO authenticated;
GRANT ALL ON TABLE public.car_views TO service_role;
GRANT SELECT,INSERT ON TABLE public.car_views TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.car_views TO sandbox_exec;


--
-- Name: TABLE contact_messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.contact_messages TO anon;
GRANT ALL ON TABLE public.contact_messages TO authenticated;
GRANT ALL ON TABLE public.contact_messages TO service_role;
GRANT SELECT,INSERT ON TABLE public.contact_messages TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.contact_messages TO sandbox_exec;


--
-- Name: TABLE conversations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.conversations TO anon;
GRANT ALL ON TABLE public.conversations TO authenticated;
GRANT ALL ON TABLE public.conversations TO service_role;
GRANT SELECT,INSERT ON TABLE public.conversations TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.conversations TO sandbox_exec;


--
-- Name: TABLE daily_message_counts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.daily_message_counts TO anon;
GRANT ALL ON TABLE public.daily_message_counts TO authenticated;
GRANT ALL ON TABLE public.daily_message_counts TO service_role;
GRANT SELECT,INSERT ON TABLE public.daily_message_counts TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.daily_message_counts TO sandbox_exec;


--
-- Name: TABLE dealer_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.dealer_events TO authenticated;
GRANT ALL ON TABLE public.dealer_events TO service_role;
GRANT SELECT,INSERT ON TABLE public.dealer_events TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.dealer_events TO sandbox_exec;


--
-- Name: TABLE dealer_kyc; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.dealer_kyc TO anon;
GRANT ALL ON TABLE public.dealer_kyc TO authenticated;
GRANT ALL ON TABLE public.dealer_kyc TO service_role;
GRANT SELECT,INSERT ON TABLE public.dealer_kyc TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.dealer_kyc TO sandbox_exec;


--
-- Name: TABLE dealer_verification_queue; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.dealer_verification_queue TO authenticated;
GRANT ALL ON TABLE public.dealer_verification_queue TO service_role;
GRANT SELECT,INSERT ON TABLE public.dealer_verification_queue TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.dealer_verification_queue TO sandbox_exec;


--
-- Name: TABLE email_send_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.email_send_log TO anon;
GRANT ALL ON TABLE public.email_send_log TO authenticated;
GRANT ALL ON TABLE public.email_send_log TO service_role;
GRANT SELECT,INSERT ON TABLE public.email_send_log TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.email_send_log TO sandbox_exec;


--
-- Name: TABLE email_send_state; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.email_send_state TO anon;
GRANT ALL ON TABLE public.email_send_state TO authenticated;
GRANT ALL ON TABLE public.email_send_state TO service_role;
GRANT SELECT,INSERT ON TABLE public.email_send_state TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.email_send_state TO sandbox_exec;


--
-- Name: TABLE email_unsubscribe_tokens; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.email_unsubscribe_tokens TO anon;
GRANT ALL ON TABLE public.email_unsubscribe_tokens TO authenticated;
GRANT ALL ON TABLE public.email_unsubscribe_tokens TO service_role;
GRANT SELECT,INSERT ON TABLE public.email_unsubscribe_tokens TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.email_unsubscribe_tokens TO sandbox_exec;


--
-- Name: TABLE favorites; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.favorites TO anon;
GRANT ALL ON TABLE public.favorites TO authenticated;
GRANT ALL ON TABLE public.favorites TO service_role;
GRANT SELECT,INSERT ON TABLE public.favorites TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.favorites TO sandbox_exec;


--
-- Name: TABLE fuel_prices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fuel_prices TO anon;
GRANT ALL ON TABLE public.fuel_prices TO authenticated;
GRANT ALL ON TABLE public.fuel_prices TO service_role;
GRANT SELECT,INSERT ON TABLE public.fuel_prices TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.fuel_prices TO sandbox_exec;


--
-- Name: TABLE listing_drafts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.listing_drafts TO anon;
GRANT ALL ON TABLE public.listing_drafts TO authenticated;
GRANT ALL ON TABLE public.listing_drafts TO service_role;
GRANT SELECT,INSERT ON TABLE public.listing_drafts TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.listing_drafts TO sandbox_exec;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;
GRANT SELECT,INSERT ON TABLE public.messages TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.messages TO sandbox_exec;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT,INSERT ON TABLE public.profiles TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.profiles TO sandbox_exec;


--
-- Name: TABLE profiles_public; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles_public TO anon;
GRANT ALL ON TABLE public.profiles_public TO authenticated;
GRANT ALL ON TABLE public.profiles_public TO service_role;
GRANT SELECT,INSERT ON TABLE public.profiles_public TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.profiles_public TO sandbox_exec;


--
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.push_subscriptions TO anon;
GRANT ALL ON TABLE public.push_subscriptions TO authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;
GRANT SELECT,INSERT ON TABLE public.push_subscriptions TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.push_subscriptions TO sandbox_exec;


--
-- Name: TABLE rate_limits; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.rate_limits TO anon;
GRANT ALL ON TABLE public.rate_limits TO authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;
GRANT SELECT,INSERT ON TABLE public.rate_limits TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.rate_limits TO sandbox_exec;


--
-- Name: TABLE reports; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.reports TO anon;
GRANT ALL ON TABLE public.reports TO authenticated;
GRANT ALL ON TABLE public.reports TO service_role;
GRANT SELECT,INSERT ON TABLE public.reports TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.reports TO sandbox_exec;


--
-- Name: TABLE reviews; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.reviews TO anon;
GRANT ALL ON TABLE public.reviews TO authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;
GRANT SELECT,INSERT ON TABLE public.reviews TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.reviews TO sandbox_exec;


--
-- Name: COLUMN reviews.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id) ON TABLE public.reviews TO anon;


--
-- Name: COLUMN reviews.car_listing_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(car_listing_id) ON TABLE public.reviews TO anon;


--
-- Name: COLUMN reviews.rating; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(rating) ON TABLE public.reviews TO anon;


--
-- Name: COLUMN reviews.comment; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(comment) ON TABLE public.reviews TO anon;


--
-- Name: COLUMN reviews.created_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(created_at) ON TABLE public.reviews TO anon;


--
-- Name: COLUMN reviews.updated_at; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(updated_at) ON TABLE public.reviews TO anon;


--
-- Name: TABLE stripe_processed_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.stripe_processed_events TO anon;
GRANT ALL ON TABLE public.stripe_processed_events TO authenticated;
GRANT ALL ON TABLE public.stripe_processed_events TO service_role;
GRANT SELECT,INSERT ON TABLE public.stripe_processed_events TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.stripe_processed_events TO sandbox_exec;


--
-- Name: TABLE subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.subscriptions TO anon;
GRANT ALL ON TABLE public.subscriptions TO authenticated;
GRANT ALL ON TABLE public.subscriptions TO service_role;
GRANT SELECT,INSERT ON TABLE public.subscriptions TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.subscriptions TO sandbox_exec;


--
-- Name: TABLE suppressed_emails; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.suppressed_emails TO anon;
GRANT ALL ON TABLE public.suppressed_emails TO authenticated;
GRANT ALL ON TABLE public.suppressed_emails TO service_role;
GRANT SELECT,INSERT ON TABLE public.suppressed_emails TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.suppressed_emails TO sandbox_exec;


--
-- Name: TABLE user_alerts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_alerts TO anon;
GRANT ALL ON TABLE public.user_alerts TO authenticated;
GRANT ALL ON TABLE public.user_alerts TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_alerts TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.user_alerts TO sandbox_exec;


--
-- Name: TABLE user_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_preferences TO anon;
GRANT ALL ON TABLE public.user_preferences TO authenticated;
GRANT ALL ON TABLE public.user_preferences TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_preferences TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.user_preferences TO sandbox_exec;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;
GRANT SELECT,INSERT ON TABLE public.user_roles TO sandbox_exec_jbdsjqoonpieusfvkhyo;
GRANT SELECT,INSERT ON TABLE public.user_roles TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO sandbox_exec_jbdsjqoonpieusfvkhyo;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO sandbox_exec_jbdsjqoonpieusfvkhyo;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT ON TABLES TO sandbox_exec_jbdsjqoonpieusfvkhyo;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT ON TABLES TO sandbox_exec;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict Oqkrm2Q7g6kqAuJKuo4ITMMN41U9uz3fIxJdt5cmEeJU6a1ho0eLZTceKkLv9ly

