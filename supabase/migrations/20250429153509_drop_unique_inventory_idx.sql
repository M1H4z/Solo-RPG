-- Drop the partial unique index that conflicts with allowing duplicate non-stackable items
DROP INDEX IF EXISTS public.unique_unequipped_item_per_hunter_idx; 