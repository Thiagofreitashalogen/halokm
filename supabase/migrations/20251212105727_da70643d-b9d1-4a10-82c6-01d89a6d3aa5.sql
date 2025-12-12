-- Create enum for offer work status
CREATE TYPE public.offer_work_status AS ENUM ('under_development', 'delivered');

-- Update offer_status enum to only have pending, won, lost (need to recreate)
-- First, add new columns
ALTER TABLE public.knowledge_entries 
ADD COLUMN IF NOT EXISTS offer_work_status public.offer_work_status,
ADD COLUMN IF NOT EXISTS date_delivered DATE,
ADD COLUMN IF NOT EXISTS winning_strategy TEXT,
ADD COLUMN IF NOT EXISTS loss_reasons TEXT;

-- Create junction table for offer-people relationships
CREATE TABLE public.offer_people_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(offer_id, person_id)
);

-- Create junction table for offer-method relationships
CREATE TABLE public.offer_method_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    method_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(offer_id, method_id)
);

-- Enable RLS on new tables
ALTER TABLE public.offer_people_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_method_links ENABLE ROW LEVEL SECURITY;

-- Create policies for offer_people_links
CREATE POLICY "Allow public read access" ON public.offer_people_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.offer_people_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.offer_people_links FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.offer_people_links FOR DELETE USING (true);

-- Create policies for offer_method_links
CREATE POLICY "Allow public read access" ON public.offer_method_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.offer_method_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.offer_method_links FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.offer_method_links FOR DELETE USING (true);