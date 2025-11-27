import React, { useState } from 'react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  onReact?: (messageId: string) => void;
  reactionCount?: number;
  hasReacted?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onReact, reactionCount = 0, hasReacted = false }) => {
  const { text, userId, timestamp, isSender, is_host, host_name } = message;
  const [showReaction, setShowReaction] = useState(false);

  const time = new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/gi;

  const linkClassName = isSender
    ? 'underline text-white decoration-white/70 underline-offset-2 hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
    : 'underline text-corp-blue-light hover:text-corp-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-corp-blue-light/60';

  const renderTextWithLinks = () => {
    const nodes: Array<string | JSX.Element> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];

      if (matchIndex > lastIndex) {
        nodes.push(text.slice(lastIndex, matchIndex));
      }

      const href = matchText.startsWith('http') ? matchText : `https://${matchText}`;

      nodes.push(
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {matchText}
        </a>
      );

      lastIndex = matchIndex + matchText.length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes.map((node, idx) =>
      typeof node === 'string' ? (
        <React.Fragment key={`text-${idx}`}>{node}</React.Fragment>
      ) : (
        React.cloneElement(node, { key: `link-${idx}` })
      )
    );
  };

  const handleReaction = () => {
    if (onReact && message.id) {
      onReact(message.id);
      setShowReaction(true);
      setTimeout(() => setShowReaction(false), 300);
    }
  };

  const displayName = is_host && host_name ? host_name : userId;

  return (
    <div className={`flex items-end gap-2 group ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col w-full max-w-[85vw] sm:max-w-md lg:max-w-xl ${isSender ? 'items-end' : 'items-start'}`}>
        <div className="relative mb-3">
          <div
            className={`w-full px-4 py-3 rounded-2xl break-words overflow-hidden ${
              isSender
                ? 'bg-corp-blue-light text-white rounded-br-none'
                : 'bg-white dark:bg-corp-gray-700 text-corp-gray-800 dark:text-corp-gray-200 rounded-bl-none shadow-md'
            }`}
            style={{ overflowWrap: 'anywhere' }}
          >
            {is_host && (
              <div className="mb-2 inline-block">
                <span className="px-2 py-0.5 text-xs font-bold bg-yellow-400 text-corp-gray-900 rounded-full">
                  ホスト
                </span>
              </div>
            )}
            <p className="whitespace-pre-wrap break-words">{renderTextWithLinks()}</p>
          </div>

          {onReact && (
            <button
              onClick={handleReaction}
              className={`absolute -bottom-2 ${isSender ? 'left-1 sm:left-2' : 'right-1 sm:right-2'} flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-corp-gray-600 border border-corp-gray-300 dark:border-corp-gray-500 rounded-full shadow-sm active:shadow-lg sm:hover:shadow-md transition-all transform active:scale-95 sm:hover:scale-110 ${
                hasReacted ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400' : ''
              }`}
              aria-label="いいねを追加"
            >
              <span className={`text-sm sm:text-base transition-transform ${showReaction ? 'animate-bounce' : ''}`}>👍</span>
              {reactionCount > 0 && (
                <span className="font-semibold text-corp-gray-700 dark:text-corp-gray-200 text-xs">{reactionCount}</span>
              )}
            </button>
          )}
        </div>

        <div className="mt-1 px-1 text-xs text-corp-gray-700 dark:text-corp-gray-300 flex items-center gap-2">
          <span className="font-semibold">{displayName}</span>
          <span>-</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
