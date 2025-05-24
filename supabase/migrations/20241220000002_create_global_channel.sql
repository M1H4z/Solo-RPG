-- Create global channel if it doesn't exist
INSERT INTO chat_channels (name, type, description, is_active, created_at, updated_at)
SELECT 'Global Chat', 'global', 'Global chat channel for all players', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM chat_channels WHERE type = 'global' AND is_active = true
); 