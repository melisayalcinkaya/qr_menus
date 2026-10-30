// src/admin/AdminDashboardLayout.jsx
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import '../styles/dashboard.css';

const AdminDashboardLayout = () => {
  const { businessSlug } = useParams();

  return (
    <div className="dashboard-container">
      <Sidebar businessSlug={businessSlug} />
      <div className="dashboard-main">
        <Outlet context={{ businessSlug }} />
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
