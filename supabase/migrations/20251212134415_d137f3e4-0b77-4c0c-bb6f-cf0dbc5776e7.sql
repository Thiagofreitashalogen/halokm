-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read entries" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Authenticated users can insert entries" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Authenticated users can update entries" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Authenticated users can delete entries" ON public.knowledge_entries;

-- Create new permissive policies that allow all operations (for development)
-- TODO: Re-add authentication check once Google OAuth is configured
CREATE POLICY "Allow all read access" ON public.knowledge_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert access" ON public.knowledge_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update access" ON public.knowledge_entries
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete access" ON public.knowledge_entries
  FOR DELETE USING (true);

-- Also update junction tables for consistency
DROP POLICY IF EXISTS "Authenticated users can read offer_method_links" ON public.offer_method_links;
DROP POLICY IF EXISTS "Authenticated users can insert offer_method_links" ON public.offer_method_links;
DROP POLICY IF EXISTS "Authenticated users can update offer_method_links" ON public.offer_method_links;
DROP POLICY IF EXISTS "Authenticated users can delete offer_method_links" ON public.offer_method_links;

CREATE POLICY "Allow all read access" ON public.offer_method_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.offer_method_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.offer_method_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.offer_method_links FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can read offer_people_links" ON public.offer_people_links;
DROP POLICY IF EXISTS "Authenticated users can insert offer_people_links" ON public.offer_people_links;
DROP POLICY IF EXISTS "Authenticated users can update offer_people_links" ON public.offer_people_links;
DROP POLICY IF EXISTS "Authenticated users can delete offer_people_links" ON public.offer_people_links;

CREATE POLICY "Allow all read access" ON public.offer_people_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.offer_people_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.offer_people_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.offer_people_links FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can read project_method_links" ON public.project_method_links;
DROP POLICY IF EXISTS "Authenticated users can insert project_method_links" ON public.project_method_links;
DROP POLICY IF EXISTS "Authenticated users can update project_method_links" ON public.project_method_links;
DROP POLICY IF EXISTS "Authenticated users can delete project_method_links" ON public.project_method_links;

CREATE POLICY "Allow all read access" ON public.project_method_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.project_method_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.project_method_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.project_method_links FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can read project_people_links" ON public.project_people_links;
DROP POLICY IF EXISTS "Authenticated users can insert project_people_links" ON public.project_people_links;
DROP POLICY IF EXISTS "Authenticated users can update project_people_links" ON public.project_people_links;
DROP POLICY IF EXISTS "Authenticated users can delete project_people_links" ON public.project_people_links;

CREATE POLICY "Allow all read access" ON public.project_people_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.project_people_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.project_people_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.project_people_links FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can read project_client_links" ON public.project_client_links;
DROP POLICY IF EXISTS "Authenticated users can insert project_client_links" ON public.project_client_links;
DROP POLICY IF EXISTS "Authenticated users can update project_client_links" ON public.project_client_links;
DROP POLICY IF EXISTS "Authenticated users can delete project_client_links" ON public.project_client_links;

CREATE POLICY "Allow all read access" ON public.project_client_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.project_client_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.project_client_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.project_client_links FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can read people_client_links" ON public.people_client_links;
DROP POLICY IF EXISTS "Authenticated users can insert people_client_links" ON public.people_client_links;
DROP POLICY IF EXISTS "Authenticated users can update people_client_links" ON public.people_client_links;
DROP POLICY IF EXISTS "Authenticated users can delete people_client_links" ON public.people_client_links;

CREATE POLICY "Allow all read access" ON public.people_client_links FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.people_client_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.people_client_links FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.people_client_links FOR DELETE USING (true);

DROP POLICY IF EXISTS "Authenticated users can read people_method_expertise" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Authenticated users can insert people_method_expertise" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Authenticated users can update people_method_expertise" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Authenticated users can delete people_method_expertise" ON public.people_method_expertise;

CREATE POLICY "Allow all read access" ON public.people_method_expertise FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.people_method_expertise FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.people_method_expertise FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.people_method_expertise FOR DELETE USING (true);