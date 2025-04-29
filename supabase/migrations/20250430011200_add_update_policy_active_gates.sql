-- Policy: Allow owner UPDATE on active_gates
CREATE POLICY "Allow owner UPDATE"
ON public.active_gates
FOR UPDATE
USING (
  -- Check if the authenticated user's ID matches the user_id associated with the hunter linked to this gate
  auth.uid() = ( SELECT user_id FROM public.hunters WHERE id = hunter_id )
)
WITH CHECK (
  -- Apply the same check for rows being updated
  auth.uid() = ( SELECT user_id FROM public.hunters WHERE id = hunter_id )
); 