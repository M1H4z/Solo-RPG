import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/services/authService';
import { Database } from '@/lib/supabase/database.types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    // Use the correct authentication method
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseRouteHandlerClient();



    // Fetch messages with sender information
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        hunters:hunter_id (
          name,
          level,
          class,
          rank
        ),
        reply_to:reply_to_id (
          id,
          content,
          sender_id,
          hunters:hunter_id (
            name,
            level,
            class,
            rank
          )
        )
      `)
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }






    // For messages without hunter data, fetch it manually
    const messagesWithMissingHunters = messages?.filter(msg => 
      (!msg.hunters || !msg.hunters.name) && msg.sender_id
    ) || [];

    // Get missing hunter data (fallback for any edge cases)
    let hunterLookup: Record<string, any> = {};
    if (messagesWithMissingHunters.length > 0) {
      const senderIds = [...new Set(messagesWithMissingHunters.map(msg => msg.sender_id))];
      
      for (const senderId of senderIds) {
        const { data: hunter } = await supabase
          .from('hunters')
          .select('id, name, level, class, rank, user_id')
          .eq('user_id', senderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (hunter) {
          hunterLookup[senderId] = hunter;
        }
      }
    }



    // Transform the data to match our ChatMessage type
    const transformedMessages = messages?.map(msg => {
      // Use joined hunter data or fallback to lookup
      const hunterData = msg.hunters || hunterLookup[msg.sender_id];
      
      return {
        ...msg,
        sender_name: hunterData?.name || 'Unknown Player',
        sender_level: hunterData?.level || 1,
        sender_class: hunterData?.class || 'Fighter',
        sender_rank: hunterData?.rank || 'E',
        reply_to: msg.reply_to ? {
          ...msg.reply_to,
          sender_name: msg.reply_to.hunters?.name || hunterLookup[msg.reply_to.sender_id]?.name || 'Unknown Player',
          sender_level: msg.reply_to.hunters?.level || hunterLookup[msg.reply_to.sender_id]?.level || 1,
          sender_class: msg.reply_to.hunters?.class || hunterLookup[msg.reply_to.sender_id]?.class || 'Fighter',
          sender_rank: msg.reply_to.hunters?.rank || hunterLookup[msg.reply_to.sender_id]?.rank || 'E',
        } : undefined
      };
    }) || [];



    return NextResponse.json({ 
      messages: transformedMessages.reverse(), // Return in chronological order
      hasMore: messages?.length === limit 
    });

  } catch (error) {
    console.error('Error in chat messages GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel_id, content, message_type = 'text', reply_to_id, hunter_id } = body;

    if (!channel_id || !content?.trim()) {
      return NextResponse.json({ error: 'Channel ID and content are required' }, { status: 400 });
    }

    if (!hunter_id) {
      return NextResponse.json({ error: 'Hunter ID is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 });
    }

    // Use the correct authentication method
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseRouteHandlerClient();

    // Verify that the hunter belongs to the authenticated user
    const { data: hunter, error: hunterError } = await supabase
      .from('hunters')
      .select('id, user_id')
      .eq('id', hunter_id)
      .eq('user_id', user.id)
      .single();

    if (hunterError || !hunter) {
      return NextResponse.json({ error: 'Invalid hunter or hunter does not belong to user' }, { status: 403 });
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id,
        sender_id: user.id,
        hunter_id: hunter.id,
        content: content.trim(),
        message_type,
        reply_to_id
      })
      .select(`
        *,
        hunters:hunter_id (
          name,
          level,
          class,
          rank
        ),
        reply_to:reply_to_id (
          id,
          content,
          sender_id,
          hunters:hunter_id (
            name,
            level,
            class,
            rank
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }



    // Transform the data
    const transformedMessage = {
      ...message,
      sender_name: message.hunters?.name,
      sender_level: message.hunters?.level,
      sender_class: message.hunters?.class,
      sender_rank: message.hunters?.rank,
      reply_to: message.reply_to ? {
        ...message.reply_to,
        sender_name: message.reply_to.hunters?.name,
        sender_level: message.reply_to.hunters?.level,
        sender_class: message.reply_to.hunters?.class,
        sender_rank: message.reply_to.hunters?.rank,
      } : undefined
    };

    return NextResponse.json({ message: transformedMessage });

  } catch (error) {
    console.error('Error in chat messages POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 