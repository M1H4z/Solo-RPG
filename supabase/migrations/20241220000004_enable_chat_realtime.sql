-- Enable Realtime for Chat Tables
-- This is required for postgres_changes subscriptions to work

-- Enable realtime for chat_channels table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;

-- Enable realtime for chat_messages table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable realtime for chat_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants; 