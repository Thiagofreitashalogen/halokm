-- Fix RLS Security: Replace all USING (true) policies with proper @halogen.no domain checks
-- This migration ensures only authenticated users with @halogen.no email addresses can access data

-- Helper function to check if user has @halogen.no email
CREATE OR REPLACE FUNCTION public.is_halogen_user()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' LIKE '%@halogen.no'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- knowledge_entries
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Allow public insert access" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Allow public update access" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Allow public delete access" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Authenticated users can read entries" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Authenticated users can insert entries" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Authenticated users can update entries" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Authenticated users can delete entries" ON public.knowledge_entries;

CREATE POLICY "Halogen users can read entries"
ON public.knowledge_entries
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert entries"
ON public.knowledge_entries
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update entries"
ON public.knowledge_entries
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete entries"
ON public.knowledge_entries
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- project_method_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.project_method_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.project_method_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.project_method_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.project_method_links;
DROP POLICY IF EXISTS "Authenticated users can read project_method_links" ON public.project_method_links;
DROP POLICY IF EXISTS "Authenticated users can insert project_method_links" ON public.project_method_links;
DROP POLICY IF EXISTS "Authenticated users can update project_method_links" ON public.project_method_links;
DROP POLICY IF EXISTS "Authenticated users can delete project_method_links" ON public.project_method_links;

CREATE POLICY "Halogen users can read project_method_links"
ON public.project_method_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert project_method_links"
ON public.project_method_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update project_method_links"
ON public.project_method_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete project_method_links"
ON public.project_method_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- offer_method_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.offer_method_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.offer_method_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.offer_method_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.offer_method_links;
DROP POLICY IF EXISTS "Authenticated users can read offer_method_links" ON public.offer_method_links;
DROP POLICY IF EXISTS "Authenticated users can insert offer_method_links" ON public.offer_method_links;
DROP POLICY IF EXISTS "Authenticated users can update offer_method_links" ON public.offer_method_links;
DROP POLICY IF EXISTS "Authenticated users can delete offer_method_links" ON public.offer_method_links;

CREATE POLICY "Halogen users can read offer_method_links"
ON public.offer_method_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert offer_method_links"
ON public.offer_method_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update offer_method_links"
ON public.offer_method_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete offer_method_links"
ON public.offer_method_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- offer_people_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.offer_people_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.offer_people_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.offer_people_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.offer_people_links;
DROP POLICY IF EXISTS "Authenticated users can read offer_people_links" ON public.offer_people_links;
DROP POLICY IF EXISTS "Authenticated users can insert offer_people_links" ON public.offer_people_links;
DROP POLICY IF EXISTS "Authenticated users can update offer_people_links" ON public.offer_people_links;
DROP POLICY IF EXISTS "Authenticated users can delete offer_people_links" ON public.offer_people_links;

CREATE POLICY "Halogen users can read offer_people_links"
ON public.offer_people_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert offer_people_links"
ON public.offer_people_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update offer_people_links"
ON public.offer_people_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete offer_people_links"
ON public.offer_people_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- people_client_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.people_client_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.people_client_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.people_client_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.people_client_links;
DROP POLICY IF EXISTS "Authenticated users can read people_client_links" ON public.people_client_links;
DROP POLICY IF EXISTS "Authenticated users can insert people_client_links" ON public.people_client_links;
DROP POLICY IF EXISTS "Authenticated users can update people_client_links" ON public.people_client_links;
DROP POLICY IF EXISTS "Authenticated users can delete people_client_links" ON public.people_client_links;

CREATE POLICY "Halogen users can read people_client_links"
ON public.people_client_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert people_client_links"
ON public.people_client_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update people_client_links"
ON public.people_client_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete people_client_links"
ON public.people_client_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- people_method_expertise
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Allow public insert access" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Allow public update access" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Allow public delete access" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Authenticated users can read people_method_expertise" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Authenticated users can insert people_method_expertise" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Authenticated users can update people_method_expertise" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Authenticated users can delete people_method_expertise" ON public.people_method_expertise;

CREATE POLICY "Halogen users can read people_method_expertise"
ON public.people_method_expertise
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert people_method_expertise"
ON public.people_method_expertise
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update people_method_expertise"
ON public.people_method_expertise
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete people_method_expertise"
ON public.people_method_expertise
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- project_client_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.project_client_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.project_client_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.project_client_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.project_client_links;
DROP POLICY IF EXISTS "Authenticated users can read project_client_links" ON public.project_client_links;
DROP POLICY IF EXISTS "Authenticated users can insert project_client_links" ON public.project_client_links;
DROP POLICY IF EXISTS "Authenticated users can update project_client_links" ON public.project_client_links;
DROP POLICY IF EXISTS "Authenticated users can delete project_client_links" ON public.project_client_links;

CREATE POLICY "Halogen users can read project_client_links"
ON public.project_client_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert project_client_links"
ON public.project_client_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update project_client_links"
ON public.project_client_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete project_client_links"
ON public.project_client_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- project_people_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.project_people_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.project_people_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.project_people_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.project_people_links;
DROP POLICY IF EXISTS "Authenticated users can read project_people_links" ON public.project_people_links;
DROP POLICY IF EXISTS "Authenticated users can insert project_people_links" ON public.project_people_links;
DROP POLICY IF EXISTS "Authenticated users can update project_people_links" ON public.project_people_links;
DROP POLICY IF EXISTS "Authenticated users can delete project_people_links" ON public.project_people_links;

CREATE POLICY "Halogen users can read project_people_links"
ON public.project_people_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert project_people_links"
ON public.project_people_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update project_people_links"
ON public.project_people_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete project_people_links"
ON public.project_people_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- market_client_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.market_client_links;
DROP POLICY IF EXISTS "Allow all insert access" ON public.market_client_links;
DROP POLICY IF EXISTS "Allow all update access" ON public.market_client_links;
DROP POLICY IF EXISTS "Allow all delete access" ON public.market_client_links;

CREATE POLICY "Halogen users can read market_client_links"
ON public.market_client_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert market_client_links"
ON public.market_client_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update market_client_links"
ON public.market_client_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete market_client_links"
ON public.market_client_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- market_project_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.market_project_links;
DROP POLICY IF EXISTS "Allow all insert access" ON public.market_project_links;
DROP POLICY IF EXISTS "Allow all update access" ON public.market_project_links;
DROP POLICY IF EXISTS "Allow all delete access" ON public.market_project_links;

CREATE POLICY "Halogen users can read market_project_links"
ON public.market_project_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert market_project_links"
ON public.market_project_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update market_project_links"
ON public.market_project_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete market_project_links"
ON public.market_project_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- offer_client_links
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.offer_client_links;
DROP POLICY IF EXISTS "Allow all insert access" ON public.offer_client_links;
DROP POLICY IF EXISTS "Allow all update access" ON public.offer_client_links;
DROP POLICY IF EXISTS "Allow all delete access" ON public.offer_client_links;

CREATE POLICY "Halogen users can read offer_client_links"
ON public.offer_client_links
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert offer_client_links"
ON public.offer_client_links
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update offer_client_links"
ON public.offer_client_links
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete offer_client_links"
ON public.offer_client_links
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- content_drafts
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.content_drafts;
DROP POLICY IF EXISTS "Allow all insert access" ON public.content_drafts;
DROP POLICY IF EXISTS "Allow all update access" ON public.content_drafts;
DROP POLICY IF EXISTS "Allow all delete access" ON public.content_drafts;

CREATE POLICY "Halogen users can read content_drafts"
ON public.content_drafts
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert content_drafts"
ON public.content_drafts
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update content_drafts"
ON public.content_drafts
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete content_drafts"
ON public.content_drafts
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- content_draft_versions
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.content_draft_versions;
DROP POLICY IF EXISTS "Allow all insert access" ON public.content_draft_versions;
DROP POLICY IF EXISTS "Allow all update access" ON public.content_draft_versions;
DROP POLICY IF EXISTS "Allow all delete access" ON public.content_draft_versions;

CREATE POLICY "Halogen users can read content_draft_versions"
ON public.content_draft_versions
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert content_draft_versions"
ON public.content_draft_versions
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update content_draft_versions"
ON public.content_draft_versions
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete content_draft_versions"
ON public.content_draft_versions
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- document_parsing_jobs
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.document_parsing_jobs;
DROP POLICY IF EXISTS "Allow all insert access" ON public.document_parsing_jobs;
DROP POLICY IF EXISTS "Allow all update access" ON public.document_parsing_jobs;
DROP POLICY IF EXISTS "Allow all delete access" ON public.document_parsing_jobs;

CREATE POLICY "Halogen users can read document_parsing_jobs"
ON public.document_parsing_jobs
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert document_parsing_jobs"
ON public.document_parsing_jobs
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update document_parsing_jobs"
ON public.document_parsing_jobs
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete document_parsing_jobs"
ON public.document_parsing_jobs
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- offer_templates
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.offer_templates;
DROP POLICY IF EXISTS "Allow all insert access" ON public.offer_templates;
DROP POLICY IF EXISTS "Allow all update access" ON public.offer_templates;
DROP POLICY IF EXISTS "Allow all delete access" ON public.offer_templates;

CREATE POLICY "Halogen users can read offer_templates"
ON public.offer_templates
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert offer_templates"
ON public.offer_templates
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update offer_templates"
ON public.offer_templates
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete offer_templates"
ON public.offer_templates
FOR DELETE
TO authenticated
USING (is_halogen_user());

-- ============================================================================
-- style_guides
-- ============================================================================
DROP POLICY IF EXISTS "Allow all read access" ON public.style_guides;
DROP POLICY IF EXISTS "Allow all insert access" ON public.style_guides;
DROP POLICY IF EXISTS "Allow all update access" ON public.style_guides;
DROP POLICY IF EXISTS "Allow all delete access" ON public.style_guides;

CREATE POLICY "Halogen users can read style_guides"
ON public.style_guides
FOR SELECT
TO authenticated
USING (is_halogen_user());

CREATE POLICY "Halogen users can insert style_guides"
ON public.style_guides
FOR INSERT
TO authenticated
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can update style_guides"
ON public.style_guides
FOR UPDATE
TO authenticated
USING (is_halogen_user())
WITH CHECK (is_halogen_user());

CREATE POLICY "Halogen users can delete style_guides"
ON public.style_guides
FOR DELETE
TO authenticated
USING (is_halogen_user());
