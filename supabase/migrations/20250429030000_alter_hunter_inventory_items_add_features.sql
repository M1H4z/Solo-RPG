-- supabase/migrations/<TIMESTAMP>_alter_hunter_inventory_items_add_features.sql

-- Add equipped_slot column
ALTER TABLE public.hunter_inventory_items
ADD COLUMN equipped_slot TEXT CHECK (equipped_slot IN ('Head', 'Chest', 'Legs', 'Feet', 'Hands', 'Main Hand', 'Off Hand', 'Accessory1', 'Accessory2'));

COMMENT ON COLUMN public.hunter_inventory_items.equipped_slot IS 'Specifies which equipment slot the item is currently in, if any. Null means it is in the general inventory. Accessory1/2 for distinct accessory slots.';

-- Add updated_at column
ALTER TABLE public.hunter_inventory_items
ADD COLUMN updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.hunter_inventory_items.updated_at IS 'Timestamp of the last update to this inventory entry.';

-- Backfill updated_at and set NOT NULL
UPDATE public.hunter_inventory_items SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE public.hunter_inventory_items ALTER COLUMN updated_at SET NOT NULL;

-- Add CHECK constraint for quantity
ALTER TABLE public.hunter_inventory_items
ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);

-- Add/Update Foreign Key constraints
-- Drop existing FKs if they exist without the desired ON DELETE behavior or type mismatch

-- Assuming items.id is UUID. If it's TEXT, change REFERENCES accordingly.
-- !! COMMENTING OUT due to items.id being TEXT !!
-- ALTER TABLE public.hunter_inventory_items
-- DROP CONSTRAINT IF EXISTS hunter_inventory_items_item_id_fkey, -- Drop if exists
-- ADD CONSTRAINT hunter_inventory_items_item_id_fkey
-- FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT; -- Prevent deleting item definition if in inventory

-- Assuming hunters.id is UUID.
ALTER TABLE public.hunter_inventory_items
DROP CONSTRAINT IF EXISTS hunter_inventory_items_hunter_id_fkey, -- Drop if exists
ADD CONSTRAINT hunter_inventory_items_hunter_id_fkey
FOREIGN KEY (hunter_id) REFERENCES public.hunters(id) ON DELETE CASCADE; -- Delete inventory item if hunter is deleted

-- Add index for equipped_slot
CREATE INDEX IF NOT EXISTS idx_inventory_items_equipped_slot ON public.hunter_inventory_items(equipped_slot);

-- Apply updated_at trigger (assuming function exists from previous migration)
DROP TRIGGER IF EXISTS update_hunter_inventory_items_updated_at ON public.hunter_inventory_items;
CREATE TRIGGER update_hunter_inventory_items_updated_at
BEFORE UPDATE ON public.hunter_inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS and add policies
ALTER TABLE public.hunter_inventory_items ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own inventory items
DROP POLICY IF EXISTS "Allow user access to their own inventory" ON public.hunter_inventory_items;
CREATE POLICY "Allow user access to their own inventory"
ON public.hunter_inventory_items
FOR ALL -- SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = (SELECT user_id FROM public.hunters WHERE id = hunter_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM public.hunters WHERE id = hunter_id));

-- Allow service role full access
DROP POLICY IF EXISTS "Allow full access for service role" ON public.hunter_inventory_items;
CREATE POLICY "Allow full backend access for inventory"
ON public.hunter_inventory_items
FOR ALL
USING (true)
WITH CHECK (true); 