import React from 'react';
import './SmartNotificationCenter.css';

const SmartNotificationCenter = () => {
  return (
    <div className="smart-notification-center">
      <h3>🔔 Smart Notification Center</h3>
      <p>Actionable alerts will appear here.</p>
      {/* Placeholder for notifications */}
      <div className="notification-list">
        <div className="notification-item">
          <span className="notification-icon">💡</span>
          <p>New order received! Table 5 needs attention.</p>
        </div>
        <div className="notification-item">
          <span className="notification-icon">⚠️</span>
          <p>Low stock alert: Coffee beans running low.</p>
        </div>
      </div>
    </div>
  );
};

export default SmartNotificationCenter;
