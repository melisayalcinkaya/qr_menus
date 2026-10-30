import React from 'react';
import './WelcomeBanner.css';

const WelcomeBanner = ({ companyName = 'Firma' }) => {
  return (
    <div className="welcome-banner">
      <div className="banner-content">
        <h1 className="banner-title">{companyName}</h1>
        <p className="banner-subtitle">Hoşgeldiniz</p>
        <p className="banner-description">Lezzetli menümüzü keşfedin</p>
      </div>
      <div className="banner-logo">
        <div className="banner-logo-inner"></div>
      </div>
    </div>
  );
};

export default WelcomeBanner;