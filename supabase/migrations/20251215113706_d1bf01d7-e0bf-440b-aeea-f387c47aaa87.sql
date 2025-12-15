-- Make the knowledge bucket public so file URLs are accessible
UPDATE storage.buckets 
SET public = true 
WHERE id = 'knowledge';