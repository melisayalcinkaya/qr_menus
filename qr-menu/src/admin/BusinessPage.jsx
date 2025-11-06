import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar/Sidebar';
import '../../src/styles/business.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Environment variable'dan API URL'ini al
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token expiration
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

const BusinessPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: null
  });

  const fetchBusinesses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching businesses from:', `${API_BASE_URL}/api/businesses/`);
      const response = await API.get('businesses/');
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      // Response formatını kontrol et
      if (Array.isArray(response.data)) {
        setBusinesses(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        // Pagination kullanılıyorsa
        setBusinesses(response.data.results);
      } else if (response.data && typeof response.data === 'object') {
        // Object ise values'unu al
        setBusinesses(Object.values(response.data));
      } else {
        console.warn('Unexpected response format, using empty array');
        setBusinesses([]);
      }
    } catch (err) {
      console.error('Fetch error details:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.status === 401) {
        setError('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/admin/login';
      } else if (err.response?.status === 404) {
        setError('API endpoint bulunamadı. Lütfen bağlantıyı kontrol edin.');
      } else if (!err.response) {
        setError('Sunucuya bağlanılamıyor. API URL\'ini kontrol edin.');
      } else {
        setError(err.response?.data?.detail || 'İşletmeler yüklenemedi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const form = new FormData();
    form.append('name', formData.name);
    if (formData.logo) form.append('logo', formData.logo);

    try {
      if (editingBusiness) {
        await API.patch(`businesses/${editingBusiness.slug}/`, form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await API.post('businesses/', form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      await fetchBusinesses();
      setShowModal(false);
      setFormData({ name: '', logo: null });
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.detail || 
               err.response?.data?.message || 
               'İşlem başarısız oldu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (business) => {
    if (window.confirm(`${business.name} işletmesini silmek istediğinize emin misiniz?`)) {
      try {
        await API.delete(`businesses/${business.slug}/`);
        await fetchBusinesses();
      } catch (err) {
        console.error('Delete error:', err);
        setError(err.response?.data?.detail || 'Silme işlemi başarısız oldu');
      }
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Debug için API URL'ini göster
  console.log('API Base URL:', API_BASE_URL);

  return (
    <div className="categories-container">
      <Sidebar />
      
      <div className="categories-main">
        <header className="page-header">
          <div className="header-left">
            <h1>İşletme Yönetimi</h1>
            <p>İşletmelerinizi yönetin ve düzenleyin</p>
            {/* Debug info */}
            <small>
              API: {API_BASE_URL}
            </small>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => {
                setEditingBusiness(null);
                setFormData({ name: '', logo: null });
                setShowModal(true);
              }}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Yeni İşletme
                </>
              )}
            </button>
          </div>
        </header>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
            <button 
              onClick={() => setError(null)}
              
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        <div className="page-content">
          {isLoading && businesses.length === 0 ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Yükleniyor...</p>
            </div>
          ) : (
            <div className="categories-grid">
              {Array.isArray(businesses) && businesses.map(business => (
                <div key={`business-${business.id}`} className="category-card">
                  <div className="category-header">
                    {business.logo ? (
                      <img
                        src={business.logo}
                        alt={business.name}
                        className="category-banner"
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <i className="fas fa-building"></i>
                      </div>
                    )}
                  </div>

                  <div className="category-info">
                    <h3>{business.name}</h3>
                    <p className="slug-info">Slug: {business.slug}</p>
                    <p className="date-info">
                      Oluşturulma: {new Date(business.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="category-actions">
                    <button 
                      className="btn-icon btn-edit"
                      onClick={() => {
                        setEditingBusiness(business);
                        setFormData({ 
                          name: business.name, 
                          logo: null 
                        });
                        setShowModal(true);
                      }}
                      disabled={isLoading}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(business)}
                      disabled={isLoading}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!Array.isArray(businesses) || businesses.length === 0) && (
            <div className="empty-state">
              <i className="fas fa-building"></i>
              <h3>Henüz işletme eklenmedi</h3>
              <p>API Response: {typeof businesses}</p>
              <button 
                className="btn-primary" 
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-plus"></i> İşletme Ekle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !isLoading && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-building"></i>
                {editingBusiness ? 'İşletme Düzenle' : 'Yeni İşletme Ekle'}
              </h2>
              <button 
                className="btn-close" 
                onClick={() => !isLoading && setShowModal(false)}
                disabled={isLoading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>İşletme Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="İşletme adı"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label>Logo</label>
                <input
                  type="file"
                  onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
                  accept="image/*"
                  disabled={isLoading}
                />
                {formData.logo && (
                  <p className="file-info">Seçilen dosya: {formData.logo.name}</p>
                )}
                {editingBusiness?.logo && !formData.logo && (
                  <p className="file-info">Mevcut logo korunacak</p>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-save"></i>
                  )}
                  {' '}{editingBusiness ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPage;