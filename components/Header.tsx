import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
        मराठी व्याकरण सहाय्यक
      </h1>
      <p className="mt-2 text-lg text-purple-700 font-semibold">
        यशवंतराव चव्हाण विद्यालय, यशवंतनगर, ता. कराड, जि. सातारा
      </p>
      <div className="mt-6 inline-block p-1 glowing-box rounded-xl">
         <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
             <p className="text-md font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 animate-pulse">
                आता, AI द्वारे शिका, आपल्या सवडीनुसार!
             </p>
         </div>
      </div>
    </header>
  );
};

export default Header;