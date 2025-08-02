/*
  # Fix Authentication System

  1. Database Functions
    - Fix get_current_user_role function
    - Fix get_current_user_empresa_id function
    - Add handle_new_user function for automatic profile creation

  2. Triggers
    - Add trigger for automatic profile creation on user signup
    - Update RLS policies to work with new structure

  3. Security
    - Fix RLS policies for proper user isolation
    - Add proper role-based access control
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_current_user_role();
DROP FUNCTION IF EXISTS get_current_user_empresa_id();
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user empresa_id
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT empresa_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_empresa_id uuid;
BEGIN
  -- Get or create default empresa for new users
  SELECT id INTO default_empresa_id 
  FROM empresas 
  WHERE nombre = 'ContaPYME Default' 
  LIMIT 1;
  
  -- If no default empresa exists, create one
  IF default_empresa_id IS NULL THEN
    INSERT INTO empresas (nombre, email, sector, tipo_empresa)
    VALUES ('ContaPYME Default', NEW.email, 'Servicios', 'PYME')
    RETURNING id INTO default_empresa_id;
  END IF;

  -- Create profile for new user
  INSERT INTO profiles (
    id,
    username,
    first_name,
    last_name,
    email,
    empresa_id,
    role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    default_empresa_id,
    'usuario'::user_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same company" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Create new RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles from same company"
  ON profiles FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin'::user_role);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create default empresa if it doesn't exist
INSERT INTO empresas (nombre, email, sector, tipo_empresa)
SELECT 'ContaPYME Default', 'admin@contapyme.com', 'Servicios', 'PYME'
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE nombre = 'ContaPYME Default');

-- Create default admin user profile if it doesn't exist
DO $$
DECLARE
  default_empresa_id uuid;
  admin_user_id uuid;
BEGIN
  -- Get default empresa
  SELECT id INTO default_empresa_id FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  -- Check if there's a user with admin email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@contapyme.com' LIMIT 1;
  
  -- If admin user exists but no profile, create profile
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, username, first_name, last_name, email, empresa_id, role)
    SELECT admin_user_id, 'admin', 'Admin', 'User', 'admin@contapyme.com', default_empresa_id, 'admin'::user_role
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_user_id);
  END IF;
END $$;