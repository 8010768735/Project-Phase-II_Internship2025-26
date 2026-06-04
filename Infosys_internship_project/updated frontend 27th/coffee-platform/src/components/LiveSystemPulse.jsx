import React from 'react';
import './LiveSystemPulse.css';

const LiveSystemPulse = () => {
  // Placeholder data for system pulse
  const cafeLoad = 75; // percentage
  const kitchenLoad = 60; // percentage
  const serviceDelayRisk = 15; // percentage

  return (
    <div className="live-system-pulse">
      <h3>📊 Live System Pulse</h3>
      <div className="pulse-metrics">
        <div className="metric-item">
          <p className="metric-label">Cafe Load</p>
          <p className="metric-value">{cafeLoad}%</p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${cafeLoad}%`, backgroundColor: cafeLoad > 80 ? '#dc3545' : '#28a745' }}></div>
          </div>
        </div>
        <div className="metric-item">
          <p className="metric-label">Kitchen Load</p>
          <p className="metric-value">{kitchenLoad}%</p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${kitchenLoad}%`, backgroundColor: kitchenLoad > 70 ? '#ffc107' : '#28a745' }}></div>
          </div>
        </div>
        <div className="metric-item">
          <p className="metric-label">Service Delay Risk</p>
          <p className="metric-value">{serviceDelayRisk}%</p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${serviceDelayRisk}%`, backgroundColor: serviceDelayRisk > 20 ? '#ffc107' : '#28a745' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSystemPulse;
