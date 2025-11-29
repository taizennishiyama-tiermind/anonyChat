import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import type { Message, Reaction, ReactionType, MessageReaction } from '../types';

// Generate and store a persistent user ID
const getUserId = () => {
  let userId = localStorage.getItem('chat-user-id');
  if (!userId) {
    userId = `匿名の参加者#${Math.random().toString(16).substr(2, 4).toUpperCase()}`;
    localStorage.setItem('chat-user-id', userId);
  }
  return userId;
};

export const useChatRoom = (roomId: string) => {
  const currentUserIdRef = useRef<string>(getUserId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [messageReactions, setMessageReactions] = useState<MessageReaction[]>([]);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    // Fetch initial data
    const fetchInitialData = async () => {
      if (isDemoMode) {
        const now = new Date().toISOString();
        setMessages([
          {
            id: 'system-info',
            text: '接続設定がまだ行われていないためデモ表示中です。Supabase を設定するとリアルタイム同期が有効になります。',
            timestamp: now,
            user_id: 'システムメッセージ',
            isSender: false,
            room_id: roomId,
          },
        ]);
        return;
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        setMessages(messagesData.map(m => ({
          ...m,
          isSender: m.user_id === currentUserIdRef.current,
          userId: m.user_id,
          mentions: m.mentions || [],
        })));
      }

      const { data: reactionsData, error: reactionsError } = await supabase
        .from('reactions')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (reactionsError) {
        console.error('Error fetching reactions:', reactionsError);
      } else {
        setReactions(reactionsData);
      }

      const { data: messageReactionsData, error: messageReactionsError } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (messageReactionsError) {
        console.error('Error fetching message reactions:', messageReactionsError);
      } else {
        setMessageReactions((messageReactionsData || []).map(r => ({
          ...r,
          type: (r as MessageReaction).type || 'like',
        })));
      }
    };

    fetchInitialData();

    if (!isDemoMode) {
      // Set up subscriptions with improved configuration for mobile
      const messageChannel = supabase.channel(`messages-${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        }, (payload) => {
          const newMessage = { ...payload.new, isSender: payload.new.user_id === currentUserIdRef.current } as Message;
          setMessages(prevMessages => {
            // Prevent duplicates
            if (prevMessages.some(m => m.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
        })
        .subscribe();

      const reactionChannel = supabase.channel(`reactions-${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `room_id=eq.${roomId}`
        }, (payload) => {
          setReactions(prevReactions => {
            const newReaction = payload.new as Reaction;
            if (prevReactions.some(r => r.id === newReaction.id)) {
              return prevReactions;
            }
            return [...prevReactions, newReaction];
          });
        })
        .subscribe();

      const messageReactionChannel = supabase.channel(`message-reactions-${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
          filter: `room_id=eq.${roomId}`
        }, (payload) => {
          setMessageReactions(prevReactions => {
            const newReaction = { ...payload.new, type: (payload.new as MessageReaction).type || 'like' } as MessageReaction;
            if (prevReactions.some(r => r.id === newReaction.id)) {
              return prevReactions;
            }
            return [...prevReactions, newReaction];
          });
        })
        .subscribe();

      // Cleanup subscriptions
      return () => {
        supabase.removeChannel(messageChannel);
        supabase.removeChannel(reactionChannel);
        supabase.removeChannel(messageReactionChannel);
      };
    }

    return () => {};
  }, [roomId]);

  const sendMessage = useCallback(async (
    text: string,
    options?: { mentions?: string[]; isHost?: boolean; hostName?: string }
  ) => {
    const { mentions = [], isHost = false, hostName } = options || {};
    const now = new Date().toISOString();
    const newMessage = {
      id: `local-${now}-${Math.random().toString(16).slice(2)}`,
      timestamp: now,
      text,
      room_id: roomId,
      user_id: currentUserIdRef.current,
      mentions,
      is_host: isHost,
      host_name: isHost ? hostName : null,
    };

    if (isDemoMode) {
      setMessages(prev => [...prev, { ...newMessage, isSender: true } as Message]);
      return;
    }

    const { error } = await supabase.from('messages').insert([newMessage]);
    if (error) {
      console.error('Error sending message:', error);
    }
  }, [roomId]);

  const addReaction = useCallback(async (type: ReactionType) => {
    const now = new Date().toISOString();
    const newReaction = {
      id: `local-reaction-${now}-${Math.random().toString(16).slice(2)}`,
      timestamp: now,
      type,
      room_id: roomId,
    };
    if (isDemoMode) {
      setReactions(prev => [...prev, newReaction as Reaction]);
      return;
    }
    const { error } = await supabase.from('reactions').insert([newReaction]);
    if (error) {
      console.error('Error adding reaction:', error);
    }
  }, [roomId]);

  const addMessageReaction = useCallback(async (messageId: string, type: ReactionType) => {
    const now = new Date().toISOString();
    const newReaction = {
      id: `local-message-reaction-${now}-${Math.random().toString(16).slice(2)}`,
      timestamp: now,
      message_id: messageId,
      user_id: currentUserIdRef.current,
      room_id: roomId,
      type,
    };
    if (isDemoMode) {
      setMessageReactions(prev => [...prev, newReaction as MessageReaction]);
      return;
    }
    const { error } = await supabase.from('message_reactions').insert([newReaction]);
    if (error) {
      console.error('Error adding message reaction:', error);
    }
  }, [roomId]);

  return {
    messages,
    sendMessage,
    addReaction,
    reactions,
    messageReactions,
    addMessageReaction,
    currentUserId: currentUserIdRef.current,
    isDemoMode,
  };
};
