import React from 'react';

const LoadingSpinner = ({ text = 'جارِ التحميل...' }) => (
  <div className="loading-spinner-wrapper">
    <div className="loading-spinner"></div>
    <p className="loading-text">{text}</p>
  </div>
);

export default LoadingSpinner;
