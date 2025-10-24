import React, { useState } from 'react';

const ShareButton: React.FC = () => {
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Determine if any sharing/copying functionality is available.
  const isActionAvailable = !!(navigator.share || (navigator.clipboard && navigator.clipboard.writeText));

  const handleShare = async () => {
    setFeedbackMessage(null);
    
    let origin = window.location.origin;
    // Fix for development environment URLs that don't resolve correctly.
    if (origin.includes('.scf.usercontent.googhttps')) {
      origin = origin.replace('.scf.usercontent.googhttps', '.aistudio-app.google.com');
    }

    const shareUrl = `${origin}${window.location.pathname}?mode=share`;
    const shareData = {
      title: 'मराठी व्याकरण सहाय्यक',
      text: 'यशवंतराव चव्हाण विद्यालयाच्या विद्यार्थ्यांसाठी AI द्वारे मराठी व्याकरण शिका!',
      url: shareUrl,
    };

    // Use native Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return; // Success
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // User cancelled, do nothing.
        }
        // If it failed for another reason (e.g., permissions), we'll proceed to the clipboard fallback.
        console.error('Web Share API failed. Trying fallback.', err);
      }
    }

    // Fallback to clipboard
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        // This case should be rare since we check `isActionAvailable` before rendering.
        throw new Error('Clipboard API not available.');
      }
      await navigator.clipboard.writeText(shareUrl);
      setFeedbackMessage({ text: 'शेअरिंग उपलब्ध नाही. लिंक कॉपी झाली!', isError: false });
    } catch (copyErr) {
      console.error('Clipboard fallback failed.', copyErr);
      setFeedbackMessage({ text: 'शेअर करता आले नाही.', isError: true });
    } finally {
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  if (!isActionAvailable) {
    return null; // Don't render the button if no action is possible.
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 bg-white/80 text-purple-700 font-semibold py-2 px-4 border border-purple-300 rounded-full shadow-sm hover:bg-purple-50 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
        aria-label="ॲप शेअर करा"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
        <span>शेअर करा</span>
      </button>
      {feedbackMessage && (
        <p className={`text-sm mt-2 ${feedbackMessage.isError ? 'text-red-500' : 'text-green-600'}`}>
          {feedbackMessage.text}
        </p>
      )}
    </div>
  );
};

export default ShareButton;