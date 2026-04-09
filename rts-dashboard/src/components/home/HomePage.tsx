import React from 'react';

const HomePage: React.FC = () => (
  <div className="content">
    <div className="home-card">
      <div className="home-title">
        <h1>GP RTS Dashboard</h1>
      </div>

      <div className="home-section">
        <h3>
          <svg className="home-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5.5v3l2 1" />
          </svg>
          Quick Start
        </h3>
        <p>Select an organization from the sidebar to view the dashboard.</p>
      </div>

      <div className="home-section">
        <h3>
          <svg className="home-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2.5h7a1 1 0 011 1v9a1 1 0 01-1 1h-7a1 1 0 01-1-1v-9a1 1 0 011-1z" />
            <path d="M5.5 5.5h5M5.5 8h3.5M5.5 10.5h4.5" />
          </svg>
          Data Guidelines
        </h3>
        <ul>
          <li>Data is displayed as entered in RTS, with no additional processing or adjustments</li>
          <li>Scope is limited to GP's organizations and their assigned products</li>
          <li>Covers data from 2026 onwards</li>
          <li>Includes Primary Role data only</li>
        </ul>
      </div>

      <div className="home-section">
        <h3>
          <svg className="home-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="7.5" x2="8" y2="11" />
            <circle cx="8" cy="5.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          Questions & Feedback
        </h3>
        <p>Contact <a href="mailto:jiwon.han@krafton.com">@Jiwon Han</a> to report data errors or suggest improvements.</p>
      </div>
    </div>
  </div>
);

export default HomePage;
