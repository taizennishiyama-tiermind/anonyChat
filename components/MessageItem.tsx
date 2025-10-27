import React from 'react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { text, userId, timestamp, isSender } = message;

  const time = new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/gi;

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
          className="underline text-corp-blue-light hover:text-corp-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-corp-blue-light/60"
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

  return (
    <div className={`flex items-end gap-2 group ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-sm md:max-w-md lg:max-w-lg ${isSender ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl break-words ${
            isSender
              ? 'bg-corp-blue-light text-white rounded-br-none'
              : 'bg-white dark:bg-corp-gray-700 text-corp-gray-800 dark:text-corp-gray-200 rounded-bl-none shadow-md'
          }`}
        >
          <p style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithLinks()}</p>
        </div>

        <div className="mt-1 px-1 text-xs text-corp-gray-700 dark:text-corp-gray-300 flex items-center gap-2">
          <span>{userId}</span>
          <span>-</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
