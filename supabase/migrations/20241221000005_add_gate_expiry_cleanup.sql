-- Add index for efficient expired gate cleanup
-- Migration: 20241221000005_add_gate_expiry_cleanup.sql

-- Add index on expires_at for efficient expired gate queries
CREATE INDEX IF NOT EXISTS idx_active_gates_expires_at 
ON active_gates (expires_at);

-- Add composite index for hunter-specific expired gate queries
CREATE INDEX IF NOT EXISTS idx_active_gates_hunter_expires 
ON active_gates (hunter_id, expires_at);

-- Optional: Add a function to clean up all expired gates (for future cron job use)
CREATE OR REPLACE FUNCTION cleanup_expired_gates()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM active_gates 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    RAISE NOTICE 'Cleaned up % expired gates', deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (for potential future use)
GRANT EXECUTE ON FUNCTION cleanup_expired_gates() TO authenticated; 