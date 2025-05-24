"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Hunter } from '@/types/hunter.types';

export interface OnlinePlayer {
  hunterId: string;
  hunterName: string;
  level: number;
  class: string;
  rank: string;
  location: string;
  lastSeen: string;
  userId: string;
}

interface PresenceState {
  hunterId: string;
  hunterName: string;
  level: number;
  class: string;
  rank: string;
  location: string;
  userId: string;
}

export const usePlayerPresence = (currentHunter: Hunter | null, location: string = 'hub') => {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createSupabaseClient();

  // Cleanup function to properly dispose of the channel
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
      } catch (err) {
        console.warn('Error during channel cleanup:', err);
      }
      channelRef.current = null;
    }
    setIsConnected(false);
    setOnlinePlayers([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!currentHunter) {
      cleanup();
      return;
    }

    const setupPresence = async () => {
      try {
        setError(null);
        
        // Clean up any existing channel first
        cleanup();

        // Create a unique channel name for this location
        const channelName = `player-presence-${location}`;
        
        // Create a channel for player presence
        const channel = supabase.channel(channelName, {
          config: {
            presence: {
              key: currentHunter.id,
            },
          },
        });

        channelRef.current = channel;

        // Track presence state
        const presenceState: PresenceState = {
          hunterId: currentHunter.id,
          hunterName: currentHunter.name,
          level: currentHunter.level,
          class: currentHunter.class,
          rank: currentHunter.rank,
          location,
          userId: currentHunter.userId,
        };

        // Set up presence event handlers
        channel
          .on('presence', { event: 'sync' }, () => {
            try {
              const newState = channel.presenceState();
              const players: OnlinePlayer[] = [];
              
              for (const [userId, presences] of Object.entries(newState)) {
                if (presences && presences.length > 0) {
                  const presencePayload = presences[0] as any; // Supabase presence payload
                  const presence = presencePayload?.presence_ref ? presencePayload : presencePayload as PresenceState;
                  
                  if (presence && presence.hunterId && presence.hunterId !== currentHunter.id) {
                    players.push({
                      hunterId: presence.hunterId,
                      hunterName: presence.hunterName,
                      level: presence.level,
                      class: presence.class,
                      rank: presence.rank,
                      location: presence.location,
                      lastSeen: new Date().toISOString(),
                      userId: presence.userId,
                    });
                  }
                }
              }
              
              setOnlinePlayers(players);
            } catch (err) {
              console.error('Error processing presence sync:', err);
              setError('Failed to sync online players');
            }
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            try {
              if (newPresences && newPresences.length > 0) {
                const presencePayload = newPresences[0] as any; // Supabase presence payload
                const presence = presencePayload?.presence_ref ? presencePayload : presencePayload as PresenceState;
                
                if (presence && presence.hunterId && presence.hunterId !== currentHunter.id) {
                  setOnlinePlayers(prev => {
                    const exists = prev.find(p => p.hunterId === presence.hunterId);
                    if (exists) return prev;
                    
                    return [...prev, {
                      hunterId: presence.hunterId,
                      hunterName: presence.hunterName,
                      level: presence.level,
                      class: presence.class,
                      rank: presence.rank,
                      location: presence.location,
                      lastSeen: new Date().toISOString(),
                      userId: presence.userId,
                    }];
                  });
                }
              }
            } catch (err) {
              console.error('Error processing presence join:', err);
            }
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            try {
              if (leftPresences && leftPresences.length > 0) {
                const presencePayload = leftPresences[0] as any; // Supabase presence payload
                const presence = presencePayload?.presence_ref ? presencePayload : presencePayload as PresenceState;
                
                if (presence && presence.hunterId) {
                  setOnlinePlayers(prev => 
                    prev.filter(p => p.hunterId !== presence.hunterId)
                  );
                }
              }
            } catch (err) {
              console.error('Error processing presence leave:', err);
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              try {
                await channel.track(presenceState);
                setIsConnected(true);
                setError(null);
              } catch (err) {
                console.error('Error tracking presence:', err);
                setError('Failed to connect to presence system');
                setIsConnected(false);
              }
            } else if (status === 'CHANNEL_ERROR') {
              setError('Connection error');
              setIsConnected(false);
            } else if (status === 'TIMED_OUT') {
              setError('Connection timed out');
              setIsConnected(false);
            } else if (status === 'CLOSED') {
              setIsConnected(false);
            }
          });

      } catch (error) {
        console.error('Error setting up presence:', error);
        setError('Failed to setup presence system');
        setIsConnected(false);
      }
    };

    setupPresence();

    // Cleanup function
    return cleanup;
  }, [currentHunter?.id, location, cleanup]);

  // Update location when it changes
  useEffect(() => {
    if (channelRef.current && currentHunter && isConnected) {
      const presenceState: PresenceState = {
        hunterId: currentHunter.id,
        hunterName: currentHunter.name,
        level: currentHunter.level,
        class: currentHunter.class,
        rank: currentHunter.rank,
        location,
        userId: currentHunter.userId,
      };
      
      try {
        channelRef.current.track(presenceState);
      } catch (err) {
        console.error('Error updating presence location:', err);
        setError('Failed to update location');
      }
    }
  }, [location, currentHunter, isConnected]);

  return {
    onlinePlayers,
    isConnected,
    playersCount: onlinePlayers.length,
    error,
  };
}; 