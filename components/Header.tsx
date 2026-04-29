import React from 'react';
import type { User } from '../lib/supabase';

// LeadHub logo mark — rotated diamond (pin shape) with house elements, split down the middle:
// Left half = blue/teal gradient, Right half = orange gradient, arrow sweeps bottom-left to top-right
const LeadHubIcon: React.FC<{ width?: number; height?: number }> = ({ width = 48, height = 56 }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lh-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00cfff"/>
        <stop offset="100%" stopColor="#1c4a9a"/>
      </linearGradient>
      <linearGradient id="lh-orange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff9a00"/>
        <stop offset="100%" stopColor="#d9531e"/>
      </linearGradient>
      <linearGradient id="lh-arrow" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00cfff"/>
        <stop offset="50%" stopColor="#7a5fff"/>
        <stop offset="100%" stopColor="#ff9a00"/>
      </linearGradient>
    </defs>

    {/* Left half — blue gradient. Top point → left → center-bottom → center-top */}
    <path d="M50,2 L18,50 L50,98 L50,50 Z" fill="url(#lh-blue)"/>
    {/* Right half — orange gradient. Top point → right → center-bottom → center-top */}
    <path d="M50,2 L82,50 L50,98 L50,50 Z" fill="url(#lh-orange)"/>

    {/* Chimney — left side of roof, blue */}
    <rect x="27" y="14" width="10" height="16" rx="1" fill="url(#lh-blue)"/>

    {/* Window panes — 2×2 grid centered on the vertical split at x=50 */}
    {/* Top-left (blue) */}<rect x="35" y="36" width="9" height="9" rx="1" fill="url(#lh-blue)"/>
    {/* Top-right (orange) */}<rect x="56" y="36" width="9" height="9" rx="1" fill="url(#lh-orange)"/>
    {/* Bottom-left (blue) */}<rect x="35" y="47" width="9" height="9" rx="1" fill="url(#lh-blue)"/>
    {/* Bottom-right (orange) */}<rect x="56" y="47" width="9" height="9" rx="1" fill="url(#lh-orange)"/>

    {/* Arrow — curves from bottom-left, arcs through center, points top-right */}
    <path d="M24,78 Q34,58 50,50 L74,26" stroke="url(#lh-arrow)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9"/>
    <polyline points="66,20 74,26 68,34" stroke="url(#lh-arrow)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
  </svg>
);

// Full logo with wordmark + tagline (for auth page)
const LeadHubLogo: React.FC = () => (
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-3 mb-1">
      <LeadHubIcon width={56} height={64} />
      <h1 className="text-4xl font-black tracking-tight" style={{fontFamily: 'Montserrat, Inter, sans-serif'}}>
        <span style={{background: 'linear-gradient(135deg, #00cfff, #1c4a9a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Lead</span>
        <span style={{background: 'linear-gradient(135deg, #ff9a00, #d9531e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Hub</span>
      </h1>
    </div>
    <p className="text-white/70 text-xs font-medium tracking-widest uppercase" style={{letterSpacing: '0.18em'}}>
      Home Services Lead Generation
    </p>
  </div>
);

interface HeaderProps {
  user?: User | null;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  return (
    <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + wordmark */}
        <div className="flex items-center space-x-3">
          <LeadHubIcon width={36} height={44} />
          <h1 className="text-2xl font-black tracking-tight" style={{fontFamily: 'Montserrat, Inter, sans-serif'}}>
            <span style={{background: 'linear-gradient(135deg, #00cfff, #1c4a9a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Lead</span>
            <span style={{background: 'linear-gradient(135deg, #ff9a00, #d9531e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Hub</span>
          </h1>
        </div>

        {/* User info + sign out */}
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-content-200 text-xs hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="text-xs text-content-200 hover:text-content-100 bg-base-300 hover:bg-base-200 px-3 py-1.5 rounded-lg transition-colors border border-base-300 hover:border-content-200"
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
export { LeadHubIcon, LeadHubLogo };