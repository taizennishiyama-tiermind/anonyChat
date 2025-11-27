import React, { useState, useRef, useEffect } from 'react';
import type { Message, MessageReaction } from '../types';

interface MessageItemProps {
  message: Message;
  onReact?: (messageId: string) => void;
  reactions?: MessageReaction[];
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onReact, reactions = [] }) => {
  const { text, userId, timestamp, isSender, is_host, host_name } = message;
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const reactionCount = reactions.length;
  const uniqueReactions = reactions.reduce((acc, reaction) => {
    acc[reaction.user_id] = true;
    return acc;
  }, {} as Record<string, boolean>);
  const hasReacted = Object.keys(uniqueReactions).length > 0;

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowReactionPicker(false);
      }
    };

    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReactionPicker]);

  const handleReaction = () => {
    if (onReact && message.id) {
      onReact(message.id);
      setShowReactionPicker(false);
    }
  };

  const displayName = is_host && host_name ? host_name : userId;

  return (
    <div className={`flex items-end gap-2 group ${isSender ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`flex flex-col w-full max-w-[85vw] sm:max-w-md lg:max-w-xl ${isSender ? 'items-end' : 'items-start'}`}>
        <div className="relative">
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

          {/* Reaction Picker */}
          {onReact && showReactionPicker && (
            <div
              ref={pickerRef}
              className={`absolute ${isSender ? 'right-0' : 'left-0'} top-full mt-1 z-10 bg-white dark:bg-corp-gray-700 rounded-full shadow-lg border border-corp-gray-200 dark:border-corp-gray-600 p-1 flex gap-1`}
            >
              <button
                onClick={handleReaction}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-corp-gray-100 dark:hover:bg-corp-gray-600 transition-all transform hover:scale-125 active:scale-95"
                aria-label="いいね"
              >
                <span className="text-2xl">👍</span>
              </button>
            </div>
          )}
        </div>

        {/* Reactions Display */}
        <div className="flex items-center gap-2 mt-1">
          {reactionCount > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 bg-corp-gray-100 dark:bg-corp-gray-800 rounded-full ${isSender ? 'order-2' : 'order-1'}`}>
              <span className="text-xs">👍</span>
              <span className="text-xs font-semibold text-corp-gray-700 dark:text-corp-gray-300">{reactionCount}</span>
            </div>
          )}

          <div className={`px-1 text-xs text-corp-gray-700 dark:text-corp-gray-300 flex items-center gap-2 ${isSender ? 'order-1' : 'order-2'}`}>
            <span className="font-semibold">{displayName}</span>
            <span>·</span>
            <span>{time}</span>
            {onReact && (
              <>
                <span>·</span>
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="text-corp-gray-600 dark:text-corp-gray-400 hover:text-corp-blue-light dark:hover:text-corp-blue-light font-semibold transition-colors"
                >
                  リアクション
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
