-- First, remove the insecure public read policy
DROP POLICY IF EXISTS "Enable read access for all users" ON "Level 3 Security Officer";

-- Create an enum for application roles (PostgreSQL doesn't support IF NOT EXISTS for types)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'security_admin', 'instructor', 'student');
    END IF;
END $$;

-- Create a user_roles table to manage access control
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'security_admin')
  )
$$;

-- Create secure RLS policy for security officer table - only admins and security_admins can read
CREATE POLICY "Security admins can view security officers" 
ON "Level 3 Security Officer"
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create policy for security admins to insert security officer records
CREATE POLICY "Security admins can insert security officers" 
ON "Level 3 Security Officer"
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Create policy for security admins to update security officer records
CREATE POLICY "Security admins can update security officers" 
ON "Level 3 Security Officer"
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create policy for security admins to delete security officer records
CREATE POLICY "Security admins can delete security officers" 
ON "Level 3 Security Officer"
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles" 
ON public.user_roles
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles" 
ON public.user_roles
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));