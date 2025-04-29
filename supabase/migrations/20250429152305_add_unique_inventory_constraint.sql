-- Add a partial unique index to prevent duplicate unequipped items per hunter
CREATE UNIQUE INDEX unique_unequipped_item_per_hunter_idx -- Index names often end with _idx
ON public.hunter_inventory_items (hunter_id, item_id)
WHERE (equipped_slot IS NULL);
