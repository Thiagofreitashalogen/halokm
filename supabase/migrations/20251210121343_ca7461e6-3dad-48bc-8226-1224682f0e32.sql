-- Create enum for knowledge entry categories
CREATE TYPE public.knowledge_category AS ENUM ('project', 'offer', 'method');

-- Create enum for project status
CREATE TYPE public.project_status AS ENUM ('active', 'completed', 'archived');

-- Create enum for offer status  
CREATE TYPE public.offer_status AS ENUM ('draft', 'pending', 'won', 'lost');

-- Create knowledge_entries table
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category knowledge_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client TEXT,
  
  -- Project specific fields
  project_status project_status,
  deliverables TEXT[],
  
  -- Offer specific fields
  offer_status offer_status,
  win_factors TEXT[],
  loss_factors TEXT[],
  
  -- Method specific fields
  use_cases TEXT[],
  steps TEXT[],
  
  -- Common fields
  tags TEXT[] DEFAULT '{}',
  learnings TEXT[] DEFAULT '{}',
  source_drive_link TEXT,
  source_miro_link TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for project-method relationships
CREATE TABLE public.project_method_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
  method_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, method_id)
);

-- Enable RLS
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_method_links ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (for now, before auth is added)
CREATE POLICY "Allow public read access" ON public.knowledge_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.knowledge_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.knowledge_entries
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON public.knowledge_entries
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.project_method_links
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.project_method_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON public.project_method_links
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();