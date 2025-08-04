/*
  # Create users table and complete authentication setup

  1. New Tables
    - `users` (extends Supabase auth.users)
      - Custom user data and company relationships
  
  2. Security
    - Enable RLS on users table
    - Add policies for user management
    
  3. Functions
    - Helper functions for user management
    - Company assignment functions
*/

-- Create users table to extend auth.users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  empresa_id uuid REFERENCES empresas(id),
  role user_role DEFAULT 'usuario'::user_role NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users from same company"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin'::user_role AND
    empresa_id = get_current_user_empresa_id()
  );

CREATE POLICY "Admins can insert users for their company"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'::user_role AND
    empresa_id = get_current_user_empresa_id()
  );

CREATE POLICY "Admins can update users from their company"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'::user_role AND
    empresa_id = get_current_user_empresa_id()
  );

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (NEW.id, NEW.email, 'usuario'::user_role);
  
  -- Create profile entry
  INSERT INTO profiles (id, email, username, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update profiles foreign key to reference users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;