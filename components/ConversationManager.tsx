import React, { useState } from 'react';
import useGeminiLive from '../hooks/useGeminiLive';
import type { TranscriptionEntry } from '../types';
import { ConversationStatus } from '../types';
import StatusIndicator from './StatusIndicator';
import TranscriptionDisplay from './TranscriptionDisplay';

const ConversationManager: React.FC = () => {
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
  const [userName, setUserName] = useState<string>('');
  const { status, error, startSession, closeSession, currentTranscription } = useGeminiLive(setTranscriptionHistory);

  const isSessionRunning = status !== ConversationStatus.IDLE && status !== ConversationStatus.ERROR;

  const handleStart = (isQuizMode: boolean) => {
    if (!userName.trim()) return;
    setTranscriptionHistory([]); // Clear previous conversation
    startSession(userName.trim(), isQuizMode);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {status === ConversationStatus.IDLE && transcriptionHistory.length === 0 && (
          <div className="text-center p-6 bg-purple-100/50 rounded-2xl border-2 border-dashed border-purple-300 mb-6 animate-fade-in-up">
            <label htmlFor="userName" className="block text-lg font-semibold text-purple-800 mb-3">
              प्रश्नोत्तरे किंवा प्रश्नमंजुषा सुरू करण्यासाठी खालील चौकोनात आपले नाव टाईप करा.
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="तुमचे नाव येथे लिहा"
              className="w-full max-w-sm mx-auto px-4 py-2 text-lg text-center border-2 border-purple-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              aria-label="तुमचे नाव"
            />
             <p className="text-gray-600 mt-4">
              नाव टाईप करून झाल्यावर संभाषण सुरू करण्यासाठी हे बटण दाबा!
            </p>
            <div className="mt-2 text-4xl animate-bounce">👇</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          {isSessionRunning ? (
            <button
              onClick={closeSession}
              disabled={status === ConversationStatus.CONNECTING}
              className={`px-10 py-4 text-lg font-bold text-white rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 w-full sm:w-auto
                ${status === ConversationStatus.CONNECTING ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 focus:ring-red-300'}
              `}
            >
              {status === ConversationStatus.CONNECTING ? 'जोडत आहे...' : 'सत्र थांबवा'}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <button
                  onClick={() => handleStart(false)}
                  disabled={!userName.trim()}
                  className="px-8 py-4 text-lg font-bold text-white rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 bg-green-500 hover:bg-green-600 focus:ring-green-300 w-full sm:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                  संभाषण सुरू करा
              </button>
              <button
                  onClick={() => handleStart(true)}
                  disabled={!userName.trim()}
                  className="relative px-8 py-4 text-lg font-bold text-white rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 bg-purple-600 hover:bg-purple-700 focus:ring-purple-400 w-full sm:w-auto flex items-center justify-center gap-2 overflow-hidden disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                  <span className="absolute -top-1 -left-1 bg-yellow-300 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full transform -rotate-12">नवीन</span>
                  <span role="img" aria-label="sparkles">✨</span>
                  <span>प्रश्नमंजुषा</span>
              </button>
            </div>
          )}
          <StatusIndicator status={status} />
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
            <p className="font-bold">एक त्रुटी आली:</p>
            <p>{error}</p>
          </div>
        )}
        
        <TranscriptionDisplay
          history={transcriptionHistory}
          current={currentTranscription}
          status={status}
        />
      </div>
    </div>
  );
};

export default ConversationManager;