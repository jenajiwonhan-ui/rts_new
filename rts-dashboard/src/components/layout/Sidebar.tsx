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
}

const Sidebar: React.FC<SidebarProps> = ({ activeOrg, activeProduct, onSelectOrg, onSelectGpdProduct, orgLv1, poOwnerIds, poGames, npdKey }) => (
  <nav className="sidebar">
    <div className="sb-section">
      <div className="sb-title">Shared Services</div>
      {orgLv1.map(s => {
        const display = s.alias || s.name;
        return (
          <div
            key={s.name}
            className={`sb-item ${activeOrg === s.name ? 'active' : ''}`}
            onClick={() => onSelectOrg(s.name)}
          >
            <span className="sb-icon" style={{ background: LV1_COLORS[display] || '#888' }} />
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
              <span className="sb-icon" style={{ background: GPD_PALETTES[owner]?.[0] || '#888' }} />
              {owner} <span className="sb-all-label">(all products)</span>
            </div>
            {ownerGames.length > 0 && (
              <div className="sb-sub-items">
                {ownerGames.map(g => (
                  <div
                    key={g.gameName}
                    className={`sb-sub-item ${activeProduct === g.gameName ? 'active' : ''}`}
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
        <span className="sb-icon" style={{ background: NPC }} />
        Overview
      </div>
    </div>
  </nav>
);

export default Sidebar;
