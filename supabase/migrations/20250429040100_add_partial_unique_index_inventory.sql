-- supabase/migrations/<TIMESTAMP>_add_partial_unique_index_inventory.sql

-- Drop the old potentially incorrect unique constraint if it exists
ALTER TABLE public.hunter_inventory_items
DROP CONSTRAINT IF EXISTS unique_hunter_item_slot;

-- Add a partial unique index to ensure only one row exists per item per hunter
-- for items that are NOT equipped (i.e., in the general inventory stack).
-- This allows the ON CONFLICT (hunter_id, item_id) WHERE equipped_slot IS NULL clause to work.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_unequipped_item
ON public.hunter_inventory_items (hunter_id, item_id)
WHERE equipped_slot IS NULL;

COMMENT ON INDEX public.idx_unique_unequipped_item IS 'Ensures unique hunter/item combinations for unequipped inventory slots, allowing stacking.'; 