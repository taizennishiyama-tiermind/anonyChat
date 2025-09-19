import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Message, Reaction, ReactionType } from '../types';

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

  useEffect(() => {
    // Fetch initial data
    const fetchInitialData = async () => {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        setMessages(messagesData.map(m => ({ ...m, isSender: m.user_id === currentUserIdRef.current })));
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
    };

    fetchInitialData();

    // Set up subscriptions
    const messageSubscription = supabase.channel(`messages-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const newMessage = { ...payload.new, isSender: payload.new.user_id === currentUserIdRef.current } as Message;
        setMessages(prevMessages => [...prevMessages, newMessage]);
      })
      .subscribe();

    const reactionSubscription = supabase.channel(`reactions-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions', filter: `room_id=eq.${roomId}` }, (payload) => {
        setReactions(prevReactions => [...prevReactions, payload.new as Reaction]);
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(reactionSubscription);
    };
  }, [roomId]);

  const sendMessage = useCallback(async (text: string) => {
    const newMessage = {
      text,
      room_id: roomId,
      user_id: currentUserIdRef.current,
    };
    const { error } = await supabase.from('messages').insert([newMessage]);
    if (error) {
      console.error('Error sending message:', error);
    }
  }, [roomId]);

  const addReaction = useCallback(async (type: ReactionType) => {
    const newReaction = {
      type,
      room_id: roomId,
    };
    const { error } = await supabase.from('reactions').insert([newReaction]);
    if (error) {
      console.error('Error adding reaction:', error);
    }
  }, [roomId]);

  return { messages, sendMessage, addReaction, reactions, currentUserId: currentUserIdRef.current };
};
