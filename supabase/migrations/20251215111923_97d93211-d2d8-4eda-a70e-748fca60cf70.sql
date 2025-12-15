-- Add learnings_text column for project learnings as text (not array)
ALTER TABLE public.knowledge_entries 
ADD COLUMN learnings_text text;

-- Add comment for clarity
COMMENT ON COLUMN public.knowledge_entries.learnings_text IS 'Manual text field for project learnings and reflections';