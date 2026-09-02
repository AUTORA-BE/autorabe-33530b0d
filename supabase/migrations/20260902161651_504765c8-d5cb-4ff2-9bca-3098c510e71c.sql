DO $$
BEGIN
  BEGIN
    EXECUTE 'SET LOCAL ROLE supabase_admin';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'spatial_ref_sys: pas de bascule vers supabase_admin (%).', SQLERRM;
    RETURN;
  END;

  BEGIN
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.spatial_ref_sys FROM anon, authenticated';
    EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
    BEGIN
      EXECUTE 'CREATE POLICY "spatial_ref_sys is publicly readable" ON public.spatial_ref_sys FOR SELECT USING (true)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'spatial_ref_sys: verrouillage impossible (%).', SQLERRM;
  END;

  EXECUTE 'RESET ROLE';
END;
$$;