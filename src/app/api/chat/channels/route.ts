import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/services/authService';
import { Database } from '@/lib/supabase/database.types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    // Use the correct authentication method
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseRouteHandlerClient();

    // Get channels user has access to (participants only for non-global channels)
    const { data: userChannels, error: userChannelsError } = await supabase
      .from('chat_channels')
      .select(`
        *,
        chat_participants!left (
          user_id,
          is_muted,
          last_read_at
        )
      `)
      .eq('is_active', true)
      .or(`type.eq.global,chat_participants.user_id.eq.${user.id}`);

    if (userChannelsError) {
      console.error('Error fetching user channels:', userChannelsError);
    }

    // Ensure we have at least the global channel
    const { data: globalChannels, error: globalError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('type', 'global')
      .eq('is_active', true);

    if (globalError) {
      console.error('Error fetching global channels:', globalError);
    }

    // Combine channels, ensuring global channels are always included
    const allChannels = [...(globalChannels || [])];
    
    if (userChannels) {
      userChannels.forEach(channel => {
        if (!allChannels.find(ch => ch.id === channel.id)) {
          allChannels.push(channel);
        }
      });
    }

    // Get unread message counts for each channel
    const channelIds = allChannels.map(ch => ch.id);
    const unreadCounts: Record<string, number> = {};

    if (channelIds.length > 0) {
      for (const channelId of channelIds) {
        const participant = allChannels.find(ch => ch.id === channelId)?.chat_participants?.[0];
        const lastReadAt = participant?.last_read_at || new Date().toISOString();

        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channelId)
          .eq('is_deleted', false)
          .gte('created_at', lastReadAt);

        unreadCounts[channelId] = count || 0;
      }
    }

    return NextResponse.json({ 
      channels: allChannels.map(ch => ({
        ...ch,
        chat_participants: undefined // Remove from response
      })),
      unreadCounts
    });

  } catch (error) {
    console.error('Error in chat channels GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, location, description, max_participants } = body;

    if (!name?.trim() || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Use the correct authentication method
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseRouteHandlerClient();

    // Create the channel
    const { data: channel, error } = await supabase
      .from('chat_channels')
      .insert({
        name: name.trim(),
        type,
        location,
        description: description?.trim(),
        max_participants,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    // Get user's current hunter
    const { data: hunter } = await supabase
      .from('hunters')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Add creator as participant
    await supabase
      .from('chat_participants')
      .insert({
        channel_id: channel.id,
        user_id: user.id,
        hunter_id: hunter?.id
      });

    return NextResponse.json({ channel });

  } catch (error) {
    console.error('Error in chat channels POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 