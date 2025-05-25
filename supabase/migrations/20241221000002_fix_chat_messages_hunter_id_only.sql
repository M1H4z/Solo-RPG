-- Fix chat messages with NULL hunter_id
-- Set hunter_id to the user's primary hunter (latest created hunter)

UPDATE public.chat_messages 
SET hunter_id = (
  SELECT h.id 
  FROM public.hunters h 
  WHERE h.user_id = chat_messages.sender_id 
  ORDER BY h.created_at DESC 
  LIMIT 1
)
WHERE hunter_id IS NULL; 