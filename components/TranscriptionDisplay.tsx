import React from 'react';
import type { TranscriptionEntry } from '../types';
import { ConversationStatus } from '../types';

interface TranscriptionDisplayProps {
  history: TranscriptionEntry[];
  current: { user: string; model: string };
  status: ConversationStatus;
}

const ChatBubble: React.FC<{ entry: TranscriptionEntry }> = ({ entry }) => {
  const isUser = entry.speaker === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-5 py-3 rounded-2xl shadow ${
          isUser
            ? 'bg-purple-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="font-bold mb-1">{isUser ? 'तुम्ही' : 'AI सहाय्यक'}</p>
        <p>{entry.text}</p>
      </div>
    </div>
  );
};


const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ history, current, status }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, current]);

  return (
    <div
      ref={scrollRef}
      className="h-96 w-full bg-white/80 rounded-2xl shadow-inner p-4 overflow-y-auto space-y-4"
    >
      {history.length === 0 && !current.user && !current.model && (
         <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">तुमचे संभाषण येथे दिसेल...</p>
        </div>
      )}
      {history.map((entry, index) => (
        <ChatBubble key={index} entry={entry} />
      ))}
      
      {current.user && (
        <div className="flex justify-end">
            <div className="max-w-xs md:max-w-md lg:max-w-lg px-5 py-3 rounded-2xl shadow bg-purple-200 text-purple-800 rounded-br-none opacity-70">
                <p className="font-bold mb-1">तुम्ही (ऐकत आहे...)</p>
                <p>{current.user}</p>
            </div>
        </div>
      )}

      {current.model && (
         <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md lg:max-w-lg px-5 py-3 rounded-2xl shadow bg-gray-100 text-gray-600 rounded-bl-none opacity-70">
                <p className="font-bold mb-1">AI सहाय्यक (बोलत आहे...)</p>
                <p>{current.model}</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionDisplay;
