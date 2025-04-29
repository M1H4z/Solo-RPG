-- Migration: add_insert_policy_active_gates

-- Allow authenticated users to insert an active gate record
-- only if the hunter_id being inserted belongs to them.
CREATE POLICY "Allow owner INSERT" ON public.active_gates
    FOR INSERT
    WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.hunters WHERE id = active_gates.hunter_id)
        -- Add check for resource cost later if needed
        -- AND check_hunter_resources(hunter_id, 'locate_gate_cost')
    );
