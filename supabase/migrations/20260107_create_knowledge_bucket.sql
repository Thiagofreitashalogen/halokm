-- Create the knowledge storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge', 'knowledge', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the knowledge bucket
CREATE POLICY "Halogen users can upload to knowledge bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge' AND
  (auth.jwt() ->> 'email' LIKE '%@halogen.no')
);

CREATE POLICY "Halogen users can read from knowledge bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge' AND
  (auth.jwt() ->> 'email' LIKE '%@halogen.no')
);

CREATE POLICY "Halogen users can update knowledge bucket files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'knowledge' AND
  (auth.jwt() ->> 'email' LIKE '%@halogen.no')
);

CREATE POLICY "Halogen users can delete from knowledge bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge' AND
  (auth.jwt() ->> 'email' LIKE '%@halogen.no')
);

-- Allow public access for reading (since the bucket is public)
CREATE POLICY "Public can read knowledge bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'knowledge');
