import React from 'react';
import { LV1_COLORS, GPD_PALETTES } from '../../utils/colors';
import type { OrgNode } from '../../types';

interface SidebarProps {
  activeOrg: string | null;
  onSelectOrg: (org: string) => void;
  onHome: () => void;
  orgLv1: OrgNode[];
  poOwnerIds: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeOrg, onSelectOrg, onHome, orgLv1, poOwnerIds }) => (
  <nav className="sidebar">
    <div className="sb-section">
      <div
        className={`sb-item sb-home ${activeOrg === null ? 'active' : ''}`}
        onClick={onHome}
      >
        <span className="sb-icon" style={{ background: 'var(--accent)' }} />
        Home
      </div>
    </div>
    <div className="sb-section">
      <div className="sb-title">Shared Services</div>
      {orgLv1.map(s => (
        <div
          key={s.name}
          className={`sb-item ${activeOrg === s.name ? 'active' : ''}`}
          onClick={() => onSelectOrg(s.name)}
        >
          <span className="sb-icon" style={{ background: LV1_COLORS[s.name] || '#888' }} />
          {s.name}
        </div>
      ))}
    </div>
    <div className="sb-section">
      <div className="sb-title">Product Owners</div>
      {poOwnerIds.map(owner => (
        <div
          key={owner}
          className={`sb-item ${activeOrg === owner ? 'active' : ''}`}
          onClick={() => onSelectOrg(owner)}
        >
          <span className="sb-icon" style={{ background: GPD_PALETTES[owner]?.[0] || '#888' }} />
          {owner}
        </div>
      ))}
    </div>
  </nav>
);

export default Sidebar;
