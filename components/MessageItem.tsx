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

  return (
    <div className={`flex items-end gap-2 group ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-sm md:max-w-md lg:max-w-lg ${isSender ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl break-words ${
            isSender
              ? 'bg-corp-blue-light text-white rounded-br-none'
              : 'bg-white dark:bg-corp-gray-700 text-corp-gray-800 dark:text-corp-gray-200 rounded-bl-none shadow-md'
          }`}
        >
          <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>
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
