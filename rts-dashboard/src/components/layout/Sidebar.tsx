import React from 'react';
import { LV1_COLORS } from '../../utils/colors';

interface SidebarProps {
  activeOrg: string | null;
  onSelectOrg: (org: string) => void;
  onHome: () => void;
}

const SERVICES = [
  { name: 'EPS', color: LV1_COLORS.EPS },
  { name: 'WPS', color: LV1_COLORS.WPS },
  { name: 'NAPS', color: LV1_COLORS.NAPS },
  { name: 'PSM', color: LV1_COLORS.PSM },
  { name: 'GCD', color: LV1_COLORS.GCD },
];

const OWNERS = [
  { name: 'GPD1', color: '#73b7c5' },
  { name: 'GPD2', color: '#d59875' },
  { name: 'GPD3', color: '#b0b474' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeOrg, onSelectOrg, onHome }) => (
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
      {SERVICES.map(s => (
        <div
          key={s.name}
          className={`sb-item ${activeOrg === s.name ? 'active' : ''}`}
          onClick={() => onSelectOrg(s.name)}
        >
          <span className="sb-icon" style={{ background: s.color }} />
          {s.name}
        </div>
      ))}
    </div>
    <div className="sb-section">
      <div className="sb-title">Product Owners</div>
      {OWNERS.map(o => (
        <div
          key={o.name}
          className={`sb-item ${activeOrg === o.name ? 'active' : ''}`}
          onClick={() => onSelectOrg(o.name)}
        >
          <span className="sb-icon" style={{ background: o.color }} />
          {o.name}
        </div>
      ))}
    </div>
  </nav>
);

export default Sidebar;
