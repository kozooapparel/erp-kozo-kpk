-- Create owner auth user and profile in one migration.
-- Password: Admin123! (change after first login)
-- Role: 'owner' (full access per profiles.role check constraint)

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert into auth.users (bypasses RLS via service role)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'owner@raidwear.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Insert identity (required for email login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'owner@raidwear.com'),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );

  -- Insert profile (owner role)
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, 'owner@raidwear.com', 'Owner RAIDWEAR', 'owner')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Owner user created with id: %', new_user_id;
END $$;
