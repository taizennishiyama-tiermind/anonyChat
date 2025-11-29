import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import type { Message, Reaction, ReactionType, MessageReaction } from '../types';

const safeLocalStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('localStorage is not available in this environment.', error);
    return null;
  }
};

const getUserId = () => {
  const storage = safeLocalStorage();
  if (!storage) return `匿名の参加者#${Math.random().toString(16).substr(2, 4).toUpperCase()}`;
  let userId = storage.getItem('chat-user-id');
  if (!userId) {
    userId = `匿名の参加者#${Math.random().toString(16).substr(2, 4).toUpperCase()}`;
    storage.setItem('chat-user-id', userId);
  }
  return userId;
};

export const useChatRoom = (roomId: string) => {
  const currentUserIdRef = useRef<string>(getUserId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [messageReactions, setMessageReactions] = useState<MessageReaction[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else if (isMounted && messagesData) {
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
      } else if (isMounted && reactionsData) {
        setReactions(reactionsData);
      }

      const { data: messageReactionsData, error: messageReactionsError } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (messageReactionsError) {
        console.error('Error fetching message reactions:', messageReactionsError);
      } else if (isMounted && messageReactionsData) {
        setMessageReactions((messageReactionsData || []).map(r => ({
          ...r,
          type: (r as MessageReaction).type || 'like',
        })));
      }
    };

    fetchInitialData();

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
          if (prevMessages.some(m => m.id === newMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Messages channel subscribed');
        }
      });

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Reactions channel subscribed');
        }
      });

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Message reactions channel subscribed');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(messageReactionChannel);
    };
  }, [roomId]);

  const sendMessage = useCallback(async (
    text: string,
    options?: { mentions?: string[]; isHost?: boolean; hostName?: string }
  ) => {
    const { mentions = [], isHost = false, hostName } = options || {};
    const baseMessage = {
      text,
      room_id: roomId,
      user_id: currentUserIdRef.current,
      mentions,
      is_host: isHost,
      host_name: isHost ? hostName : null,
    };

    if (!isSupabaseConfigured) {
      setMessages(prev => [
        ...prev,
        {
          ...baseMessage,
          id: `local-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isSender: true,
          userId: currentUserIdRef.current,
        } as Message,
      ]);
      return;
    }

    const { error } = await supabase.from('messages').insert([baseMessage]);
    if (error) {
      console.error('Error sending message:', error);
    }
  }, [roomId]);

  const addReaction = useCallback(async (type: ReactionType) => {
    if (!isSupabaseConfigured) {
      setReactions(prev => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          type,
          room_id: roomId,
          timestamp: new Date().toISOString(),
        } as Reaction,
      ]);
      return;
    }

    const newReaction = {
      type,
      room_id: roomId,
    };
    const { error } = await supabase.from('reactions').insert([newReaction]);
    if (error) {
      console.error('Error adding reaction:', error);
    }
  }, [roomId]);

  const addMessageReaction = useCallback(async (messageId: string, type: ReactionType) => {
    if (!isSupabaseConfigured) {
      setMessageReactions(prev => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          message_id: messageId,
          user_id: currentUserIdRef.current,
          room_id: roomId,
          type,
          timestamp: new Date().toISOString(),
        } as MessageReaction,
      ]);
      return;
    }

    const newReaction = {
      message_id: messageId,
      user_id: currentUserIdRef.current,
      room_id: roomId,
      type,
    };
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
    currentUserId: currentUserIdRef.current
  };
};
