-- Add storage policies for the knowledge bucket to allow uploads
CREATE POLICY "Allow public read access to knowledge bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge');

CREATE POLICY "Allow public insert access to knowledge bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge');

CREATE POLICY "Allow public update access to knowledge bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'knowledge');

CREATE POLICY "Allow public delete access to knowledge bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge');