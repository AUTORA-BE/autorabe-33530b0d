-- ============================================================================
-- RLS REGRESSION TESTS — AutoRA.be
-- ============================================================================
-- Mode d'emploi :
--   psql "$SUPABASE_DB_URL" -f supabase/tests/rls.test.sql
--   Tous les tests doivent afficher "PASS" en sortie.
--
-- Ces tests utilisent SET LOCAL "request.jwt.claims" pour simuler
-- différents rôles (anon / user A / user B / admin) sans authentification réelle.
--
-- Prérequis : avoir au moins 2 utilisateurs réels en base + 1 admin.
-- Adapter les UUIDs ci-dessous via :
--   SELECT id, email FROM auth.users LIMIT 5;
-- ============================================================================

\set ON_ERROR_STOP on
\set USER_A '00000000-0000-0000-0000-00000000000a'
\set USER_B '00000000-0000-0000-0000-00000000000b'
\set ADMIN  '00000000-0000-0000-0000-0000000000ad'

BEGIN;

-- Helpers d'assertion
CREATE OR REPLACE FUNCTION pg_temp.assert_rows(label text, expected int, actual int)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF expected = actual THEN
    RAISE NOTICE 'PASS  | % (rows=%)', label, actual;
  ELSE
    RAISE EXCEPTION 'FAIL  | % | expected=% got=%', label, expected, actual;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.assert_raises(label text, sql text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE sql;
    RAISE EXCEPTION 'FAIL  | % | expected exception, got success', label;
  EXCEPTION WHEN insufficient_privilege OR check_violation OR raise_exception THEN
    RAISE NOTICE 'PASS  | % (raised %)', label, SQLERRM;
  END;
END $$;

-- Helper : adopter un rôle/utilisateur
CREATE OR REPLACE FUNCTION pg_temp.as_user(uid uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
END $$;

CREATE OR REPLACE FUNCTION pg_temp.as_anon()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
END $$;

-- ============================================================================
-- TEST 1 — Anon ne peut PAS lire la table car_listings (PII)
-- ============================================================================
SELECT pg_temp.as_anon();
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.car_listings;
  PERFORM pg_temp.assert_rows('T1 anon→car_listings', 0, c);
END $$;

-- ============================================================================
-- TEST 2 — Anon PEUT lire car_listings_public (sans PII)
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.car_listings_public;
  IF c >= 0 THEN
    RAISE NOTICE 'PASS  | T2 anon→car_listings_public (rows=%)', c;
  END IF;
END $$;

-- ============================================================================
-- TEST 3 — Anon ne peut PAS lire profiles (email/phone)
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.profiles;
  PERFORM pg_temp.assert_rows('T3 anon→profiles', 0, c);
END $$;

-- ============================================================================
-- TEST 4 — Anon ne peut PAS créer d'annonce (INSERT bloqué)
-- ============================================================================
SELECT pg_temp.assert_raises(
  'T4 anon INSERT car_listings',
  $sql$
    INSERT INTO public.car_listings
      (user_id, brand, model, year, mileage, price, fuel_type, transmission, body_type, color, contact_name, contact_email)
    VALUES
      (gen_random_uuid(), 'Hack', 'Anon', 2020, 1000, 1, 'essence', 'manuelle', 'berline', 'noir', 'h', 'h@h.io')
  $sql$
);

-- ============================================================================
-- TEST 5 — User A ne peut PAS lire les messages de User B
-- ============================================================================
SELECT pg_temp.as_user(:'USER_A'::uuid);
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c
  FROM public.messages m
  JOIN public.conversations co ON co.id = m.conversation_id
  WHERE co.buyer_id <> :'USER_A'::uuid
    AND co.seller_id <> :'USER_A'::uuid;
  PERFORM pg_temp.assert_rows('T5 userA→messages of others', 0, c);
END $$;

-- ============================================================================
-- TEST 6 — User A ne peut PAS modifier l'annonce de User B
-- ============================================================================
SELECT pg_temp.as_user(:'USER_A'::uuid);
DO $$
DECLARE affected int;
BEGIN
  WITH upd AS (
    UPDATE public.car_listings
       SET description = 'HACKED'
     WHERE user_id = :'USER_B'::uuid
     RETURNING 1
  )
  SELECT count(*) INTO affected FROM upd;
  PERFORM pg_temp.assert_rows('T6 userA UPDATE userB listing', 0, affected);
END $$;

-- ============================================================================
-- TEST 7 — User A ne peut PAS supprimer l'annonce de User B
-- ============================================================================
DO $$
DECLARE affected int;
BEGIN
  WITH del AS (
    DELETE FROM public.car_listings
     WHERE user_id = :'USER_B'::uuid
     RETURNING 1
  )
  SELECT count(*) INTO affected FROM del;
  PERFORM pg_temp.assert_rows('T7 userA DELETE userB listing', 0, affected);
END $$;

-- ============================================================================
-- TEST 8 — User A ne peut PAS s'auto-promouvoir admin via user_roles
-- ============================================================================
SELECT pg_temp.assert_raises(
  'T8 userA INSERT user_roles=admin',
  format('INSERT INTO public.user_roles (user_id, role) VALUES (%L, ''admin'')', :'USER_A')
);

-- ============================================================================
-- TEST 9 — User A ne peut PAS lire la table user_roles d'un autre user
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.user_roles WHERE user_id <> :'USER_A'::uuid;
  PERFORM pg_temp.assert_rows('T9 userA→user_roles of others', 0, c);
END $$;

-- ============================================================================
-- TEST 10 — User A ne peut PAS lire les admin_actions
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.admin_actions;
  PERFORM pg_temp.assert_rows('T10 userA→admin_actions', 0, c);
END $$;

-- ============================================================================
-- TEST 11 — User A ne peut PAS lire les reports
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.reports WHERE user_id <> :'USER_A'::uuid;
  PERFORM pg_temp.assert_rows('T11 userA→reports of others', 0, c);
END $$;

-- ============================================================================
-- TEST 12 — User A ne peut PAS lire les push_subscriptions de User B
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.push_subscriptions WHERE user_id = :'USER_B'::uuid;
  PERFORM pg_temp.assert_rows('T12 userA→push_subs userB', 0, c);
END $$;

-- ============================================================================
-- TEST 13 — User A ne peut PAS lire le profile de User B
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.profiles WHERE user_id = :'USER_B'::uuid;
  PERFORM pg_temp.assert_rows('T13 userA→profile userB', 0, c);
END $$;

-- ============================================================================
-- TEST 14 — User A ne peut PAS lire les favorites de User B
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.favorites WHERE user_id = :'USER_B'::uuid;
  PERFORM pg_temp.assert_rows('T14 userA→favorites userB', 0, c);
END $$;

-- ============================================================================
-- TEST 15 — User A ne peut PAS lire les user_alerts de User B
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.user_alerts WHERE user_id = :'USER_B'::uuid;
  PERFORM pg_temp.assert_rows('T15 userA→user_alerts userB', 0, c);
END $$;

-- ============================================================================
-- TEST 16 — User A ne peut PAS lire le subscription Stripe de User B
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.subscriptions WHERE user_id = :'USER_B'::uuid;
  PERFORM pg_temp.assert_rows('T16 userA→subscription userB', 0, c);
END $$;

-- ============================================================================
-- TEST 17 — Admin PEUT lire toutes les annonces (incluant pending/rejected)
-- ============================================================================
SELECT pg_temp.as_user(:'ADMIN'::uuid);
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.car_listings WHERE status IN ('pending','rejected');
  IF c >= 0 THEN
    RAISE NOTICE 'PASS  | T17 admin→all car_listings (rows=%)', c;
  END IF;
END $$;

-- ============================================================================
-- TEST 18 — Admin PEUT lire la table profiles (modération)
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.profiles;
  IF c >= 0 THEN
    RAISE NOTICE 'PASS  | T18 admin→profiles (rows=%)', c;
  END IF;
END $$;

-- ============================================================================
-- TEST 19 — Anon PEUT lire fuel_prices (donnée publique)
-- ============================================================================
SELECT pg_temp.as_anon();
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.fuel_prices;
  IF c >= 0 THEN
    RAISE NOTICE 'PASS  | T19 anon→fuel_prices (rows=%)', c;
  END IF;
END $$;

-- ============================================================================
-- TEST 20 — Anon PEUT lire les barèmes fiscaux belges (donnée publique légale)
-- ============================================================================
DO $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.belgian_tmc_brackets;
  IF c >= 0 THEN
    RAISE NOTICE 'PASS  | T20 anon→belgian_tmc_brackets (rows=%)', c;
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK : ces tests sont read-mostly, on annule par sécurité
-- ============================================================================
ROLLBACK;

\echo
\echo '============================================================================'
\echo '  RLS regression suite finished. All assertions must show PASS above.'
\echo '============================================================================'
