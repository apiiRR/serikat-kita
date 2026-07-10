-- Create hotline contacts table
CREATE TABLE public.hotline_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hotline_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hotline contacts (public read, admin write)
CREATE POLICY "Anyone can view hotline contacts"
ON public.hotline_contacts
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage hotline contacts"
ON public.hotline_contacts
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hotline_contacts_updated_at
BEFORE UPDATE ON public.hotline_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
