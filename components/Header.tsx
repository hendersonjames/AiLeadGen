import React from 'react';

interface HeaderProps {
  user?: { email?: string } | null;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  return (
    <header className="bg-base-200/60 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">

        {/* Logo / Wordmark */}
        <div className="flex items-center space-x-3">
          {/* LeadHub Icon — isometric 3D house */}
          <svg width="36" height="40" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left face — blue */}
            <polygon points="45,8 8,30 8,78 45,56" fill="#3B82F6"/>
            {/* Right face — orange */}
            <polygon points="45,8 82,30 82,78 45,56" fill="#F97316"/>
            {/* Bottom cap — dark blue */}
            <polygon points="8,78 45,56 82,78 45,100" fill="#1D4ED8"/>
            {/* Window on left face — 2x2 grid */}
            <rect x="18" y="36" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
            <rect x="27" y="36" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
            <rect x="18" y="44" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
            <rect x="27" y="44" width="7" height="6" rx="0.5" fill="white" opacity="0.9"/>
            {/* Cyan curve — starts bottom-left, arcs up and right into right face */}
            <path d="M 12 72 Q 30 50 50 42 Q 65 36 76 30" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
          {/* Wordmark */}
          <h1 className="text-xl font-black tracking-tight">
            <span style={{color: '#3B82F6'}}>Lead</span>
            <span style={{color: '#F97316'}}>Hub</span>
          </h1>
        </div>

        {/* Right side: user info + sign out */}
        {user && onSignOut && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-content-200 hidden sm:block truncate max-w-[200px]" title={user.email}>
              {user.email}
            </span>
            <button
              onClick={onSignOut}
              className="text-xs bg-base-300 hover:bg-base-100 text-content-200 hover:text-content-100 px-3 py-1.5 rounded-lg transition-colors border border-base-300 hover:border-base-200 whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;
