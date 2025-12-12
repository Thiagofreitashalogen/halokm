-- Create table to store document parsing jobs
CREATE TABLE public.document_parsing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  file_name TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public access since this is an internal tool
ALTER TABLE public.document_parsing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on document_parsing_jobs"
ON public.document_parsing_jobs
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_document_parsing_jobs_updated_at
BEFORE UPDATE ON public.document_parsing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();