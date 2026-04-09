import React, { useState } from 'react';

const GUIDELINES = [
  'Data is displayed as entered in RTS, with no additional processing or adjustments',
  "Scope is limited to GP's organizations and their assigned products",
  'Covers data from 2026 onwards',
  'Includes Primary Role data only',
];

const Header: React.FC = () => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="header-bar">
      <span className="header-title">Global Publishing</span>
      <span className="header-sep">|</span>
      <span className="header-subtitle">RTS Dashboard</span>
      <span
        className="header-info-wrap"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
      >
        <span className="header-info-btn">
          <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="rgba(255,255,255,0.72)" />
            <line x1="8" y1="7" x2="8" y2="10.5" stroke="rgba(255,255,255,0.72)" />
            <circle cx="8" cy="5" r="0.6" fill="rgba(255,255,255,0.72)" stroke="none" />
          </svg>
        </span>
        {showPopover && (
          <div className="header-popover">
            <div className="header-popover-title">Data Guidelines</div>
            <ul>
              {GUIDELINES.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>
        )}
      </span>
    </div>
  );
};

export default Header;
