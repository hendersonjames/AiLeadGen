import React from 'react';

// LeadHub logo mark — house/location-pin with cyan-blue left, orange right, arrow, tagline
const LeadHubIcon: React.FC<{ width?: number; height?: number }> = ({ width = 40, height = 48 }) => (
  <svg width={width} height={height} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lh-blue" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00aeef"/>
        <stop offset="100%" stopColor="#1c4a9a"/>
      </linearGradient>
      <linearGradient id="lh-orange" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f7941d"/>
        <stop offset="100%" stopColor="#d9531e"/>
      </linearGradient>
    </defs>
    {/* Left half — blue gradient. Roof peak → left eave → chimney inset → down left wall → bottom pin-point */}
    <path d="M 50,4 L 7,44 L 7,44 L 15,44 L 15,88 Q 15,105 50,118 L 50,62 L 50,4 Z" fill="url(#lh-blue)"/>
    {/* Chimney on left slope */}
    <rect x="18" y="14" width="9" height="18" rx="1" fill="url(#lh-blue)"/>
    {/* Right half — orange gradient. Roof peak → right eave → down right wall → bottom pin-point */}
    <path d="M 50,4 L 93,44 L 85,44 L 85,88 Q 85,105 50,118 L 50,62 L 50,4 Z" fill="url(#lh-orange)"/>
    {/* Window — 2×2 panes centered on bisect line, orange to match right */}
    <rect x="32" y="50" width="8" height="7" rx="0.5" fill="url(#lh-orange)"/>
    <rect x="42" y="50" width="8" height="7" rx="0.5" fill="url(#lh-orange)"/>
    <rect x="32" y="59" width="8" height="7" rx="0.5" fill="url(#lh-orange)"/>
    <rect x="42" y="59" width="8" height="7" rx="0.5" fill="url(#lh-orange)"/>
    {/* Arrow swoosh: curves from lower-left, arcs up and right, arrowhead upper-right */}
    <path d="M 10 80 Q 28 64 50 50 L 72 32" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.85"/>
    <polyline points="65,27 72,32 68,40" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
  </svg>
);

// Full logo with wordmark + tagline (for auth page)
const LeadHubLogo: React.FC = () => (
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-3 mb-1">
      <LeadHubIcon width={52} height={62} />
      <h1 className="text-4xl font-black tracking-tight" style={{fontFamily: 'Montserrat, Inter, sans-serif'}}>
        <span style={{background: 'linear-gradient(to bottom, #00aeef, #1c4a9a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Lead</span>
        <span style={{background: 'linear-gradient(to bottom, #f7941d, #d9531e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Hub</span>
      </h1>
    </div>
    <p className="text-white text-xs font-medium tracking-widest uppercase" style={{letterSpacing: '0.18em'}}>
      Home Services Lead Generation
    </p>
  </div>
);

const Header: React.FC = () => {
  return (
    <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LeadHubIcon width={36} height={44} />
          <h1 className="text-2xl font-black tracking-tight" style={{fontFamily: 'Montserrat, Inter, sans-serif'}}>
            <span style={{background: 'linear-gradient(to bottom, #00aeef, #1c4a9a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Lead</span>
            <span style={{background: 'linear-gradient(to bottom, #f7941d, #d9531e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Hub</span>
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
export { LeadHubIcon, LeadHubLogo };
