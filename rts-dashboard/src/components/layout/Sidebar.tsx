import React from 'react';
import { LV1_COLORS, GPD_PALETTES, NPC } from '../../utils/colors';
import type { OrgNode, PoGame } from '../../types';

interface SidebarProps {
  activeOrg: string | null;
  activeProduct: string | null;
  onSelectOrg: (org: string) => void;
  onSelectGpdProduct: (owner: string, product: string) => void;
  orgLv1: OrgNode[];
  poOwnerIds: string[];
  poGames: PoGame[];
  npdKey: string;
  onHomeClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeOrg, activeProduct, onSelectOrg, onSelectGpdProduct, orgLv1, poOwnerIds, poGames, npdKey, onHomeClick }) => (
  <nav className="sidebar">
    <div className="sb-brand" onClick={onHomeClick}>
      <span className="sb-logo">
        <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="58" width="22" height="34" rx="6" fill="#0071e3" opacity="0.4"/>
          <rect x="39" y="32" width="22" height="60" rx="6" fill="#0071e3" opacity="0.65"/>
          <rect x="68" y="8" width="22" height="84" rx="6" fill="#0071e3"/>
        </svg>
      </span>
      GP RTS Dashboard
    </div>
    <div className="sb-divider" />
    <div className="sb-section">
      <div className="sb-title">Shared Services</div>
      {orgLv1.map(s => {
        const display = s.alias || s.name;
        return (
          <div
            key={s.name}
            className={`sb-item ${activeOrg === s.name && !activeProduct ? 'active' : ''}`}
            onClick={() => onSelectOrg(s.name)}
          >
            <span className="sb-dot" style={activeOrg === s.name ? { background: LV1_COLORS[display] || '#888' } : undefined} />
            {display}
          </div>
        );
      })}
    </div>
    <div className="sb-divider" />
    <div className="sb-section">
      <div className="sb-title">Product Owners</div>
      {poOwnerIds.map(owner => {
        const ownerGames = poGames.filter(g => g.ownerId === owner);
        return (
          <div key={owner}>
            <div
              className={`sb-item ${activeOrg === owner && !activeProduct ? 'active' : ''}`}
              onClick={() => onSelectOrg(owner)}
            >
              <span className="sb-dot" style={activeOrg === owner ? { background: GPD_PALETTES[owner]?.[0] || '#888' } : undefined} />
              {owner} <span className="sb-all-label">(all)</span>
            </div>
            {ownerGames.length > 0 && (
              <div className="sb-sub-items">
                {ownerGames.map(g => (
                  <div
                    key={g.gameName}
                    className={`sb-item-l2 ${activeProduct === g.gameName ? 'active' : ''}`}
                    onClick={() => onSelectGpdProduct(owner, g.gameName)}
                  >
                    {g.gameShort}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
    <div className="sb-divider" />
    <div className="sb-section">
      <div className="sb-title">Non-product</div>
      <div
        className={`sb-item ${activeOrg === npdKey ? 'active' : ''}`}
        onClick={() => onSelectOrg(npdKey)}
      >
        <span className="sb-dot" style={activeOrg === npdKey ? { background: NPC } : undefined} />
        Overview
      </div>
    </div>
  </nav>
);

export default Sidebar;
