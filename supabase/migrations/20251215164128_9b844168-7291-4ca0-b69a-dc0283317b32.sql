-- Create content_drafts table for collaborative offer writing
CREATE TABLE public.content_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  
  -- Tender/context information
  tender_summary TEXT,
  challenges TEXT[],
  deliverables TEXT[],
  requirements TEXT[],
  
  -- Strategy
  winning_strategy TEXT,
  referenced_offers UUID[],
  referenced_methods UUID[],
  
  -- Draft content
  draft_content TEXT,
  selected_template_id UUID REFERENCES public.offer_templates(id),
  selected_style_guide_id UUID REFERENCES public.style_guides(id),
  
  -- Collaboration
  created_by TEXT,
  currently_editing_by TEXT,
  currently_editing_since TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_draft_versions table for version history
CREATE TABLE public.content_draft_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id UUID NOT NULL REFERENCES public.content_drafts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  changed_by TEXT,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_draft_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for content_drafts
CREATE POLICY "Allow all read access" ON public.content_drafts FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.content_drafts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.content_drafts FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.content_drafts FOR DELETE USING (true);

-- Create policies for content_draft_versions
CREATE POLICY "Allow all read access" ON public.content_draft_versions FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.content_draft_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.content_draft_versions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.content_draft_versions FOR DELETE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_content_drafts_status ON public.content_drafts(status);
CREATE INDEX idx_content_draft_versions_draft_id ON public.content_draft_versions(draft_id);