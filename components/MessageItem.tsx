import React, { useState, useRef, useEffect } from 'react';
import type { Message, MessageReaction, ReactionType } from '../types';

interface MessageItemProps {
  message: Message;
  onReact?: (messageId: string, type: ReactionType) => void;
  reactions?: MessageReaction[];
  currentUserId?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onReact, reactions = [], currentUserId }) => {
  const { text, userId, user_id, timestamp, isSender, is_host, host_name, mentions = [] } = message;
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const reactionCounts = reactions.reduce((acc, reaction) => {
    const type = reaction.type || 'like';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<ReactionType, number>);

  const time = new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/gi;
  const reactionOptions: { type: ReactionType; emoji: string; label: string }[] = [
    { type: 'like', emoji: '👍', label: 'いいね' },
    { type: 'idea', emoji: '💡', label: 'ひらめき' },
    { type: 'question', emoji: '🤔', label: '質問' },
    { type: 'confused', emoji: '🍊', label: 'みかん！' },
  ];

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentionRegex = mentions.length
    ? new RegExp(`@(${mentions.map(escapeRegExp).join('|')})`, 'g')
    : null;

  const isMentioned = currentUserId ? mentions.includes(currentUserId) : false;

  const displayName = (is_host && host_name) || userId || user_id;

  const linkClassName = isSender
    ? 'underline text-white decoration-white/70 underline-offset-2 hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
    : 'underline text-corp-blue-light hover:text-corp-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-corp-blue-light/60';

  const renderTextWithLinks = () => {
    const nodes: Array<string | JSX.Element> = [];
    const matches: { index: number; length: number; node: JSX.Element }[] = [];

    urlRegex.lastIndex = 0;
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = urlRegex.exec(text)) !== null) {
      const matchText = urlMatch[0];
      const href = matchText.startsWith('http') ? matchText : `https://${matchText}`;
      matches.push({
        index: urlMatch.index,
        length: matchText.length,
        node: (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {matchText}
          </a>
        ),
      });
    }

    if (mentionRegex) {
      mentionRegex.lastIndex = 0;
      let mentionMatch: RegExpExecArray | null;
      while ((mentionMatch = mentionRegex.exec(text)) !== null) {
        const mentionText = mentionMatch[0];
        matches.push({
          index: mentionMatch.index,
          length: mentionText.length,
          node: (
            <span className="px-1.5 py-0.5 rounded-md bg-corp-blue-light/10 text-corp-blue-dark font-semibold">
              {mentionText}
            </span>
          ),
        });
      }
    }

    matches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;
    matches.forEach((match, idx) => {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }
      nodes.push(React.cloneElement(match.node, { key: `match-${idx}` }));
      lastIndex = match.index + match.length;
    });

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

  const handleReaction = (type: ReactionType) => {
    if (onReact && message.id) {
      onReact(message.id, type);
      setShowReactionPicker(false);
    }
  };

  const bubbleHighlight = isMentioned ? 'ring-2 ring-corp-blue-light/70 shadow-lg shadow-corp-blue/10' : '';
  const totalReactions = reactions.length;

  return (
    <div className={`flex items-end gap-2 group ${isSender ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`flex flex-col w-full max-w-[85vw] sm:max-w-md lg:max-w-xl ${isSender ? 'items-end' : 'items-start'}`}>
        <div className="relative">
          <div
            className={`w-full px-4 py-3 rounded-2xl break-words overflow-hidden ${
              isSender
                ? 'bg-corp-blue-light text-white rounded-br-none'
                : 'bg-white dark:bg-corp-gray-700 text-corp-gray-800 dark:text-corp-gray-200 rounded-bl-none shadow-md'
            } ${bubbleHighlight}`}
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
              {reactionOptions.map(option => (
                <button
                  key={option.type}
                  onClick={() => handleReaction(option.type)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-corp-gray-100 dark:hover:bg-corp-gray-600 transition-all transform hover:scale-125 active:scale-95"
                  aria-label={`${option.label} を送る`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions Display */}
        <div className="flex items-center gap-2 mt-1">
          {totalReactions > 0 && (
            <div className={`flex items-center gap-2 px-2 py-1 bg-corp-gray-100 dark:bg-corp-gray-800 rounded-full ${isSender ? 'order-2' : 'order-1'}`}>
              {reactionOptions
                .filter(option => reactionCounts[option.type])
                .map(option => (
                  <div key={option.type} className="flex items-center gap-1 text-xs font-semibold text-corp-gray-700 dark:text-corp-gray-200">
                    <span>{option.emoji}</span>
                    <span>{reactionCounts[option.type]}</span>
                  </div>
                ))}
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
            {isMentioned && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-corp-blue-light/20 text-corp-blue-dark font-semibold">あなた宛</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
