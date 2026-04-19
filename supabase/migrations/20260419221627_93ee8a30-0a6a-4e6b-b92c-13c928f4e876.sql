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