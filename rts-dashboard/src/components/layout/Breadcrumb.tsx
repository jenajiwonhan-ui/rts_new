import React from 'react';

interface BreadcrumbProps {
  parts: string[];
  onHomeClick: () => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ parts, onHomeClick }) => (
  <div className="breadcrumb">
    {parts.map((p, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="bc-sep">›</span>}
        {i === parts.length - 1 ? (
          <span className="bc-cur">{p}</span>
        ) : (
          <span>{p}</span>
        )}
      </React.Fragment>
    ))}
  </div>
);

export default Breadcrumb;
