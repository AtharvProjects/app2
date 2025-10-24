import React from 'react';

interface IntroProps {
  isShareMode: boolean;
}

const Intro: React.FC<IntroProps> = ({ isShareMode }) => {
  return (
    <div className="text-center border-b-2 border-purple-200 pb-8 mb-8">
      {isShareMode && (
        <p className="text-purple-700 mt-3 text-sm">डेमो मोडमध्ये संभाषण उपलब्ध नाही.</p>
      )}
    </div>
  );
};

export default Intro;