-- supabase/migrations/20231027120000_allocate_stat_point_function.sql

CREATE OR REPLACE FUNCTION public.allocate_stat_point(
    hunter_id_in uuid,
    stat_name_in text,
    user_id_in uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Allows function to run with definer's privileges
AS $$
DECLARE
    _allowed_stats text[] := ARRAY['strength', 'agility', 'perception', 'intelligence', 'vitality'];
    _update_query text;
    _rows_affected integer;
BEGIN
    -- Validate stat name
    IF NOT (stat_name_in = ANY(_allowed_stats)) THEN
        RAISE EXCEPTION 'Invalid stat name provided: %', stat_name_in;
        -- The RAISE EXCEPTION will prevent further execution and rollback the transaction implicitly
        -- RETURN 0; -- Not strictly needed after RAISE EXCEPTION
    END IF;

    -- Construct the dynamic update query safely
    -- Use format() with %I to quote the identifier (column name)
    _update_query := format(
        'UPDATE public.hunters
         SET stat_points = stat_points - 1,
             %I = %I + 1
         WHERE id = %L AND user_id = %L AND stat_points > 0',
        stat_name_in, -- Column to increment
        stat_name_in, -- Column name again (value reference)
        hunter_id_in, -- Hunter ID
        user_id_in    -- User ID for ownership check
    );

    -- Execute the dynamic query
    EXECUTE _update_query;

    -- Check if the update affected any row
    GET DIAGNOSTICS _rows_affected = ROW_COUNT;

    -- Return 1 if update successful, 0 otherwise
    RETURN _rows_affected;

EXCEPTION
    WHEN others THEN
        -- Log the error (optional, requires specific logging setup)
        RAISE WARNING 'Error in allocate_stat_point for hunter %: %', hunter_id_in, SQLERRM;
        RETURN 0; -- Return 0 on any error during execution
END;
$$;

-- Grant execute permission to the authenticated role
-- Adjust 'authenticated' if you use a different role for logged-in users
GRANT EXECUTE ON FUNCTION public.allocate_stat_point(uuid, text, uuid) TO authenticated; 