"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  ChatChannel, 
  ChatMessage, 
  ChatParticipant, 
  ChatState, 
  UseChatReturn,
  SendMessagePayload,
  CreateChannelPayload,
  MessageType
} from '@/types/chat.types';

export const useChat = (
  currentHunter: {
    id: string;
    userId: string;
    name: string;
    level: number;
    class: string;
    rank: string;
  } | null,
  location?: string
): UseChatReturn => {
  const [state, setState] = useState<ChatState>({
    channels: [],
    messages: {},
    participants: {},
    isConnected: false,
    isLoading: true,
    unreadCounts: {}
  });

  const [activeChannelId, setActiveChannelId] = useState<string>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createSupabaseClient();
  const messageListeners = useRef<Set<string>>(new Set());

  // Cleanup function
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch (err) {
        console.warn('Error during chat cleanup:', err);
      }
      channelRef.current = null;
    }
    messageListeners.current.clear();
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // Load initial data
  const loadChannels = useCallback(async () => {
    if (!currentHunter) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      const params = new URLSearchParams();
      if (location) params.append('location', location);

      const response = await fetch(`/api/chat/channels?${params}`);
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        console.warn('Chat authentication failed - user may not be properly logged in');
        setState(prev => ({
          ...prev,
          channels: [],
          unreadCounts: {},
          isLoading: false,
          error: 'Authentication required for chat'
        }));
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load channels');
      }

      setState(prev => ({
        ...prev,
        channels: data.channels || [],
        unreadCounts: data.unreadCounts || {},
        isLoading: false
      }));

      // Auto-select first channel if none selected
      if (!activeChannelId && data.channels?.length > 0) {
        setActiveChannelId(data.channels[0].id);
      }

    } catch (error) {
      console.error('Error loading channels:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load channels',
        isLoading: false,
        channels: [], // Clear channels on error
        unreadCounts: {}
      }));
    }
  }, [currentHunter, location, activeChannelId]);

  // Load messages for a channel
  const loadMessages = useCallback(async (channelId: string, offset = 0) => {
    try {
      const params = new URLSearchParams({
        channelId,
        limit: '50',
        offset: offset.toString()
      });

      const response = await fetch(`/api/chat/messages?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load messages');
      }



      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [channelId]: offset === 0 ? data.messages : [...(prev.messages[channelId] || []), ...data.messages]
        }
      }));

      return data.hasMore;
    } catch (error) {
      console.error('Error loading messages:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      }));
      return false;
    }
  }, []);

  // Setup real-time subscriptions
  const setupRealtime = useCallback(() => {
    if (!currentHunter) return;

    cleanup();

    try {
      // Create main chat channel for real-time updates
      const channel = supabase.channel(`chat-realtime-${currentHunter.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: currentHunter.id }
        }
      });

      channelRef.current = channel;

      // Listen for new messages - simplified approach
      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, (payload) => {
          console.log('Real-time message received:', payload);
          
          // Immediately refetch messages for the affected channel
          const newMessage = payload.new as any;
          
          console.log('New message data:', {
            channel_id: newMessage.channel_id,
            sender_id: newMessage.sender_id,
            hunter_id: newMessage.hunter_id,
            content: newMessage.content
          });
          
          // Add a small delay to ensure the transaction is committed
          setTimeout(() => {
            console.log('Refetching messages for channel:', newMessage.channel_id);
            loadMessages(newMessage.channel_id, 0);
          }, 100);
        })

        .subscribe((status) => {
          setState(prev => ({
            ...prev,
            isConnected: status === 'SUBSCRIBED',
            error: status === 'CHANNEL_ERROR' ? 'Connection error' : 
                   status === 'TIMED_OUT' ? 'Connection timed out' : undefined
          }));
        });

    } catch (error) {
      console.error('Error setting up realtime:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to setup real-time connection',
        isConnected: false
      }));
    }
  }, [currentHunter, cleanup, loadMessages, supabase]);

  // Initialize
  useEffect(() => {
    if (currentHunter) {
      loadChannels();
      setupRealtime();
    } else {
      cleanup();
      setState({
        channels: [],
        messages: {},
        participants: {},
        isConnected: false,
        isLoading: false,
        unreadCounts: {}
      });
    }

    return cleanup;
  }, [currentHunter, loadChannels, setupRealtime, cleanup]);

  // Load messages when active channel changes
  useEffect(() => {
    if (activeChannelId && !state.messages[activeChannelId]) {
      loadMessages(activeChannelId);
    }
  }, [activeChannelId, state.messages, loadMessages]);

  // Actions
  const sendMessage = useCallback(async (
    content: string, 
    messageType: MessageType = 'text', 
    replyToId?: string
  ) => {
    if (!activeChannelId || !content.trim() || !currentHunter) return;

    try {
      const payload: SendMessagePayload = {
        channel_id: activeChannelId,
        content: content.trim(),
        message_type: messageType,
        reply_to_id: replyToId,
        hunter_id: currentHunter.id
      };

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Handle authentication errors specifically
      if (response.status === 401) {
        console.warn('Chat authentication failed when sending message');
        setState(prev => ({
          ...prev,
          error: 'Authentication required to send messages'
        }));
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
    }
  }, [activeChannelId, currentHunter]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    // TODO: Implement edit functionality
    console.log('Edit message:', messageId, content);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete message:', messageId);
  }, []);

  const joinChannel = useCallback(async (channelId: string) => {
    // TODO: Implement join channel functionality
    console.log('Join channel:', channelId);
  }, []);

  const leaveChannel = useCallback(async (channelId: string) => {
    // TODO: Implement leave channel functionality
    console.log('Leave channel:', channelId);
  }, []);

  const createChannel = useCallback(async (payload: CreateChannelPayload): Promise<ChatChannel> => {
    const response = await fetch('/api/chat/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create channel');
    }

    loadChannels(); // Reload channels
    return data.channel;
  }, [loadChannels]);

  const markAsRead = useCallback(async (channelId: string) => {
    // TODO: Implement mark as read functionality
    console.log('Mark as read:', channelId);
  }, []);

  const toggleMute = useCallback(async (channelId: string) => {
    // TODO: Implement toggle mute functionality
    console.log('Toggle mute:', channelId);
  }, []);

  // Computed values
  const activeChannel = state.channels.find(ch => ch.id === activeChannelId);
  const messages = activeChannelId ? state.messages[activeChannelId] || [] : [];
  const participants = activeChannelId ? state.participants[activeChannelId] || [] : [];
  const unreadCount = activeChannelId ? state.unreadCounts[activeChannelId] || 0 : 0;
  const totalUnreadCount = Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0);

  return {
    // State
    channels: state.channels,
    activeChannel,
    messages,
    participants,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    unreadCount,
    totalUnreadCount,

    // Actions
    setActiveChannel: setActiveChannelId,
    sendMessage,
    editMessage,
    deleteMessage,
    joinChannel,
    leaveChannel,
    createChannel,
    markAsRead,
    toggleMute
  };
}; 