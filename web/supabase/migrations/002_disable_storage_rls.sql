-- Create permissive policies for the resumes bucket to allow all operations
-- This effectively disables RLS for the resumes bucket while keeping it enabled globally

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Create permissive policy that allows all operations on resumes bucket
CREATE POLICY "Allow all operations on resumes bucket" ON storage.objects
FOR ALL TO public
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');