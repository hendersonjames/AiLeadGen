import React from 'react';

// Shared LeadHub icon SVG — house/location-pin with blue-left, orange-right, arrow, window
const LeadHubIcon: React.FC<{ width?: number; height?: number }> = ({ width = 36, height = 44 }) => (
  <svg width={width} height={height} viewBox="0 0 100 125" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lh-blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2e86c1"/>
        <stop offset="100%" stopColor="#1b4f72"/>
      </linearGradient>
      <linearGradient id="lh-orangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f39c12"/>
        <stop offset="100%" stopColor="#d35400"/>
      </linearGradient>
    </defs>
    {/* Left (blue) half: peak → left edge down → swoosh inward → up to center bottom */}
    <path d="M 50,5 L 8,42 L 8,88 Q 8,100 29,112 L 50,90 Z" fill="url(#lh-blueGrad)"/>
    {/* Right (orange) half: peak → right edge down → taper to pin point */}
    <path d="M 50,5 L 92,42 L 92,88 L 50,120 L 50,90 Z" fill="url(#lh-orangeGrad)"/>
    {/* Chimney on left slope */}
    <rect x="20" y="16" width="9" height="16" rx="1" fill="url(#lh-blueGrad)"/>
    {/* Window — 2×2 panes, centered upper area */}
    <rect x="31" y="46" width="8" height="7" rx="0.5" fill="#5d6d7e"/>
    <rect x="41" y="46" width="8" height="7" rx="0.5" fill="#5d6d7e"/>
    <rect x="31" y="55" width="8" height="7" rx="0.5" fill="#5d6d7e"/>
    <rect x="41" y="55" width="8" height="7" rx="0.5" fill="#5d6d7e"/>
    {/* Arrow: sweeps up from lower-left, arrowhead into orange section */}
    <path d="M 14 84 Q 32 70 52 52 L 70 36" stroke="#5d6d7e" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
    <polyline points="63,32 70,36 66,44" stroke="#5d6d7e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const Header: React.FC = () => {
  return (
    <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LeadHubIcon width={36} height={44} />
          {/* Wordmark */}
          <h1 className="text-2xl font-black tracking-tight">
            <span style={{color: '#2e86c1'}}>Lead</span><span style={{color: '#f39c12'}}>Hub</span>
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
export { LeadHubIcon };
