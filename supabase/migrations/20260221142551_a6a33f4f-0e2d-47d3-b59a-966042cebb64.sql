
-- 1. Make task-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'task-photos';

-- 2. Drop overly permissive SELECT policy on storage objects
DROP POLICY IF EXISTS "Anyone can view task photos" ON storage.objects;

-- 3. Add authenticated family-based SELECT policy for task photos
CREATE POLICY "Authenticated users can view task photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-photos' AND
  auth.role() = 'authenticated'
);

-- 4. Add DELETE policy on redemptions for family owners
CREATE POLICY "Parents can delete redemptions"
ON public.redemptions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM children c
    JOIN families f ON f.id = c.family_id
    WHERE c.id = redemptions.child_id
    AND f.owner_id = auth.uid()
  )
);
