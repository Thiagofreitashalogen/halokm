-- Add columns for project-specific fields
ALTER TABLE public.knowledge_entries 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS references_links TEXT[] DEFAULT '{}';

-- Create junction table for project-people relationships
CREATE TABLE public.project_people_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, person_id)
);

-- Enable RLS on new table
ALTER TABLE public.project_people_links ENABLE ROW LEVEL SECURITY;

-- Create policies for project_people_links
CREATE POLICY "Allow public read access" ON public.project_people_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.project_people_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.project_people_links FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.project_people_links FOR DELETE USING (true);