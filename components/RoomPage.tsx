import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  const { messages, sendMessage, addReaction, reactions, messageReactions, addMessageReaction, currentUserId } = useChatRoom(decodedRoomId);
  const [newMessage, setNewMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isHostLinkCopied, setIsHostLinkCopied] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const [canNavigateHome, setCanNavigateHome] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);

  const searchParams = new URLSearchParams(location.search);
  const isHostMode = searchParams.get('host') === '1';
  const [hostName, setHostName] = useState(() => {
    const paramName = searchParams.get('hostName');
    if (typeof window !== 'undefined') {
      return paramName || localStorage.getItem('host-name') || '';
    }
    return paramName || '';
  });

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

  useEffect(() => {
    if (typeof window !== 'undefined' && hostName) {
      localStorage.setItem('host-name', hostName);
    }
  }, [hostName]);

  const participantHandles = useMemo(() => {
    const handles = new Set<string>();
    messages.forEach((m) => {
      if (m.is_host && m.host_name) {
        handles.add(m.host_name);
      }
      if ((m as { userId?: string }).userId) {
        handles.add((m as { userId?: string }).userId as string);
      }
      if (m.user_id) {
        handles.add(m.user_id);
      }
      (m.mentions || []).forEach(handle => handles.add(handle));
    });
    if (currentUserId) {
      handles.add(currentUserId);
    }
    if (hostName) {
      handles.add(hostName);
    }
    return Array.from(handles);
  }, [messages, currentUserId, hostName]);

  const updateMentionState = (value: string, cursorPosition: number) => {
    const textUpToCursor = value.slice(0, cursorPosition);
    const match = /@([^\s@]{0,20})$/.exec(textUpToCursor);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentionList(true);
    } else {
      setMentionQuery('');
      setShowMentionList(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    const cursor = e.target.selectionStart || value.length;
    updateMentionState(value, cursor);
  };

  const handleSelectMention = (handle: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart || textarea.value.length;
    const textUpToCursor = newMessage.slice(0, cursor);
    const match = /@([^\s@]{0,20})$/.exec(textUpToCursor);
    if (!match) return;

    const before = textUpToCursor.slice(0, match.index);
    const after = newMessage.slice(cursor);
    const inserted = `@${handle} `;
    const updatedText = `${before}${inserted}${after}`;
    setNewMessage(updatedText);
    setSelectedMentions(prev => Array.from(new Set([...prev, handle])));
    setShowMentionList(false);
    requestAnimationFrame(() => {
      const newCursor = (before + inserted).length;
      textarea.setSelectionRange(newCursor, newCursor);
      textarea.focus();
    });
  };

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (trimmed && !isComposing) {
      const explicitMentions = Array.from(trimmed.matchAll(/@([^\s@]+)/g)).map(m => m[1]);
      const allMentions = Array.from(
        new Set([
          ...selectedMentions,
          ...explicitMentions.filter(handle => participantHandles.includes(handle)),
        ])
      );

      sendMessage(trimmed, {
        isHost: isHostMode,
        hostName: isHostMode ? hostName || 'ホスト' : undefined,
        mentions: allMentions,
      });
      setNewMessage('');
      setSelectedMentions([]);
      setMentionQuery('');
      setShowMentionList(false);
    }
  }, [newMessage, isComposing, sendMessage, isHostMode, hostName, selectedMentions, participantHandles]);

  const baseRoomUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/room/${encodeURIComponent(decodedRoomId)}`;
  }, [decodedRoomId]);

  const attendeeShareLink = baseRoomUrl;

  const hostShareLink = useMemo(() => {
    if (!baseRoomUrl) return '';
    const params = new URLSearchParams();
    params.set('host', '1');
    params.set('hostName', hostName || 'ホスト');
    return `${baseRoomUrl}?${params.toString()}`;
  }, [baseRoomUrl, hostName]);

  const handleShare = () => {
    if (!attendeeShareLink) return;
    navigator.clipboard.writeText(attendeeShareLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleHostShare = () => {
    if (!hostShareLink) return;
    navigator.clipboard.writeText(hostShareLink).then(() => {
      setIsHostLinkCopied(true);
      setTimeout(() => setIsHostLinkCopied(false), 2000);
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

  const mentionSuggestions = useMemo(() => {
    if (!showMentionList) return [];
    const lower = mentionQuery.toLowerCase();
    return participantHandles
      .filter(handle => handle.toLowerCase().includes(lower))
      .slice(0, 6);
  }, [participantHandles, mentionQuery, showMentionList]);

  return (
    <div className="flex flex-col h-screen bg-corp-gray-100 dark:bg-corp-gray-900 overflow-x-hidden" style={{ height: '100dvh' }}>
      <header className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-corp-gray-800 shadow-md z-10 shrink-0">
        {canNavigateHome ? (
          <Link to="/" className="flex items-center gap-2 text-corp-blue-light hover:text-corp-blue transition-colors">
              <BackIcon className="w-6 h-6" />
              <span className="font-semibold hidden sm:inline">ホームに戻る</span>
          </Link>
        ) : (
          <div className="w-6 shrink-0" aria-hidden />
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 min-w-0">
          <h1 className="text-xl font-bold text-corp-gray-800 dark:text-white truncate" title={decodedRoomId}>
            <span className="text-corp-gray-700 dark:text-corp-gray-300">ルーム:</span> {decodedRoomId}
          </h1>
          {isHostMode && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0 bg-yellow-100/80 dark:bg-yellow-500/20 px-3 py-2 rounded-lg border border-yellow-300/80">
              <span className="text-xs font-bold text-yellow-800 dark:text-yellow-200">ホスト</span>
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="ホスト名を入力"
                className="bg-transparent border-b border-yellow-400/70 focus:border-yellow-600 focus:outline-none text-sm font-semibold text-corp-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-corp-blue-light text-white rounded-lg hover:bg-corp-blue transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corp-blue-light"
          >
            {isCopied ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
            <span className="hidden md:inline">{isCopied ? 'コピーしました！' : '参加リンク'}</span>
          </button>
          {isHostMode && (
            <button
              onClick={handleHostShare}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-yellow-500 text-corp-gray-900 rounded-lg hover:bg-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
            >
              {isHostLinkCopied ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
              <span className="hidden md:inline">{isHostLinkCopied ? 'ホストリンクをコピー！' : 'ホスト用リンク'}</span>
            </button>
          )}
        </div>
      </header>

      <Dashboard messages={messages} reactions={reactions} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 w-full">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onReact={(messageId, type) => addMessageReaction(messageId, type)}
              reactions={messageReactions.filter(r => r.message_id === msg.id)}
              currentUserId={currentUserId}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="relative p-3 sm:p-4 bg-white dark:bg-corp-gray-800 border-t border-corp-gray-200 dark:border-corp-gray-700 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-end sm:gap-4">
          <form onSubmit={handleSendMessage} className="order-1 sm:order-2 flex-1 flex items-center gap-2 sm:gap-4">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleMessageChange}
                onClick={(e) => updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart || e.currentTarget.value.length)}
                onSelect={(e) => updateMentionState(e.currentTarget.value, e.currentTarget.selectionStart || e.currentTarget.value.length)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="匿名でメッセージを送信... @でメンション"
                rows={1}
                className="flex-1 w-full min-h-[2.5rem] sm:min-h-[3rem] p-2 sm:p-3 text-sm sm:text-base bg-corp-gray-100 dark:bg-corp-gray-700 border-2 border-transparent focus:border-corp-blue-light focus:ring-0 rounded-lg resize-none transition"
                style={{ maxHeight: '120px' }}
              />
              {showMentionList && mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-corp-gray-800 border border-corp-gray-200 dark:border-corp-gray-700 rounded-xl shadow-lg overflow-hidden z-20">
                  <div className="max-h-56 overflow-y-auto">
                    {mentionSuggestions.map(handle => (
                      <button
                        type="button"
                        key={handle}
                        onClick={() => handleSelectMention(handle)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-corp-blue-50 dark:hover:bg-corp-gray-700 text-corp-gray-800 dark:text-corp-gray-100"
                      >
                        @{handle}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="p-2 sm:p-3 bg-corp-blue-light text-white rounded-full hover:bg-corp-blue disabled:bg-gray-400 transition-colors transform active:scale-95 sm:hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corp-blue-light"
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