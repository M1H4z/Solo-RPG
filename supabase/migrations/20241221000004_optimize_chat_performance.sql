-- Optimize chat performance for large message volumes
-- Migration: 20241221000004_optimize_chat_performance.sql

-- Add composite index for efficient message pagination and filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created 
ON chat_messages (channel_id, created_at DESC, is_deleted);

-- Add index for message counts per channel
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_count 
ON chat_messages (channel_id, is_deleted, created_at);

-- Add index for real-time message filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_realtime 
ON chat_messages (channel_id, created_at DESC) 
WHERE is_deleted = false;

-- Add index for sender lookups (for cross-user queries)
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender 
ON chat_messages (sender_id, created_at DESC);

-- Add index for hunter-based queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_hunter 
ON chat_messages (hunter_id, created_at DESC);

-- Analyze tables to update statistics
ANALYZE chat_messages;
ANALYZE chat_channels; 