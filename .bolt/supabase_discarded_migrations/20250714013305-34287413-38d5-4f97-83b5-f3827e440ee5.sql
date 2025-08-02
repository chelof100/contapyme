-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'contador', 'usuario');

-- Create table for companies/PYMEs
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut TEXT UNIQUE,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  sector TEXT,
  tipo_empresa TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  empresa_id UUID REFERENCES public.empresas(id),
  role public.user_role NOT NULL DEFAULT 'usuario',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to get current user empresa_id
CREATE OR REPLACE FUNCTION public.get_current_user_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for empresas
CREATE POLICY "Users can view their own company"
ON public.empresas
FOR SELECT
USING (id = public.get_current_user_empresa_id());

CREATE POLICY "Admins can view all companies"
ON public.empresas
FOR SELECT
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert companies"
ON public.empresas
FOR INSERT
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update companies"
ON public.empresas
FOR UPDATE
USING (public.get_current_user_role() = 'admin');

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles from same company"
ON public.profiles
FOR SELECT
USING (empresa_id = public.get_current_user_empresa_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.get_current_user_role() = 'admin');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for timestamp updates
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();