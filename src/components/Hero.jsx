import React from 'react';

export default function Hero({ stats }) {
  return (
    <section className="hero">
      <h1 className="hero-title">
        Excellence in Learning with <br />
        <span className="hero-gradient-text">VGU Study Hub</span>
      </h1>
      <p className="hero-subtitle">
        Access previous year questions, lecture notes, lab manuals, and guides shared by your fellow Vivekananda Global University students. Join the community to collaborate!
      </p>

      <div className="hero-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.totalNotes}</span>
          <span className="stat-label">Notes & Materials</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalPyqs}</span>
          <span className="stat-label">Previous Year Questions</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalDownloads}</span>
          <span className="stat-label">Total Downloads</span>
        </div>
      </div>
    </section>
  );
}
