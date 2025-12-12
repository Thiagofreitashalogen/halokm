-- Remove steps column from knowledge_entries table
ALTER TABLE public.knowledge_entries DROP COLUMN IF EXISTS steps;