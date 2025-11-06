// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import "../../src/styles/dashboard.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link } from "react-router-dom";
import API from "../API";

const Dashboard = () => {
  const [categoryCount, setCategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [wifiCount, setWifiCount] = useState(0);
  const [businessCount, setBusinessCount] = useState(0);
  const [waiterCallCount, setWaiterCallCount] = useState(0);
  const [businessSlug, setBusinessSlug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await API.get("user-info/"); // backend endpoint’in
        setUser(res.data);
      } catch (error) {
        console.error("Kullanıcı bilgisi alınamadı:", error);
      }
    };

    fetchUserInfo();
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Tüm API çağrılarını paralel yapalım
        const [
          businessRes, 
          categoryRes, 
          productRes, 
          commentRes
        ] = await Promise.allSettled([
          API.get("businesses/"),
          API.get("categories/"),
          API.get("products/"),
          API.get("comments/")
        ]);

        // İşletmeler - results içinde geliyor
        if (businessRes.status === 'fulfilled') {
          const businessData = businessRes.value.data;
          const businesses = businessData.results || businessData;
          setBusinessCount(Array.isArray(businesses) ? businesses.length : 0);
          
          if (businesses.length > 0) {
            const slug = businesses[0].slug;
            setBusinessSlug(slug);

            // WiFi ve garson çağrılarını bu işletme için çek
            try {
              const [wifiRes, waiterRes] = await Promise.allSettled([
                API.get(`businesses/${slug}/wifi-info/`),
                API.get(`businesses/${slug}/waiter-calls/`)
              ]);

              if (wifiRes.status === 'fulfilled') {
                setWifiCount(wifiRes.value.data ? 1 : 0);
              }

              if (waiterRes.status === 'fulfilled') {
                const waiterData = waiterRes.value.data;
                const waiterCalls = waiterData.results || waiterData;
                setWaiterCallCount(Array.isArray(waiterCalls) ? waiterCalls.length : 0);
              }
            } catch (error) {
              console.error("İşletme detay hatası:", error);
            }
          }
        }

        // Kategoriler - results içinde geliyor
        if (categoryRes.status === 'fulfilled') {
          const categoryData = categoryRes.value.data;
          const categories = categoryData.results || categoryData;
          setCategoryCount(Array.isArray(categories) ? categories.length : 0);
        }

        // Ürünler - results içinde geliyor
        if (productRes.status === 'fulfilled') {
          const productData = productRes.value.data;
          const products = productData.results || productData;
          setProductCount(Array.isArray(products) ? products.length : 0);
        }

        // Yorumlar - results içinde geliyor
        if (commentRes.status === 'fulfilled') {
          const commentData = commentRes.value.data;
          const comments = commentData.results || commentData;
          setCommentCount(Array.isArray(comments) ? comments.length : 0);
        }

      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-main">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Veriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Hoş geldiniz! Restoran yönetim paneline.</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-details">
                <span className="user-name">{user ? user.username : "Yükleniyor..."}</span>
                <span className="user-role">Yönetici</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* İstatistik Kartları */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon business">
                <i className="fas fa-building"></i>
              </div>
              <div className="stat-info">
                <h3>{businessCount}</h3>
                <p>İşletmeler</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon categories">
                <i className="fas fa-list"></i>
              </div>
              <div className="stat-info">
                <h3>{categoryCount}</h3>
                <p>Kategoriler</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon products">
                <i className="fas fa-hamburger"></i>
              </div>
              <div className="stat-info">
                <h3>{productCount}</h3>
                <p>Ürünler</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon comments">
                <i className="fas fa-comments"></i>
              </div>
              <div className="stat-info">
                <h3>{commentCount}</h3>
                <p>Yorumlar</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon wifi">
                <i className="fas fa-wifi"></i>
              </div>
              <div className="stat-info">
                <h3>{wifiCount}</h3>
                <p>WiFi Ağı</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon waiter">
                <i className="fas fa-bell"></i>
              </div>
              <div className="stat-info">
                <h3>{waiterCallCount}</h3>
                <p>Garson Çağrıları</p>
              </div>
            </div>
          </div>

          {/* Yönlendirme Kartları */}
          <div className="action-cards-grid">
            <Link
              to="/admin/dashboard/business"
              className="action-card large-card"
            >
              <div className="action-card-header">
                <div className="action-icon business">
                  <i className="fas fa-building"></i>
                </div>
                <h3>İşletme Yönetimi</h3>
              </div>
              <p>
                Yeni işletme ekle, mevcut işletmeleri düzenle ve işletme
                bilgilerini güncelle
              </p>
              <div className="card-footer">
                <span>Yönet</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </Link>

            <Link
              to="/admin/dashboard/categories"
              className="action-card large-card"
            >
              <div className="action-card-header">
                <div className="action-icon categories">
                  <i className="fas fa-list"></i>
                </div>
                <h3>Kategorileri Yönet</h3>
              </div>
              <p>
                Menü kategorilerini düzenle, yeni kategoriler ekle ve mevcut
                kategorileri güncelle
              </p>
              <div className="card-footer">
                <span>Yönet</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </Link>

            {businessSlug && (
              <Link
                to={`/admin/dashboard/${businessSlug}/products`}
                className="action-card large-card"
              >
                <div className="action-card-header">
                  <div className="action-icon products">
                    <i className="fas fa-hamburger"></i>
                  </div>
                  <h3>Ürün Yönetimi</h3>
                </div>
                <p>
                  Menüdeki tüm ürünleri düzenle, fiyatları güncelle ve yeni
                  ürünler ekle
                </p>
                <div className="card-footer">
                  <span>Yönet</span>
                  <i className="fas fa-arrow-right"></i>
                </div>
              </Link>
            )}

            <Link to="/admin/dashboard/comments" className="action-card">
              <div className="action-card-header">
                <div className="action-icon comments">
                  <i className="fas fa-comments"></i>
                </div>
                <h3>Yorumlar</h3>
              </div>
              <p>Müşteri yorumlarını incele ve yönet</p>
              <div className="card-footer">
                <span>İncele</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </Link>

            {businessSlug && (
              <Link 
                to={`/admin/dashboard/${businessSlug}/wifi`} 
                className="action-card"
              >
                <div className="action-card-header">
                  <div className="action-icon wifi">
                    <i className="fas fa-wifi"></i>
                  </div>
                  <h3>WiFi Ayarları</h3>
                </div>
                <p>Restoran WiFi ağını yapılandır ve yönet</p>
                <div className="card-footer">
                  <span>Ayarla</span>
                  <i className="fas fa-arrow-right"></i>
                </div>
              </Link>
            )}

            {businessSlug && (
              <Link 
                to={`/admin/dashboard/qr`} 
                className="action-card"
              >
                <div className="action-card-header">
                  <div className="action-icon qr">
                    <i className="fas fa-qrcode"></i>
                  </div>
                  <h3>QR Kodlar</h3>
                </div>
                <p>Dijital menü QR kodlarını oluştur</p>
                <div className="card-footer">
                  <span>Oluştur</span>
                  <i className="fas fa-arrow-right"></i>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;