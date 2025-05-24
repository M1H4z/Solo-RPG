import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/services/authService';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseRouteHandlerClient();

    // Check user's hunter
    const { data: hunter } = await supabase
      .from('hunters')
      .select('id, name, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check available channels
    const { data: allChannels } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('is_active', true);

    // Check user's participations
    const { data: participations } = await supabase
      .from('chat_participants')
      .select('*, chat_channels(*)')
      .eq('user_id', user.id);

    // Check messages in global channel
    const globalChannel = allChannels?.find(ch => ch.type === 'global');
    let globalMessages = [];
    if (globalChannel) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', globalChannel.id)
        .order('created_at', { ascending: false })
        .limit(10);
      globalMessages = messages || [];
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      hunter,
      allChannels,
      participations,
      globalChannel,
      globalMessages: globalMessages.length,
      globalMessagesDetail: globalMessages
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 