import React from 'react';

const HomePage: React.FC = () => (
  <div className="content">
    <div className="home-card">
      <div className="home-title">
        <img src="/favicon.svg" alt="" className="home-logo" />
        <h1>Welcome to GP RTS Dashboard</h1>
      </div>

      <div className="home-section">
        <h3>
          <svg className="home-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 1.5L4 9h4l-1 5.5L12 7H8z" />
          </svg>
          Quick Start
        </h3>
        <p>Select an organization from the sidebar to view the dashboard.</p>
      </div>

      <div className="home-section">
        <h3>
          <svg className="home-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="12" height="12" rx="2" /><path d="M5 6h6M5 8.5h4M5 11h5" />
          </svg>
          Data Guidelines
        </h3>
        <ul>
          <li>Data is displayed as entered in RTS, with no additional processing or adjustments</li>
          <li>Scope is limited to GP's organizations and their assigned products</li>
          <li>Covers data from 2026 onwards</li>
          <li>Includes Primary Role (주직) data only</li>
        </ul>
      </div>

      <div className="home-section">
        <h3>
          <svg className="home-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5" /><path d="M6 6.5a2 2 0 1 1 2 2v1" /><circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          Questions & Feedback
        </h3>
        <p>Contact <a href="mailto:jiwon.han@krafton.com">@Jiwon Han</a> to report data errors or suggest improvements.</p>
      </div>
    </div>
  </div>
);

export default HomePage;
