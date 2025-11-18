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

  const reactionButtons: { type: ReactionType; emoji: string; label: string; ring: string; accent: string }[] = [
    {
      type: 'like',
      emoji: '👍',
      label: 'いいね',
      ring: 'focus:ring-amber-300',
      accent: 'max-sm:bg-amber-50 max-sm:border-amber-100 max-sm:text-amber-800 max-sm:shadow-inner dark:max-sm:bg-amber-900/40 dark:max-sm:border-amber-800 dark:max-sm:text-amber-100',
    },
    {
      type: 'idea',
      emoji: '💡',
      label: 'ひらめき',
      ring: 'focus:ring-blue-300',
      accent: 'max-sm:bg-blue-50 max-sm:border-blue-100 max-sm:text-blue-800 max-sm:shadow-inner dark:max-sm:bg-blue-900/40 dark:max-sm:border-blue-800 dark:max-sm:text-blue-100',
    },
    {
      type: 'question',
      emoji: '🤔',
      label: '質問',
      ring: 'focus:ring-emerald-300',
      accent: 'max-sm:bg-emerald-50 max-sm:border-emerald-100 max-sm:text-emerald-800 max-sm:shadow-inner dark:max-sm:bg-emerald-900/40 dark:max-sm:border-emerald-800 dark:max-sm:text-emerald-100',
    },
    {
      type: 'confused',
      emoji: '🦓',
      label: 'その他',
      ring: 'focus:ring-purple-300',
      accent: 'max-sm:bg-purple-50 max-sm:border-purple-100 max-sm:text-purple-800 max-sm:shadow-inner dark:max-sm:bg-purple-900/40 dark:max-sm:border-purple-800 dark:max-sm:text-purple-100',
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-corp-gray-100 dark:bg-corp-gray-900">
      <header className="flex items-center justify-between px-3 py-3 sm:px-4 bg-white dark:bg-corp-gray-800 shadow-md z-10 shrink-0">
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

      <main className="flex-1 overflow-y-auto p-3 pb-28 sm:p-6 sm:pb-8">
        <div className="max-w-3xl w-full mx-auto space-y-6">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="relative p-4 sm:p-5 bg-white dark:bg-corp-gray-800 border-t border-corp-gray-200 dark:border-corp-gray-700 shrink-0 max-sm:sticky max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
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
              className="flex-1 w-full min-h-[3.25rem] max-h-32 p-3 bg-corp-gray-100 dark:bg-corp-gray-700 border-2 border-transparent focus:border-corp-blue-light focus:ring-0 rounded-xl resize-none transition text-sm sm:text-base"
            />
            <button
              type="submit"
              className="p-3 bg-corp-blue-light text-white rounded-full hover:bg-corp-blue disabled:bg-gray-400 transition-colors transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corp-blue-light"
              disabled={!newMessage.trim()}
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
          <div className="order-2 sm:order-1 grid grid-cols-2 w-full gap-2 sm:w-auto sm:flex sm:justify-start sm:gap-2">
            {reactionButtons.map(({ type, emoji, ring, label, accent }) => (
              <button
                key={type}
                onClick={() => handleReactionClick(type, emoji)}
                aria-label={`${type}を送る`}
                className={`relative overflow-hidden border flex items-center justify-center h-12 rounded-xl sm:rounded-full sm:w-12 sm:h-12 sm:bg-white sm:dark:bg-corp-gray-700 sm:border-corp-gray-200 sm:dark:border-corp-gray-600 ${accent} ${ring} transition-all transform hover:scale-[1.02] sm:hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 sm:focus:ring-offset-2 shadow-[0_2px_10px_rgba(0,0,0,0.06)] sm:shadow-none`}
              >
                <span className="flex items-center gap-2 sm:hidden">
                  <span className="text-lg" aria-hidden>{emoji}</span>
                  <span className="text-xs font-bold tracking-wide">{label}</span>
                </span>
                <span className="hidden sm:inline text-xl" aria-hidden>{emoji}</span>
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