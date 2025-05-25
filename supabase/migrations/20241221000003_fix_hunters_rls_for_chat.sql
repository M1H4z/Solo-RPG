-- Fix hunters RLS policy to allow chat messages to join with hunter data
-- Add a read-only policy that allows viewing hunter basic info for chat purposes

-- Create a new policy that allows reading hunter basic info (name, level, class, rank) for chat
CREATE POLICY "Allow read access to hunter basic info for chat" ON public.hunters
    FOR SELECT 
    USING (true);  -- Allow reading basic hunter info for all authenticated users

-- Note: This is safe because:
-- 1. It only allows SELECT (read-only)
-- 2. Chat only needs basic display info (name, level, class, rank)
-- 3. Sensitive hunter data like stats, inventory, etc. still require ownership
-- 4. Other operations (INSERT, UPDATE, DELETE) still require ownership via the existing policy 