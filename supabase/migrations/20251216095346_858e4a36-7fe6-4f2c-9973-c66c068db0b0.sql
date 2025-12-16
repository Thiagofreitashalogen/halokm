-- Add end_date column for projects
ALTER TABLE public.knowledge_entries 
ADD COLUMN end_date date;