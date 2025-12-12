-- Add industry column for client entries
ALTER TABLE public.knowledge_entries ADD COLUMN IF NOT EXISTS industry text;

-- Create junction table for project-client relationships
CREATE TABLE public.project_client_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  client_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (project_id, client_id)
);

-- Enable RLS
ALTER TABLE public.project_client_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON public.project_client_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.project_client_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.project_client_links FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.project_client_links FOR DELETE USING (true);