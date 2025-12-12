-- Create offer_client_links junction table for linking offers to clients by ID
CREATE TABLE public.offer_client_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.knowledge_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(offer_id, client_id)
);

-- Enable Row Level Security
ALTER TABLE public.offer_client_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (matching existing link tables pattern)
CREATE POLICY "Allow all read access" 
ON public.offer_client_links 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert access" 
ON public.offer_client_links 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update access" 
ON public.offer_client_links 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete access" 
ON public.offer_client_links 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_offer_client_links_offer_id ON public.offer_client_links(offer_id);
CREATE INDEX idx_offer_client_links_client_id ON public.offer_client_links(client_id);