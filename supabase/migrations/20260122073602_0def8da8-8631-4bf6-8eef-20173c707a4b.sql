-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Drop overly permissive policy for complaints insert
DROP POLICY IF EXISTS "Anyone can submit complaints" ON public.complaints;

-- Create more restrictive insert policy - require at least valid data
CREATE POLICY "Validated submissions can insert complaints"
ON public.complaints
FOR INSERT
WITH CHECK (
    name IS NOT NULL AND 
    name != '' AND
    email IS NOT NULL AND 
    email != '' AND
    category IS NOT NULL AND
    subject IS NOT NULL AND
    message IS NOT NULL
);