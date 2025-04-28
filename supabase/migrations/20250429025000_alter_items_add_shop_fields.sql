-- supabase/migrations/<TIMESTAMP>_alter_items_add_shop_fields.sql

-- Add new columns required for shop and detailed item properties
ALTER TABLE public.items
ADD COLUMN effects JSONB,
ADD COLUMN gold_cost INTEGER CHECK (gold_cost IS NULL OR gold_cost >= 0),
ADD COLUMN diamond_cost INTEGER CHECK (diamond_cost IS NULL OR diamond_cost >= 0),
ADD COLUMN level_requirement INTEGER NOT NULL DEFAULT 0 CHECK (level_requirement >= 0),
ADD COLUMN class_requirement TEXT[], -- Array of class names, NULL means usable by all
ADD COLUMN max_stack INTEGER NOT NULL DEFAULT 1 CHECK (max_stack >= 1),
ADD COLUMN is_purchasable BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN is_event_item BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN updated_at TIMESTAMPTZ; -- Add updated_at column

-- Add comments for new columns
COMMENT ON COLUMN public.items.effects IS 'JSON object defining effects when used (consumables) or special passive effects.';
COMMENT ON COLUMN public.items.gold_cost IS 'Cost in Gold to purchase from the shop. NULL if not purchasable with Gold.';
COMMENT ON COLUMN public.items.diamond_cost IS 'Cost in Diamonds to purchase from the shop. NULL if not purchasable with Diamonds.';
COMMENT ON COLUMN public.items.level_requirement IS 'Minimum hunter level required to use/equip this item.';
COMMENT ON COLUMN public.items.class_requirement IS 'Array of hunter classes that can use/equip this item. NULL means usable by all.';
COMMENT ON COLUMN public.items.max_stack IS 'Maximum number of items per stack if stackable is true.';
COMMENT ON COLUMN public.items.is_purchasable IS 'Indicates if the item is available for purchase in the standard game shop.';
COMMENT ON COLUMN public.items.is_event_item IS 'Indicates if this is a limited time or event-specific item.';
COMMENT ON COLUMN public.items.updated_at IS 'Timestamp of the last update to the item definition.';

-- Set initial updated_at for existing rows (optional but good practice)
UPDATE public.items SET updated_at = created_at WHERE updated_at IS NULL;

-- Add NOT NULL constraint after backfilling
ALTER TABLE public.items ALTER COLUMN updated_at SET NOT NULL;

-- ** FIX: Ensure existing rows comply with the upcoming constraint **
-- For any existing items that are now marked as purchasable (due to the default)
-- but have no cost yet, set a default gold cost of 0.
-- You should review these items in Supabase Studio later and set actual costs.
UPDATE public.items
SET gold_cost = 0
WHERE is_purchasable = true AND gold_cost IS NULL AND diamond_cost IS NULL;

-- Add CHECK constraint to ensure items have a cost if they are purchasable
-- (Relaxing the previous constraint slightly - allows non-purchasable items to have no cost)
ALTER TABLE public.items
ADD CONSTRAINT check_purchasable_cost CHECK (is_purchasable = false OR gold_cost IS NOT NULL OR diamond_cost IS NOT NULL);

-- Add index for purchasable flag
CREATE INDEX IF NOT EXISTS idx_items_is_purchasable ON public.items(is_purchasable); -- Use IF NOT EXISTS just in case

-- Assuming the trigger function 'update_updated_at_column' might already exist from other tables
-- Create it if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or Replace the trigger for the items table
DROP TRIGGER IF EXISTS update_items_updated_at ON public.items; -- Drop if exists to avoid errors
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies (Review and potentially adjust existing ones if needed)
-- Assuming RLS is already enabled. If not: ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Example: Update existing read policy or add a new one for authenticated users to see purchasable items
DROP POLICY IF EXISTS "Allow authenticated read access to purchasable items" ON public.items; -- Drop old one if it exists by this name
CREATE POLICY "Allow read access to purchasable items"
ON public.items
FOR SELECT
TO authenticated
USING (is_purchasable = true); -- Allow reading only purchasable items by default

-- Example: Ensure service role still has full access (adjust policy name if needed)
DROP POLICY IF EXISTS "Allow full access for service role" ON public.items; -- Drop old one if it exists by this name
CREATE POLICY "Allow full backend access"
ON public.items
FOR ALL
-- USING (true) -- Or use a specific role check: USING (get_my_claim('role') = '"service_role"')
USING (true) -- Keep it simple for now
WITH CHECK (true); 