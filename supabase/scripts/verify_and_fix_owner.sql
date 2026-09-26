-- Verify owner profile exists with correct role.
-- Idempotent: ensures owner@raidwear.com is in public.profiles with role='owner'.
-- If a row exists for owner@raidwear.com but role is wrong, fix it.

DO $$
DECLARE
  auth_user_id uuid;
  profile_count int;
  auth_count int;
BEGIN
  -- Check auth.users
  SELECT COUNT(*) INTO auth_count
  FROM auth.users
  WHERE email = 'owner@raidwear.com';

  RAISE NOTICE 'auth.users rows for owner@raidwear.com: %', auth_count;

  IF auth_count = 0 THEN
    -- Re-create auth user (idempotent via email check)
    RAISE NOTICE 'No auth user found; migration create_owner_user.sql must be re-applied';
    RETURN;
  END IF;

  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'owner@raidwear.com'
  LIMIT 1;

  -- Ensure identity row exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = auth_user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      auth_user_id,
      jsonb_build_object('sub', auth_user_id::text, 'email', 'owner@raidwear.com'),
      'email',
      auth_user_id::text,
      now(), now(), now()
    );
    RAISE NOTICE 'Identity created for owner';
  END IF;

  -- Ensure profile row exists and has role='owner'
  SELECT COUNT(*) INTO profile_count
  FROM public.profiles
  WHERE id = auth_user_id;

  IF profile_count = 0 THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (auth_user_id, 'owner@raidwear.com', 'Owner RAIDWEAR', 'owner');
    RAISE NOTICE 'Profile created for owner';
  ELSE
    UPDATE public.profiles
    SET role = 'owner', email = 'owner@raidwear.com', full_name = 'Owner RAIDWEAR'
    WHERE id = auth_user_id AND role <> 'owner';
    RAISE NOTICE 'Profile updated to role=owner';
  END IF;
END $$;

-- Confirm
SELECT id, email, full_name, role
FROM public.profiles
WHERE email IN ('owner@raidwear.com', 'admin@raidwear.com')
ORDER BY role;
