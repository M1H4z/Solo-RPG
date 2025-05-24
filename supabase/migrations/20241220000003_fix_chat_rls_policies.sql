-- Fix RLS policies for chat system
-- Allow all authenticated users to view global channels and messages

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view active channels they participate in" ON public.chat_channels;
DROP POLICY IF EXISTS "Users can view messages in channels they participate in" ON public.chat_messages;

-- Create improved policies for chat_channels
CREATE POLICY "Users can view global channels or channels they participate in" ON public.chat_channels
  FOR SELECT 
  USING (
    is_active = true AND (
      type = 'global' OR 
      EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE channel_id = chat_channels.id AND user_id = auth.uid()
      )
    )
  );

-- Create improved policies for chat_messages  
CREATE POLICY "Users can view global messages or messages in channels they participate in" ON public.chat_messages
  FOR SELECT 
  USING (
    is_deleted = false AND (
      EXISTS (
        SELECT 1 FROM public.chat_channels 
        WHERE id = chat_messages.channel_id AND type = 'global' AND is_active = true
      ) OR 
      EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid()
      )
    )
  );

-- Update message insert policy to allow global channel posting
DROP POLICY IF EXISTS "Users can send messages to channels they participate in" ON public.chat_messages;

CREATE POLICY "Users can send messages to global channels or channels they participate in" ON public.chat_messages
  FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND 
    (
      EXISTS (
        SELECT 1 FROM public.chat_channels 
        WHERE id = chat_messages.channel_id AND type = 'global' AND is_active = true
      ) OR 
      EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid()
      )
    )
  ); 