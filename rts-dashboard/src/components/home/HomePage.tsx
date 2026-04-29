import React from 'react';

const NEW_URL = 'https://gp-rts-dashboard.krafton.run/';

const HomePage: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--color-page-bg)',
    padding: '40px 24px',
    fontFamily: 'var(--f)',
  }}>
    <div style={{
      background: 'var(--color-card-bg)',
      borderRadius: 'var(--radius-panel)',
      boxShadow: 'var(--shadow-panel)',
      padding: '48px 56px',
      maxWidth: '520px',
      width: '100%',
      textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '16px',
        background: 'var(--color-accent-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </div>

      {/* Heading */}
      <h1 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        marginBottom: '10px',
        letterSpacing: '-0.3px',
      }}>
        We've Moved!
      </h1>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.7,
        marginBottom: '32px',
      }}>
        The GP RTS Dashboard is now accessible at a new URL.<br />
        <a
          href={NEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-brand-primary)', textDecoration: 'none', fontWeight: 500 }}
        >
          {NEW_URL}
        </a>
      </p>

      {/* CTA Button */}
      <a
        href={NEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--color-brand-primary)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          padding: '12px 24px',
          borderRadius: 'var(--radius-item)',
          transition: 'background 0.15s',
          marginBottom: '20px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-brand-dark)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-brand-primary)')}
      >
        Visit New Dashboard
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>

    </div>
  </div>
);

export default HomePage;
