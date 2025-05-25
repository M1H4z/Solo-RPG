import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/services/authService';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseRouteHandlerClient();

    // Get raw messages data
    const { data: rawMessages, error: rawError } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get messages with hunter join
    const { data: joinedMessages, error: joinError } = await supabase
      .from('chat_messages')
      .select(`
        *,
        hunters:hunter_id (
          name,
          level,
          class,
          rank
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get hunters data
    const { data: hunters, error: huntersError } = await supabase
      .from('hunters')
      .select('id, name, level, class, rank, user_id')
      .limit(10);

    return NextResponse.json({
      rawMessages,
      rawError,
      joinedMessages,
      joinError,
      hunters,
      huntersError,
      currentUserId: user.id
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
} 