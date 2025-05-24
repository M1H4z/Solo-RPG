export type MessageType = 'text' | 'system' | 'emote' | 'trade' | 'party_invite';

export type ChannelType = 'global' | 'location' | 'direct' | 'party';

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  hunter_id?: string;
  content: string;
  message_type: MessageType;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  edited_at?: string;
  
  // Joined data from hunters table
  sender_name?: string;
  sender_level?: number;
  sender_class?: string;
  sender_rank?: string;
  
  // Reply-to message data
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
    sender_name?: string;
    sender_level?: number;
    sender_class?: string;
    sender_rank?: string;
  };
}

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  location?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  max_participants?: number;
}

export interface ChatParticipant {
  id: string;
  channel_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  role: 'member' | 'moderator' | 'admin';
}

export interface ChatState {
  channels: ChatChannel[];
  messages: Record<string, ChatMessage[]>;
  participants: Record<string, ChatParticipant[]>;
  isConnected: boolean;
  isLoading: boolean;
  unreadCounts: Record<string, number>;
  error?: string;
}

export interface SendMessagePayload {
  channel_id: string;
  content: string;
  message_type: MessageType;
  reply_to_id?: string;
  hunter_id: string;
}

export interface CreateChannelPayload {
  name: string;
  type: ChannelType;
  location?: string;
  description?: string;
  max_participants?: number;
}

export interface UseChatReturn {
  // State
  channels: ChatChannel[];
  activeChannel?: ChatChannel;
  messages: ChatMessage[];
  participants: ChatParticipant[];
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
  unreadCount: number;
  totalUnreadCount: number;

  // Actions
  setActiveChannel: (channelId: string) => void;
  sendMessage: (content: string, messageType?: MessageType, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  createChannel: (payload: CreateChannelPayload) => Promise<ChatChannel>;
  markAsRead: (channelId: string) => Promise<void>;
  toggleMute: (channelId: string) => Promise<void>;
}

export interface ChatPanelProps {
  currentHunter: {
    id: string;
    userId: string;
    name: string;
    level: number;
    class: string;
    rank: string;
  } | null;
  location?: string;
  className?: string;
  defaultChannel?: 'global' | string;
  isMinimized?: boolean;
  onMinimize?: () => void;
  showChannelList?: boolean;
} 