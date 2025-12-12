-- Add columns for method-specific fields
ALTER TABLE public.knowledge_entries 
ADD COLUMN IF NOT EXISTS field TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS full_description TEXT;