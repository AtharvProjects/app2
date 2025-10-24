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
              className={`flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 w-full sm:w-auto
                ${status === ConversationStatus.CONNECTING ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-400'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691L7.985 5.644m0 0L4.804 8.827m3.181-3.183a8.25 8.25 0 0111.667 0l3.181 3.183" />
              </svg>
              <span>{status === ConversationStatus.CONNECTING ? 'जोडत आहे...' : 'नवीन संभाषण'}</span>
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
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md flex flex-col sm:flex-row justify-between items-center gap-4" role="alert">
            <div className="flex-grow">
              <p className="font-bold">एक त्रुटी आली:</p>
              <p>{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex-shrink-0 flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-2 px-4 rounded-full shadow-sm hover:bg-purple-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-100 focus:ring-purple-500"
              aria-label="पुन्हा प्रयत्न करा"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691L7.985 5.644m0 0L4.804 8.827m3.181-3.183a8.25 8.25 0 0111.667 0l3.181 3.183" />
              </svg>
              <span>पुन्हा प्रयत्न करा</span>
            </button>
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