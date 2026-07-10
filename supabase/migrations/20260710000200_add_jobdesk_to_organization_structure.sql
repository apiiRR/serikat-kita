-- Add optional jobdesk field for organization structure members/divisions
ALTER TABLE public.organization_structure
ADD COLUMN jobdesk TEXT;
