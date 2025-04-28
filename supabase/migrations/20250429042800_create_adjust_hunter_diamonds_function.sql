-- supabase/migrations/<TIMESTAMP>_create_adjust_hunter_diamonds_function.sql

CREATE OR REPLACE FUNCTION public.adjust_hunter_diamonds(
    p_hunter_id UUID,
    p_user_id UUID,
    p_amount INTEGER -- Can be positive (add) or negative (remove)
)
RETURNS JSON -- Returns JSON indicating success, new balance, or error
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_hunter RECORD;
    v_new_balance INTEGER;
    v_abs_amount INTEGER := abs(p_amount);
    v_action TEXT := CASE WHEN p_amount >= 0 THEN 'add_test_diamonds' ELSE 'remove_test_diamonds' END;
BEGIN
    -- Fetch Hunter Details and Authorize
    SELECT * INTO v_hunter
    FROM public.hunters
    WHERE id = p_hunter_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Hunter not found.');
    END IF;

    -- Check if the requesting user owns the hunter
    IF v_hunter.user_id != p_user_id THEN
       RETURN json_build_object('success', false, 'error', 'Unauthorized: You do not own this hunter.');
    END IF;

    -- Check if removing more diamonds than available
    IF p_amount < 0 AND v_hunter.diamonds < v_abs_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient Diamonds to remove.');
    END IF;

    -- Update Hunter's Diamonds
    UPDATE public.hunters
    SET diamonds = diamonds + p_amount, updated_at = now()
    WHERE id = p_hunter_id
    RETURNING diamonds INTO v_new_balance;

     -- Log Currency Transaction
    INSERT INTO public.currency_transactions (hunter_id, currency_type, amount_change, new_balance, source, source_details)
    VALUES (
        p_hunter_id,
        'diamonds'::public.currency_enum, -- Use the enum type for diamonds
        p_amount, -- The actual change (positive or negative)
        v_new_balance,
        v_action, -- Source indicates it was a test adjustment
        jsonb_build_object('adjustedAmount', p_amount)
    );

     RETURN json_build_object(
        'success', true,
        'message', 'Diamonds adjusted successfully.',
        'newBalance', v_new_balance
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in adjust_hunter_diamonds function: %', SQLERRM;
        RETURN json_build_object('success', false, 'error', 'An unexpected database error occurred: ' || SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.adjust_hunter_diamonds(UUID, UUID, INTEGER) TO authenticated; 