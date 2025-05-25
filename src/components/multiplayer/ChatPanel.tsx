"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { usePlayerPresence } from '@/hooks/usePlayerPresence';
import { ChatPanelProps, ChatMessage, MessageType } from '@/types/chat.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { classIcons } from '@/constants/icons';
import { HunterClass } from '@/constants/classes';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Hash, 
  Globe, 
  MapPin, 
  Minimize2, 
  Maximize2,
  ChevronDown,
  ChevronUp,
  Settings,
  UserPlus,
  Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ChatPanel: React.FC<ChatPanelProps> = ({
  currentHunter,
  location = 'hub',
  className,
  defaultChannel = 'global',
  isMinimized = false,
  onMinimize,
  showChannelList = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showChannels, setShowChannels] = useState(showChannelList);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    channels,
    activeChannel,
    messages,
    isConnected,
    isLoading,
    error,
    totalUnreadCount,
    setActiveChannel,
    sendMessage
  } = useChat(currentHunter, location);

  const { onlinePlayers } = usePlayerPresence(currentHunter, location);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select default channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const defaultCh = channels.find(ch => 
        defaultChannel === 'global' ? ch.type === 'global' : ch.location === location
      ) || channels[0];
      setActiveChannel(defaultCh.id);
    }
  }, [channels, activeChannel, defaultChannel, location, setActiveChannel]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeChannel) return;

    try {
      await sendMessage(inputValue, 'text', replyTo?.id);
      setInputValue('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getChannelIcon = (type: string, location?: string) => {
    switch (type) {
      case 'global': return <Globe className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'direct': return <Users className="w-4 h-4" />;
      case 'party': return <UserPlus className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank?.toLowerCase()) {
      case 's': return 'text-accent';
      case 'a': return 'text-purple-400';
      case 'b': return 'text-blue-400';
      case 'c': return 'text-green-400';
      case 'd': return 'text-yellow-400';
      case 'e': return 'text-gray-400';
      default: return 'text-text-secondary';
    }
  };

  const getClassIcon = (hunterClass: string) => {
    return classIcons[hunterClass as HunterClass] || classIcons.Fighter;
  };

  if (!currentHunter) {
    return (
      <Card className={cn("w-80 h-96", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-text-secondary">Please select a hunter to use chat</p>
        </CardContent>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <div className={cn("fixed bottom-4 left-4 z-50", className)}>
        <Button
          onClick={onMinimize}
          className="relative"
          size="lg"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Chat
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      "w-full max-w-sm sm:w-96 h-64 sm:h-64 md:h-72 flex flex-col bg-surface/95 backdrop-blur-sm border-border/50",
      "mx-2 sm:mx-0", // Add margin on mobile, remove on larger screens
      className
    )}>
      {/* Simple Header with Tabs */}
      <div className="flex items-center border-b border-border/30 bg-surface/50 rounded-t-lg overflow-hidden">
        {channels.map((channel, index) => (
          <button
            key={channel.id}
            onClick={() => setActiveChannel(channel.id)}
            className={cn(
              "px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-r border-border/30 last:border-r-0 relative flex-1 sm:flex-none",
              index === 0 && "rounded-tl-lg",
              activeChannel?.id === channel.id 
                ? "bg-accent text-accent-foreground" 
                : "text-text-secondary hover:text-text-primary hover:bg-surface/70"
            )}
          >
            <span className="truncate">
              {channel.type === 'global' ? 'Global' : 
               channel.type === 'location' ? channel.location : 
               channel.name}
            </span>
          </button>
        ))}
        
        {/* Online Players Count */}
        <div className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs text-text-secondary">
          <Users className="w-3 h-3" />
          <span>{onlinePlayers.length}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
        </div>
        
        {/* Minimize button */}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="ml-auto p-1 sm:p-2 text-text-secondary hover:text-text-primary rounded-tr-lg"
          >
            <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              No messages yet
            </div>
          ) : (
            <div className="space-y-1 p-1 sm:p-2">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-1 sm:gap-2 hover:bg-surface/30 p-1 rounded">
                  {/* Avatar/Icon */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center">
                    {message.sender_class ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5">
                        {getClassIcon(message.sender_class)}
                      </div>
                    ) : (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">?</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span className={cn(
                        "font-medium text-xs sm:text-sm truncate max-w-24 sm:max-w-none",
                        getRankColor(message.sender_rank || '')
                      )}>
                        {message.sender_name || 'Unknown Player'}
                      </span>
                      <span className="text-xs text-text-disabled">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-text-primary break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/30 p-1 sm:p-2 bg-surface/30">
        <div className="flex gap-1 sm:gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type here..."
            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-background border border-border/50 rounded text-xs sm:text-sm focus:outline-none focus:border-accent"
            maxLength={1000}
            disabled={!isConnected || !activeChannel}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected || !activeChannel}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-50"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ChatPanel; 