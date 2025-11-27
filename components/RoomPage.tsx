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
  const { messages, sendMessage, addReaction, reactions, messageReactions, addMessageReaction, hostInfo } = useChatRoom(decodedRoomId);
  const [newMessage, setNewMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showHostLinkModal, setShowHostLinkModal] = useState(false);
  const [hostName, setHostName] = useState('');
  const [generatedHostLink, setGeneratedHostLink] = useState('');
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
    const url = `${window.location.origin}/room/${encodeURIComponent(decodedRoomId)}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleGenerateHostLink = () => {
    if (hostName.trim()) {
      const url = `${window.location.origin}/room/${encodeURIComponent(decodedRoomId)}?host=true&name=${encodeURIComponent(hostName.trim())}`;
      setGeneratedHostLink(url);
    }
  };

  const handleCopyHostLink = () => {
    navigator.clipboard.writeText(generatedHostLink).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setShowHostLinkModal(false);
        setHostName('');
        setGeneratedHostLink('');
      }, 1500);
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

  const reactionButtons: { type: ReactionType; emoji: string; label: string; borderClass: string; hoverClass: string; }[] = [
    { type: 'like', emoji: '👍', label: 'いいね', borderClass: 'border-yellow-100/80 focus:ring-yellow-400', hoverClass: 'hover:bg-yellow-50 dark:hover:bg-yellow-500/20' },
    { type: 'idea', emoji: '💡', label: 'ひらめき', borderClass: 'border-blue-100/80 focus:ring-blue-400', hoverClass: 'hover:bg-blue-50 dark:hover:bg-blue-500/20' },
    { type: 'question', emoji: '🤔', label: '質問', borderClass: 'border-green-100/80 focus:ring-green-400', hoverClass: 'hover:bg-green-50 dark:hover:bg-green-500/20' },
    { type: 'confused', emoji: '🍊', label: 'みかん！', borderClass: 'border-purple-100/80 focus:ring-purple-400', hoverClass: 'hover:bg-purple-50 dark:hover:bg-purple-500/20' },
  ];

  return (
    <div className="flex flex-col h-screen bg-corp-gray-100 dark:bg-corp-gray-900 overflow-x-hidden" style={{ height: '100dvh' }}>
      <header className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-white dark:bg-corp-gray-800 shadow-md z-10 shrink-0">
        {canNavigateHome ? (
          <Link to="/" className="flex items-center gap-2 text-corp-blue-light hover:text-corp-blue transition-colors shrink-0">
              <BackIcon className="w-6 h-6" />
              <span className="font-semibold hidden sm:inline">ホーム</span>
          </Link>
        ) : (
          <div className="w-6 shrink-0" aria-hidden />
        )}
        <div className="flex-1 text-center min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-corp-gray-800 dark:text-white truncate" title={decodedRoomId}>
            {decodedRoomId}
          </h1>
          {hostInfo.isHost && (
            <p className="text-xs text-corp-gray-600 dark:text-corp-gray-400">
              ホストとして参加中: {hostInfo.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHostLinkModal(true)}
            className="px-3 py-2 text-xs sm:text-sm font-semibold text-corp-blue-light hover:text-corp-blue transition-colors"
            title="ホスト用リンクを作成"
          >
            🎤
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold bg-corp-blue-light text-white rounded-lg hover:bg-corp-blue transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corp-blue-light"
          >
            {isCopied ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
            <span className="hidden md:inline">{isCopied ? 'コピー完了' : '共有'}</span>
          </button>
        </div>
      </header>

      {/* Host Link Modal */}
      {showHostLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHostLinkModal(false)}>
          <div className="bg-white dark:bg-corp-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-corp-gray-800 dark:text-white mb-4">ホスト用リンクを作成</h2>
            <p className="text-sm text-corp-gray-600 dark:text-corp-gray-400 mb-4">
              講演者や事務局の方が実名で参加できる専用リンクを作成します。
            </p>

            {!generatedHostLink ? (
              <>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="ホスト名（例：田中太郎）"
                  className="w-full px-4 py-3 bg-corp-gray-100 dark:bg-corp-gray-700 border-2 border-transparent focus:border-corp-blue-light focus:ring-0 rounded-lg text-corp-gray-800 dark:text-white mb-4"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateHostLink()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHostLinkModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-corp-gray-700 dark:text-corp-gray-300 bg-corp-gray-200 dark:bg-corp-gray-700 rounded-lg hover:bg-corp-gray-300 dark:hover:bg-corp-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleGenerateHostLink}
                    disabled={!hostName.trim()}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-corp-blue-light text-white rounded-lg hover:bg-corp-blue disabled:bg-gray-400 transition-colors"
                  >
                    リンクを生成
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-corp-gray-100 dark:bg-corp-gray-700 rounded-lg p-3 mb-4 break-all text-sm text-corp-gray-800 dark:text-corp-gray-200">
                  {generatedHostLink}
                </div>
                <button
                  onClick={handleCopyHostLink}
                  className="w-full px-4 py-3 text-sm font-semibold bg-corp-blue-light text-white rounded-lg hover:bg-corp-blue transition-colors flex items-center justify-center gap-2"
                >
                  {isCopied ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
                  {isCopied ? 'コピーしました！' : 'リンクをコピー'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <Dashboard messages={messages} reactions={reactions} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onReact={addMessageReaction}
              reactions={messageReactions.filter(r => r.message_id === msg.id)}
              currentUserId={msg.user_id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="relative p-3 sm:p-4 bg-white dark:bg-corp-gray-800 border-t border-corp-gray-200 dark:border-corp-gray-700 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-end sm:gap-4">
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
              placeholder={hostInfo.isHost ? `${hostInfo.name}としてメッセージを送信... (@でメンション)` : "匿名でメッセージを送信... (@でメンション)"}
              rows={1}
              className="flex-1 w-full min-h-[2.5rem] sm:min-h-[3rem] p-2 sm:p-3 text-sm sm:text-base bg-corp-gray-100 dark:bg-corp-gray-700 border-2 border-transparent focus:border-corp-blue-light focus:ring-0 rounded-xl resize-none transition shadow-sm"
              style={{ maxHeight: '120px' }}
            />
            <button
              type="submit"
              className="p-2 sm:p-3 bg-gradient-to-r from-corp-blue-light to-corp-blue text-white rounded-full hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 sm:hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corp-blue-light shadow-md"
              disabled={!newMessage.trim()}
            >
              <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </form>
          <div className="order-2 sm:order-1 w-full sm:w-auto">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto p-2 bg-white/90 dark:bg-corp-gray-700/80 border border-corp-gray-200 dark:border-corp-gray-600 rounded-2xl shadow-md sm:shadow-none sm:bg-transparent sm:dark:bg-transparent sm:border-none">
              {reactionButtons.map(({ type, emoji, label, borderClass, hoverClass }) => (
                <div key={type} className="flex flex-col items-center flex-1 min-w-[64px] sm:min-w-0 sm:w-auto">
                  <button
                    onClick={() => handleReactionClick(type, emoji)}
                    aria-label={`${label}を送る`}
                    className={`relative w-full max-w-[72px] h-12 sm:w-12 sm:h-12 flex items-center justify-center bg-white/90 dark:bg-corp-gray-700 border ${borderClass} rounded-full ${hoverClass} transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-corp-gray-800`}
                  >
                    <span className="text-xl sm:text-2xl" aria-hidden>
                      {emoji}
                    </span>
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
                  <span className="mt-1 text-[11px] font-semibold text-corp-gray-600 dark:text-corp-gray-200 sm:hidden">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoomPage;