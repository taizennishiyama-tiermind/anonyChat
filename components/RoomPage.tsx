import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useChatRoom } from '../hooks/useChatRoom';
import MessageItem from './MessageItem';
import Dashboard from './Dashboard';
import { SendIcon, ShareIcon, CheckIcon, BackIcon } from './icons';
import type { ReactionType } from '../types';

interface FlyingEmoji {
  id: number;
  emoji: string;
  type: ReactionType;
}

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const decodedRoomId = roomId ? decodeURIComponent(roomId) : '不明なルーム';
  const { messages, sendMessage, addReaction, reactions } = useChatRoom(decodedRoomId);
  const [newMessage, setNewMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const [canNavigateHome, setCanNavigateHome] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isComposing, setIsComposing] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setCanNavigateHome(false);
      return;
    }

    const allowHomeKey = `allowHomeNavigation:${decodedRoomId}`;
    const state = location.state as { allowHomeNavigation?: boolean } | null;

    if (state?.allowHomeNavigation) {
      sessionStorage.setItem(allowHomeKey, 'true');
    }

    const storedValue = sessionStorage.getItem(allowHomeKey) === 'true';
    setCanNavigateHome(storedValue);
  }, [decodedRoomId, location.state]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !isComposing) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  }, [newMessage, isComposing, sendMessage]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleReactionClick = (type: ReactionType, emoji: string) => {
    addReaction(type);
    const newEmoji: FlyingEmoji = { id: Date.now() + Math.random(), emoji, type };
    setFlyingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFlyingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1000); // Animation duration
  };

  const reactionButtons: { type: ReactionType; emoji: string; color: string; }[] = [
    { type: 'like', emoji: '👍', color: 'yellow' },
    { type: 'idea', emoji: '💡', color: 'blue' },
    { type: 'question', emoji: '🤔', color: 'green' },
    { type: 'confused', emoji: '😕', color: 'purple' },
  ];

  return (
    <div className="flex flex-col h-screen bg-corp-gray-100 dark:bg-corp-gray-900">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-corp-gray-800 shadow-md z-10 shrink-0">
        {canNavigateHome ? (
          <Link to="/" className="flex items-center gap-2 text-corp-blue-light hover:text-corp-blue transition-colors">
              <BackIcon className="w-6 h-6" />
              <span className="font-semibold hidden sm:inline">ホームに戻る</span>
          </Link>
        ) : (
          <div className="w-6 shrink-0" aria-hidden />
        )}
        <h1 className="text-xl font-bold text-corp-gray-800 dark:text-white truncate" title={decodedRoomId}>
          <span className="text-corp-gray-700 dark:text-corp-gray-300">ルーム:</span> {decodedRoomId}
        </h1>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-corp-blue-light text-white rounded-lg hover:bg-corp-blue transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corp-blue-light"
        >
          {isCopied ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
          <span className="hidden md:inline">{isCopied ? 'コピーしました！' : 'リンクを共有'}</span>
        </button>
      </header>

      <Dashboard messages={messages} reactions={reactions} />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="relative p-4 bg-white dark:bg-corp-gray-800 border-t border-corp-gray-200 dark:border-corp-gray-700 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <form onSubmit={handleSendMessage} className="order-1 sm:order-2 flex-1 flex items-center gap-2 sm:gap-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="匿名でメッセージを送信..."
              rows={1}
              className="flex-1 w-full min-h-[3rem] p-3 bg-corp-gray-100 dark:bg-corp-gray-700 border-2 border-transparent focus:border-corp-blue-light focus:ring-0 rounded-lg resize-none transition"
            />
            <button
              type="submit"
              className="p-3 bg-corp-blue-light text-white rounded-full hover:bg-corp-blue disabled:bg-gray-400 transition-colors transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corp-blue-light"
              disabled={!newMessage.trim()}
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
          <div className="order-2 sm:order-1 flex w-full justify-between gap-2 sm:w-auto sm:justify-start">
            {reactionButtons.map(({ type, emoji, color }) => (
              <button
                key={type}
                onClick={() => handleReactionClick(type, emoji)}
                aria-label={`${type}を送る`}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white dark:bg-corp-gray-700 border-2 border-corp-gray-200 dark:border-corp-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-corp-gray-600 transition-all transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500`}
              >
                <span className="text-xl sm:text-2xl">{emoji}</span>
                {flyingEmojis
                  .filter(fe => fe.type === type)
                  .map(fe => (
                    <span
                      key={fe.id}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 text-2xl sm:text-3xl pointer-events-none animate-fly-up"
                      style={{ userSelect: 'none' }}
                    >
                      {fe.emoji}
                    </span>
                ))}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoomPage;