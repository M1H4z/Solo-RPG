-- Migration: add_delete_policy_active_gates

-- Allow authenticated users to delete an active gate record
-- only if the hunter_id associated with the gate belongs to them.
CREATE POLICY "Allow owner DELETE" ON public.active_gates
    FOR DELETE
    USING (
        auth.uid() = (SELECT user_id FROM public.hunters WHERE id = active_gates.hunter_id)
    );
