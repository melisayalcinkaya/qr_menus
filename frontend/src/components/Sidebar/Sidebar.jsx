import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/dashboard.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const Sidebar = ({ businessSlug }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const navigationItems = [
    {
      section: 'Yönetim',
      items: [
        { path: '/admin/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { path: '/admin/dashboard/business', icon: 'fas fa-building', label: 'İşletmeler' }
      ]
    },
    {
      section: 'İçerik',
      items: [
        { path: '/admin/dashboard/categories', icon: 'fas fa-list', label: 'Kategoriler & Ürünler' },
        { path: '/admin/dashboard/comments', icon: 'fas fa-comments', label: 'Yorumlar' },
        { path: `/admin/dashboard/${businessSlug}/waiter-calls`, icon: 'fas fa-bell', label: 'Garson Çağrıları' }
      ]
    },
    {
      section: 'Araçlar',
      items: [
        { path: '/admin/dashboard/qr', icon: 'fas fa-qrcode', label: 'QR Kodlar' },
        { path: '/admin/dashboard/wifi', icon: 'fas fa-wifi', label: 'WiFi Ayarları' },
        // { path: '/admin/dashboard/settings', icon: 'fas fa-cog', label: 'Ayarlar' }
      ]
    }
  ];

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-utensils"></i>
          <span>Restaurant Admin</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navigationItems.map((section, i) => (
          <div key={i} className="nav-section">
            <h4>{section.section}</h4>
            {section.items.map((item, j) => (
              <Link key={j} to={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <a href="/admin/login" className="logout-link">
          <i className="fas fa-sign-out-alt"></i>
          <span>Çıkış Yap</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
