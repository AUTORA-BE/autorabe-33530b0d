DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec_jbdsjqoonpieusfvkhyo') THEN
    EXECUTE 'GRANT ALL ON FUNCTION public.admin_list_listings_with_contacts(_limit integer) TO sandbox_exec_jbdsjqoonpieusfvkhyo';
  END IF;
END
$$;