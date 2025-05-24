"use client";

import React, { useState } from 'react';
import { OnlinePlayer } from '@/hooks/usePlayerPresence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { classIcons } from '@/constants/icons';
import { HunterClass } from '@/constants/classes';
import { Users, MessageCircle, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlinePlayersPanelProps {
  players: OnlinePlayer[];
  isConnected: boolean;
  location: string;
  className?: string;
  error?: string | null;
}

const OnlinePlayersPanel: React.FC<OnlinePlayersPanelProps> = ({
  players,
  isConnected,
  location,
  className,
  error
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<OnlinePlayer | null>(null);

  const locationPlayers = players.filter(player => player.location === location);
  const otherPlayers = players.filter(player => player.location !== location);

  const handlePlayerClick = (player: OnlinePlayer) => {
    setSelectedPlayer(selectedPlayer?.hunterId === player.hunterId ? null : player);
  };

  const handleSendMessage = (player: OnlinePlayer) => {
    // TODO: Implement messaging system
    console.log('Send message to:', player.hunterName);
  };

  const handleAddFriend = (player: OnlinePlayer) => {
    // TODO: Implement friend system
    console.log('Add friend:', player.hunterName);
  };

  const getRankColor = (rank: string) => {
    switch (rank.toUpperCase()) {
      case 'E': return 'text-gray-400';
      case 'D': return 'text-blue-400';
      case 'C': return 'text-green-400';
      case 'B': return 'text-purple-400';
      case 'A': return 'text-yellow-400';
      case 'S': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const PlayerItem: React.FC<{ player: OnlinePlayer; isSelected: boolean }> = ({ player, isSelected }) => (
    <div 
      className={cn(
        "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
        isSelected ? "bg-primary/20 border border-primary/30" : "hover:bg-background-secondary/50"
      )}
      onClick={() => handlePlayerClick(player)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg flex-shrink-0">
          {classIcons[player.class as HunterClass]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {player.hunterName}
          </p>
          <p className="text-xs text-text-secondary">
            Lv.{player.level} {player.class} <span className={getRankColor(player.rank)}>({player.rank})</span>
          </p>
        </div>
        {player.location !== location && (
          <span className="text-xs text-text-secondary bg-background-secondary px-1 rounded">
            {player.location}
          </span>
        )}
      </div>
      
      {isSelected && (
        <div className="flex gap-1 ml-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleSendMessage(player);
            }}
            className="h-6 w-6 p-0"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleAddFriend(player);
            }}
            className="h-6 w-6 p-0"
          >
            <UserPlus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Online Players</span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {error ? (
          <div className="text-sm text-danger">
            <p className="font-medium">Connection Error</p>
            <p className="text-xs text-text-secondary">{error}</p>
          </div>
        ) : !isConnected ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="italic">Connecting to presence system...</span>
          </div>
        ) : players.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="italic">No other players online</span>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Current location players */}
            {locationPlayers.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
                  In {location} ({locationPlayers.length})
                </h4>
                <div className="space-y-1">
                  {locationPlayers.slice(0, isExpanded ? undefined : 3).map((player) => (
                    <PlayerItem 
                      key={player.hunterId} 
                      player={player} 
                      isSelected={selectedPlayer?.hunterId === player.hunterId}
                    />
                  ))}
                  {!isExpanded && locationPlayers.length > 3 && (
                    <p className="text-xs text-text-secondary text-center py-1">
                      +{locationPlayers.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Other location players */}
            {otherPlayers.length > 0 && isExpanded && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
                  Elsewhere ({otherPlayers.length})
                </h4>
                <div className="space-y-1">
                  {otherPlayers.map((player) => (
                    <PlayerItem 
                      key={player.hunterId} 
                      player={player} 
                      isSelected={selectedPlayer?.hunterId === player.hunterId}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Summary when collapsed */}
            {!isExpanded && otherPlayers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-text-secondary text-center">
                  {otherPlayers.length} player{otherPlayers.length !== 1 ? 's' : ''} in other areas
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnlinePlayersPanel; 