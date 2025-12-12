-- Add new category values to the enum
ALTER TYPE public.knowledge_category ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE public.knowledge_category ADD VALUE IF NOT EXISTS 'person';