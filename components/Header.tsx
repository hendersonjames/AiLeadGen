import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          {/* LeadHub Icon — house/location pin with gradient */}
          <svg width="36" height="44" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="blueGrad" x1="50" y1="115" x2="50" y2="5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E40AF"/>
                <stop offset="100%" stopColor="#06B6D4"/>
              </linearGradient>
              <linearGradient id="orangeGrad" x1="50" y1="115" x2="50" y2="5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#EA580C"/>
                <stop offset="100%" stopColor="#FB923C"/>
              </linearGradient>
              <linearGradient id="arrowGrad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#06B6D4"/>
                <stop offset="100%" stopColor="#F97316"/>
              </linearGradient>
            </defs>
            {/* Left half - blue */}
            <polygon points="50,5 8,48 8,88 50,88" fill="url(#blueGrad)"/>
            {/* Right half - orange */}
            <polygon points="50,5 92,48 92,88 50,88" fill="url(#orangeGrad)"/>
            {/* Bottom point */}
            <polygon points="8,88 92,88 50,115" fill="url(#blueGrad)"/>
            {/* Chimney */}
            <rect x="22" y="18" width="10" height="18" rx="1" fill="url(#blueGrad)"/>
            {/* Window panes */}
            <rect x="32" y="42" width="8" height="7" rx="1" fill="white" opacity="0.85"/>
            <rect x="32" y="52" width="8" height="7" rx="1" fill="white" opacity="0.65"/>
            <rect x="42" y="42" width="8" height="7" rx="1" fill="white" opacity="0.85"/>
            <rect x="42" y="52" width="8" height="7" rx="1" fill="white" opacity="0.65"/>
            {/* Swooping arrow */}
            <path d="M 14 82 Q 28 98 50 72 L 72 46" stroke="url(#arrowGrad)" strokeWidth="5" strokeLinecap="round" fill="none"/>
            <polyline points="66,42 72,46 68,54" stroke="url(#arrowGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          {/* Wordmark */}
          <h1 className="text-2xl font-black tracking-tight">
            <span style={{background: 'linear-gradient(to right, #1E40AF, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Lead</span><span style={{color: '#F97316'}}>Hub</span>
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
