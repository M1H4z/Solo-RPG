-- supabase/migrations/20250429150856_fix_purchase_item_conflict_v2.sql

CREATE OR REPLACE FUNCTION public.purchase_item(
    p_hunter_id UUID,
    p_item_id TEXT,
    p_user_id UUID,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_hunter RECORD;
    v_gold_cost INTEGER;
    v_diamond_cost INTEGER;
    v_currency_type TEXT;
    v_total_cost INTEGER;
    v_new_balance INTEGER;
    v_inventory_entry RECORD;
BEGIN
    -- 1. Validate Inputs
    IF p_quantity <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Quantity must be positive.');
    END IF;

    -- 2. Fetch Item Details
    SELECT * INTO v_item
    FROM public.items
    WHERE id = p_item_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found.');
    END IF;

    IF NOT v_item.is_purchasable THEN
        RETURN json_build_object('success', false, 'error', 'Item is not available for purchase.');
    END IF;

    -- 3. Fetch Hunter Details and Authorize
    SELECT * INTO v_hunter
    FROM public.hunters
    WHERE id = p_hunter_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Hunter not found.');
    END IF;

    IF v_hunter.user_id != p_user_id THEN
       RETURN json_build_object('success', false, 'error', 'Unauthorized: You do not own this hunter.');
    END IF;

    -- 4. Check Requirements
    IF v_hunter.level < v_item.level_requirement THEN
        RETURN json_build_object('success', false, 'error', 'Level requirement not met.');
    END IF;

    IF v_item.class_requirement IS NOT NULL AND array_length(v_item.class_requirement, 1) > 0 AND NOT (v_hunter.class = ANY(v_item.class_requirement)) THEN
         RETURN json_build_object('success', false, 'error', 'Class requirement not met.');
    END IF;

    -- 5. Determine Cost and Check Funds
    v_gold_cost := v_item.gold_cost;
    v_diamond_cost := v_item.diamond_cost;

    IF v_gold_cost IS NOT NULL THEN
        v_currency_type := 'gold';
        v_total_cost := v_gold_cost * p_quantity;
        IF v_hunter.gold < v_total_cost THEN
            RETURN json_build_object('success', false, 'error', 'Insufficient Gold.');
        END IF;
    ELSIF v_diamond_cost IS NOT NULL THEN
        v_currency_type := 'diamond';
        v_total_cost := v_diamond_cost * p_quantity;
         IF v_hunter.diamonds < v_total_cost THEN
            RETURN json_build_object('success', false, 'error', 'Insufficient Diamonds.');
        END IF;
    ELSE
        RETURN json_build_object('success', false, 'error', 'Item has no valid cost.');
    END IF;

    -- 6. Perform Purchase Operations
    --  a. Decrement Currency
    IF v_currency_type = 'gold' THEN
        UPDATE public.hunters
        SET gold = gold - v_total_cost, updated_at = now()
        WHERE id = p_hunter_id
        RETURNING gold INTO v_new_balance;
    ELSE
        UPDATE public.hunters
        SET diamonds = diamonds - v_total_cost, updated_at = now()
        WHERE id = p_hunter_id
        RETURNING diamonds INTO v_new_balance;
    END IF;

    --  b. Add to Inventory (Upsert Logic for Stackable Items)
    IF v_item.stackable THEN
        INSERT INTO public.hunter_inventory_items (hunter_id, item_id, quantity, created_at, updated_at)
        VALUES (p_hunter_id, p_item_id, p_quantity, now(), now())
        ON CONFLICT (hunter_id, item_id) WHERE equipped_slot IS NULL -- Explicitly target the partial index predicate
        DO UPDATE SET
            quantity = hunter_inventory_items.quantity + EXCLUDED.quantity,
            updated_at = now()
        RETURNING * INTO v_inventory_entry;

        -- If the conflict didn't happen or the UPDATE didn't affect rows (e.g., only equipped item exists),
        -- we still need to insert a new row for the unequipped stack.
        IF NOT FOUND THEN
             INSERT INTO public.hunter_inventory_items (hunter_id, item_id, quantity, created_at, updated_at)
             VALUES (p_hunter_id, p_item_id, p_quantity, now(), now())
             RETURNING * INTO v_inventory_entry;
        END IF;

    ELSE -- Not stackable
        FOR i IN 1..p_quantity LOOP
             INSERT INTO public.hunter_inventory_items (hunter_id, item_id, quantity, created_at, updated_at)
             VALUES (p_hunter_id, p_item_id, 1, now(), now())
             RETURNING * INTO v_inventory_entry;
        END LOOP;
    END IF;

    --  c. Log Currency Transaction
    INSERT INTO public.currency_transactions (hunter_id, currency_type, amount_change, new_balance, source, source_details)
    VALUES (
        p_hunter_id,
        v_currency_type::public.currency_enum,
        -v_total_cost,
        v_new_balance,
        'shop_purchase',
        jsonb_build_object('itemId', p_item_id, 'itemName', v_item.name, 'quantity', p_quantity)
    );

    -- 7. Return Success
    RETURN json_build_object(
        'success', true,
        'message', 'Purchase successful!',
        'currencyType', v_currency_type,
        'cost', v_total_cost,
        'newBalance', v_new_balance,
        'inventoryItemId', v_inventory_entry.instance_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in purchase_item function: %', SQLERRM;
        RETURN json_build_object('success', false, 'error', 'An unexpected database error occurred during purchase: ' || SQLERRM);

END;
$$;
