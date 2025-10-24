
import React from 'react';
import { ConversationStatus } from '../types';

interface StatusIndicatorProps {
  status: ConversationStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  // Special rendering for LISTENING state to be more engaging
  if (status === ConversationStatus.LISTENING) {
    return (
      <div className="flex items-center justify-center space-x-2 p-2 rounded-full bg-white/50 min-w-[180px]">
        <span
          role="img"
          aria-label="listening"
          className="text-3xl animate-pulse"
        >
          👂
        </span>
        <span className="font-bold text-lg text-green-700 animate-pulse">
          ऐकत आहे...
        </span>
      </div>
    );
  }

  // Special rendering for THINKING state
  if (status === ConversationStatus.THINKING) {
    return (
      <div className="flex items-center justify-center space-x-2 p-2 rounded-full bg-white/50 min-w-[180px]">
        <span
          role="img"
          aria-label="thinking"
          className="text-3xl animate-pulse"
        >
          🧠
        </span>
        <span className="font-bold text-lg text-purple-700 animate-pulse">
          विचार करत आहे...
        </span>
      </div>
    );
  }

  // Default rendering for all other states
  const getStatusInfo = () => {
    switch (status) {
      case ConversationStatus.CONNECTING:
        return { text: 'कनेक्ट करत आहे...', color: 'bg-yellow-500', pulse: true };
      case ConversationStatus.SPEAKING:
        return { text: 'बोलत आहे...', color: 'bg-blue-500', pulse: true };
      case ConversationStatus.ERROR:
        return { text: 'त्रुटी', color: 'bg-red-500', pulse: false };
      case ConversationStatus.IDLE:
        return { text: 'तयार', color: 'bg-gray-400', pulse: false };
      default:
        return { text: 'अज्ञात', color: 'bg-gray-400', pulse: false };
    }
  };

  const { text, color, pulse } = getStatusInfo();

  return (
    <div className="flex items-center justify-center space-x-3 p-2 rounded-full bg-white/50 min-w-[180px]">
      <div className={`w-4 h-4 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`}></div>
      <span className="font-semibold text-gray-700">{text}</span>
    </div>
  );
};

export default StatusIndicator;