-- supabase/migrations/20250429040101_drop_partial_unique_index_inventory.sql

-- Drop the unique index that prevents duplicate unequipped unique items
DROP INDEX IF EXISTS public.idx_unique_unequipped_item; 