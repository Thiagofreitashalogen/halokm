-- Add columns for people-specific fields
ALTER TABLE public.knowledge_entries 
ADD COLUMN IF NOT EXISTS studio TEXT,
ADD COLUMN IF NOT EXISTS position TEXT;

-- Create junction table for people-client relationships
CREATE TABLE public.people_client_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(person_id, client_id)
);

-- Create junction table for people-method expertise relationships
CREATE TABLE public.people_method_expertise (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    method_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(person_id, method_id)
);

-- Enable RLS on new tables
ALTER TABLE public.people_client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people_method_expertise ENABLE ROW LEVEL SECURITY;

-- Create policies for people_client_links
CREATE POLICY "Allow public read access" ON public.people_client_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.people_client_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.people_client_links FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.people_client_links FOR DELETE USING (true);

-- Create policies for people_method_expertise
CREATE POLICY "Allow public read access" ON public.people_method_expertise FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.people_method_expertise FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.people_method_expertise FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.people_method_expertise FOR DELETE USING (true);