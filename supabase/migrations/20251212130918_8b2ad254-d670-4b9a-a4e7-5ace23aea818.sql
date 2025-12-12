-- Update RLS policies to require authentication for all tables

-- knowledge_entries
DROP POLICY IF EXISTS "Allow public read access" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Allow public insert access" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Allow public update access" ON public.knowledge_entries;
DROP POLICY IF EXISTS "Allow public delete access" ON public.knowledge_entries;

CREATE POLICY "Authenticated users can read entries" 
ON public.knowledge_entries 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert entries" 
ON public.knowledge_entries 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update entries" 
ON public.knowledge_entries 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete entries" 
ON public.knowledge_entries 
FOR DELETE 
TO authenticated
USING (true);

-- offer_method_links
DROP POLICY IF EXISTS "Allow public read access" ON public.offer_method_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.offer_method_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.offer_method_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.offer_method_links;

CREATE POLICY "Authenticated users can read offer_method_links" 
ON public.offer_method_links 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert offer_method_links" 
ON public.offer_method_links 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update offer_method_links" 
ON public.offer_method_links 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete offer_method_links" 
ON public.offer_method_links 
FOR DELETE 
TO authenticated
USING (true);

-- offer_people_links
DROP POLICY IF EXISTS "Allow public read access" ON public.offer_people_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.offer_people_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.offer_people_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.offer_people_links;

CREATE POLICY "Authenticated users can read offer_people_links" 
ON public.offer_people_links 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert offer_people_links" 
ON public.offer_people_links 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update offer_people_links" 
ON public.offer_people_links 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete offer_people_links" 
ON public.offer_people_links 
FOR DELETE 
TO authenticated
USING (true);

-- people_client_links
DROP POLICY IF EXISTS "Allow public read access" ON public.people_client_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.people_client_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.people_client_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.people_client_links;

CREATE POLICY "Authenticated users can read people_client_links" 
ON public.people_client_links 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert people_client_links" 
ON public.people_client_links 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update people_client_links" 
ON public.people_client_links 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete people_client_links" 
ON public.people_client_links 
FOR DELETE 
TO authenticated
USING (true);

-- people_method_expertise
DROP POLICY IF EXISTS "Allow public read access" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Allow public insert access" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Allow public update access" ON public.people_method_expertise;
DROP POLICY IF EXISTS "Allow public delete access" ON public.people_method_expertise;

CREATE POLICY "Authenticated users can read people_method_expertise" 
ON public.people_method_expertise 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert people_method_expertise" 
ON public.people_method_expertise 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update people_method_expertise" 
ON public.people_method_expertise 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete people_method_expertise" 
ON public.people_method_expertise 
FOR DELETE 
TO authenticated
USING (true);

-- project_client_links
DROP POLICY IF EXISTS "Allow public read access" ON public.project_client_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.project_client_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.project_client_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.project_client_links;

CREATE POLICY "Authenticated users can read project_client_links" 
ON public.project_client_links 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project_client_links" 
ON public.project_client_links 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_client_links" 
ON public.project_client_links 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project_client_links" 
ON public.project_client_links 
FOR DELETE 
TO authenticated
USING (true);

-- project_method_links
DROP POLICY IF EXISTS "Allow public read access" ON public.project_method_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.project_method_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.project_method_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.project_method_links;

CREATE POLICY "Authenticated users can read project_method_links" 
ON public.project_method_links 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project_method_links" 
ON public.project_method_links 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_method_links" 
ON public.project_method_links 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project_method_links" 
ON public.project_method_links 
FOR DELETE 
TO authenticated
USING (true);

-- project_people_links
DROP POLICY IF EXISTS "Allow public read access" ON public.project_people_links;
DROP POLICY IF EXISTS "Allow public insert access" ON public.project_people_links;
DROP POLICY IF EXISTS "Allow public update access" ON public.project_people_links;
DROP POLICY IF EXISTS "Allow public delete access" ON public.project_people_links;

CREATE POLICY "Authenticated users can read project_people_links" 
ON public.project_people_links 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert project_people_links" 
ON public.project_people_links 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_people_links" 
ON public.project_people_links 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project_people_links" 
ON public.project_people_links 
FOR DELETE 
TO authenticated
USING (true);