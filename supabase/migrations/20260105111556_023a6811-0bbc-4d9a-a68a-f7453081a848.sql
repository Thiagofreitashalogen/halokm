-- Add 'market' to the knowledge_category enum
ALTER TYPE knowledge_category ADD VALUE 'market';

-- Create junction table for market-client relationships
CREATE TABLE public.market_client_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL,
  client_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(market_id, client_id)
);

-- Create junction table for market-project relationships
CREATE TABLE public.market_project_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL,
  project_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(market_id, project_id)
);

-- Enable RLS on both tables
ALTER TABLE public.market_client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_project_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for market_client_links
CREATE POLICY "Allow all read access" ON public.market_client_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.market_client_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.market_client_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.market_client_links FOR DELETE USING (true);

-- RLS policies for market_project_links
CREATE POLICY "Allow all read access" ON public.market_project_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.market_project_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.market_project_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.market_project_links FOR DELETE USING (true);