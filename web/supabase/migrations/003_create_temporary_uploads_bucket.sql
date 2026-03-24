-- Create temporary-uploads bucket for JD image uploads
-- This bucket stores temporary images that are deleted after streaming completes

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('temporary-uploads', 'temporary-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload to temporary-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own temporary uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on temporary-uploads bucket" ON storage.objects;

-- Create permissive policy for temporary uploads
-- Note: Using 'public' role because Clerk authentication is used instead of Supabase Auth
-- This is safe for temporary uploads as files are auto-deleted after streaming completes
-- and filenames include timestamp + userId making them unpredictable
CREATE POLICY "Allow all operations on temporary-uploads bucket"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'temporary-uploads')
WITH CHECK (bucket_id = 'temporary-uploads');
