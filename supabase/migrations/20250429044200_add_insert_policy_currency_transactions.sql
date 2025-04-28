-- supabase/migrations/<TIMESTAMP>_add_insert_policy_currency_transactions.sql

-- Add a policy to allow INSERT operations on currency_transactions.
-- Since inserts should only happen via SECURITY DEFINER functions (adjust_gold, adjust_diamonds, purchase_item),
-- we can create a permissive policy. The functions themselves handle auth and logic.
-- If more granular control is needed later, this policy could target specific roles (e.g., service_role).
CREATE POLICY "Allow inserts via backend functions"
ON public.currency_transactions
FOR INSERT
WITH CHECK (true); -- Allows insert for any role passing the check (always true) 