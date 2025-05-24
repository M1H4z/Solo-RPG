-- Migration: Add Chat System Tables
-- Created: 2024-01-XX

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_participants CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS get_or_create_location_channel(TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_join_global_channel() CASCADE;
DROP FUNCTION IF EXISTS create_global_chat_channel() CASCADE;

-- Create chat_channels table
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('global', 'location', 'direct', 'party')),
  location VARCHAR(50), -- For location-based channels
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT NULL,
  description TEXT,
  
  -- Unique constraint for global channels and location channels
  UNIQUE(type, location)
);

-- Create chat_participants table (for tracking who's in which channels)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hunter_id UUID REFERENCES public.hunters(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT false,
  
  -- One user per channel
  UNIQUE(channel_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hunter_id UUID REFERENCES public.hunters(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'emote', 'trade', 'party_invite')),
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  -- Constraints
  CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_channels_type_location ON public.chat_channels(type, location);
CREATE INDEX IF NOT EXISTS idx_chat_participants_channel ON public.chat_participants(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);

-- Create RLS policies for chat_channels
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active channels they participate in" ON public.chat_channels
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

CREATE POLICY "Users can create channels" ON public.chat_channels
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for chat_participants
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participations" ON public.chat_participants
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can join channels" ON public.chat_participants
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave channels" ON public.chat_participants
  FOR DELETE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON public.chat_participants
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create RLS policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in channels they participate in" ON public.chat_messages
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM public.chat_channels 
      WHERE id = chat_messages.channel_id AND type = 'global'
    )
  );

CREATE POLICY "Users can send messages to channels they participate in" ON public.chat_messages
  FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND 
    (
      EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid()
      ) OR 
      EXISTS (
        SELECT 1 FROM public.chat_channels 
        WHERE id = chat_messages.channel_id AND type = 'global'
      )
    )
  );

CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE 
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.chat_messages
  FOR DELETE 
  USING (sender_id = auth.uid());

-- Create function to automatically create global channel
CREATE OR REPLACE FUNCTION create_global_chat_channel()
RETURNS void AS $$
BEGIN
  INSERT INTO public.chat_channels (name, type, description)
  VALUES ('Global Chat', 'global', 'Global chat channel for all players')
  ON CONFLICT (type, location) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-join users to global channel
CREATE OR REPLACE FUNCTION auto_join_global_channel()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the current hunter for this user
  INSERT INTO public.chat_participants (channel_id, user_id, hunter_id)
  SELECT 
    c.id,
    NEW.user_id,
    h.id
  FROM public.chat_channels c
  LEFT JOIN public.hunters h ON h.user_id = NEW.user_id 
  WHERE c.type = 'global'
  ON CONFLICT (channel_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-join global channel when user creates a hunter
CREATE TRIGGER trigger_auto_join_global_channel
  AFTER INSERT ON public.hunters
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_global_channel();

-- Create function to create location-based channels
CREATE OR REPLACE FUNCTION get_or_create_location_channel(location_name TEXT)
RETURNS UUID AS $$
DECLARE
  channel_id UUID;
BEGIN
  -- Try to get existing location channel
  SELECT id INTO channel_id
  FROM public.chat_channels
  WHERE type = 'location' AND location = location_name AND is_active = true;
  
  -- If not found, create it
  IF channel_id IS NULL THEN
    INSERT INTO public.chat_channels (name, type, location, description)
    VALUES (
      location_name || ' Chat', 
      'location', 
      location_name, 
      'Location-based chat for ' || location_name
    )
    RETURNING id INTO channel_id;
  END IF;
  
  RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- Initialize global channel
SELECT create_global_chat_channel();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 