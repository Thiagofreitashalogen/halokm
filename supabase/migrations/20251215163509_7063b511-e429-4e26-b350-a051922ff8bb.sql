-- Create offer_templates table
CREATE TABLE public.offer_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_structure JSONB,
  placeholders TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create style_guides table
CREATE TABLE public.style_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  tone_of_voice TEXT,
  writing_guidelines TEXT,
  brand_colors JSONB,
  typography_rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_guides ENABLE ROW LEVEL SECURITY;

-- Create policies for offer_templates
CREATE POLICY "Allow all read access" ON public.offer_templates FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.offer_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.offer_templates FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.offer_templates FOR DELETE USING (true);

-- Create policies for style_guides
CREATE POLICY "Allow all read access" ON public.style_guides FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.style_guides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.style_guides FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.style_guides FOR DELETE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_offer_templates_updated_at
  BEFORE UPDATE ON public.offer_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_style_guides_updated_at
  BEFORE UPDATE ON public.style_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();