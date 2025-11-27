import React, { useState, useMemo } from 'react';
import type { Message, MessageReaction } from '../types';

interface MessageItemProps {
  message: Message;
  onReact?: (messageId: string) => void;
  reactions?: MessageReaction[];
  currentUserId?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onReact, reactions = [], currentUserId }) => {
  const { text, userId, timestamp, isSender, is_host, host_name } = message;
  const [isAnimating, setIsAnimating] = useState(false);

  const reactionCount = reactions.length;
  const hasReacted = useMemo(() =>
    currentUserId ? reactions.some(r => r.user_id === currentUserId) : false,
    [reactions, currentUserId]
  );

  const time = new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Enhanced text rendering with URLs and mentions
  const renderTextWithLinksAndMentions = () => {
    const urlRegex = /((https?:\/\/|www\.)[^\s]+)/gi;
    const mentionRegex = /@([^\s]+)/g;

    const linkClassName = isSender
      ? 'underline text-white decoration-white/70 underline-offset-2 hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
      : 'underline text-corp-blue-light hover:text-corp-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-corp-blue-light/60';

    const mentionClassName = isSender
      ? 'font-bold text-yellow-300'
      : 'font-bold text-corp-blue-light';

    const parts: Array<{ type: 'text' | 'url' | 'mention', content: string, index: number }> = [];
    const allMatches: Array<{ start: number, end: number, type: 'url' | 'mention', content: string }> = [];

    // Find all URLs
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'url',
        content: match[0]
      });
    }

    // Find all mentions
    const mentionMatches = text.matchAll(mentionRegex);
    for (const match of mentionMatches) {
      if (match.index !== undefined) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'mention',
          content: match[0]
        });
      }
    }

    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    allMatches.forEach((item, idx) => {
      // Add text before the match
      if (item.start > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, item.start), index: parts.length });
      }

      // Add the match
      parts.push({ type: item.type, content: item.content, index: parts.length });
      lastIndex = item.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex), index: parts.length });
    }

    return parts.map((part) => {
      if (part.type === 'url') {
        const href = part.content.startsWith('http') ? part.content : `https://${part.content}`;
        return (
          <a
            key={part.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {part.content}
          </a>
        );
      } else if (part.type === 'mention') {
        return (
          <span key={part.index} className={mentionClassName}>
            {part.content}
          </span>
        );
      } else {
        return <React.Fragment key={part.index}>{part.content}</React.Fragment>;
      }
    });
  };

  const handleReaction = () => {
    if (onReact && message.id && !hasReacted) {
      onReact(message.id);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const displayName = is_host && host_name ? host_name : userId;

  return (
    <div className={`flex items-start gap-3 group ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex flex-col w-full max-w-[85vw] sm:max-w-md lg:max-w-xl ${isSender ? 'items-end' : 'items-start'}`}>
        {/* Username and timestamp */}
        <div className="flex items-center gap-2 mb-1 px-1">
          {is_host && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-sm">
              🎤 ホスト
            </span>
          )}
          <span className="text-xs font-semibold text-corp-gray-700 dark:text-corp-gray-300">{displayName}</span>
          <span className="text-xs text-corp-gray-500 dark:text-corp-gray-400">{time}</span>
        </div>

        {/* Message bubble */}
        <div className="relative w-full">
          <div
            className={`w-full px-4 py-3 rounded-2xl break-words overflow-hidden transition-all ${
              isSender
                ? 'bg-corp-blue-light text-white rounded-br-sm shadow-md'
                : 'bg-white dark:bg-corp-gray-700 text-corp-gray-800 dark:text-corp-gray-200 rounded-bl-sm shadow-md'
            }`}
            style={{ overflowWrap: 'anywhere' }}
          >
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {renderTextWithLinksAndMentions()}
            </p>
          </div>

          {/* Reaction button */}
          {onReact && (
            <button
              onClick={handleReaction}
              disabled={hasReacted}
              className={`absolute -bottom-2 ${isSender ? 'left-3' : 'right-3'} flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border-2 transition-all transform active:scale-95 ${
                hasReacted
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600'
                  : 'bg-white dark:bg-corp-gray-600 border-corp-gray-200 dark:border-corp-gray-500 hover:border-yellow-400 hover:shadow-xl hover:scale-105'
              } ${isAnimating ? 'animate-bounce' : ''}`}
              aria-label="いいね"
            >
              <span className={`text-lg transition-transform ${isAnimating ? 'scale-125' : ''}`}>
                {hasReacted ? '👍' : '👍'}
              </span>
              {reactionCount > 0 && (
                <span className={`text-sm font-bold ${hasReacted ? 'text-yellow-700 dark:text-yellow-300' : 'text-corp-gray-700 dark:text-corp-gray-200'}`}>
                  {reactionCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
