import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Reaction, ReactionType } from '../types';

const PREDEFINED_MESSAGES = [
  "なるほど、その視点は新しいですね。",
  "この点について、もう少し詳しく説明していただけますか？",
  "素晴らしいプレゼンテーションだと思います！",
  "次の休憩時間はいつ頃の予定でしょうか？",
  "とても勉強になります。ありがとうございます。",
  "少し質問があります。よろしいでしょうか？",
  "今のトピック、非常に興味深いです。",
  "資料の共有は後ほどありますか？",
  "具体例を挙げていただくと、より理解が深まりそうです。",
  "他の参加者の意見も聞いてみたいです。",
  "今の説明、すごく分かりやすかったです。",
  "少し話が逸れますが、関連する〇〇についてはどう思われますか？",
  "その理論の背景にある考え方を教えてください。",
  "この後のワークショップが楽しみです。",
  "実践で使う際の注意点はありますか？",
  "今のスライド、もう一度見せていただくことは可能ですか？",
  "感動しました。明日から早速活かしたいです。",
  "このツールはどのような環境で使うのが最適ですか？",
  "全員の理解度を確認しながら進めていただけると助かります。",
  "素晴らしいインサイトをありがとうございます。"
];


// Generate a random user ID for the session
const generateUserId = () => `匿名の研修生#${Math.random().toString(16).substr(2, 4).toUpperCase()}`;

interface Room {
  messages: Message[];
  reactions: Reaction[];
}

// Simulate a database/backend
const roomData: { [key: string]: Room } = {};

export const useChatRoom = (roomId: string) => {
  const currentUserIdRef = useRef<string>(generateUserId());

  const getInitialState = () => {
    if (!roomData[roomId]) {
      roomData[roomId] = {
        messages: [{
          id: `initial-${Date.now()}`,
          text: `ようこそ！「${roomId}」ルームへ。\n研修に関する質問や感想を自由に投稿してください。`,
          timestamp: Date.now(),
          userId: 'システムメッセージ',
          isSender: false,
        }],
        reactions: [],
      };
    }
    return roomData[roomId];
  }

  const [messages, setMessages] = useState<Message[]>(() => getInitialState().messages);
  const [reactions, setReactions] = useState<Reaction[]>(() => getInitialState().reactions);

  // Effect to persist state back to our mock DB
  useEffect(() => {
    if (roomData[roomId]) {
      roomData[roomId] = { messages, reactions };
    }
  }, [roomId, messages, reactions]);

  // Effect to simulate other users sending messages
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessage = PREDEFINED_MESSAGES[Math.floor(Math.random() * PREDEFINED_MESSAGES.length)];
      const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        text: randomMessage,
        timestamp: Date.now(),
        userId: generateUserId(),
        isSender: false,
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }, 8000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [roomId]);

  const sendMessage = useCallback((text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${currentUserIdRef.current}`,
      text,
      timestamp: Date.now(),
      userId: currentUserIdRef.current,
      isSender: true,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  }, []);

  const addReaction = useCallback((type: ReactionType) => {
    const newReaction: Reaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      type,
      timestamp: Date.now(),
    };
    setReactions(prev => [...prev, newReaction]);
  }, []);

  return { messages, sendMessage, addReaction, reactions, currentUserId: currentUserIdRef.current };
};
