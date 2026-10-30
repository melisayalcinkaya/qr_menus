import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar/Sidebar';
import '../styles/wifi-settings.css';
import API from '../API';

const WiFiSettingsPage = () => {
  const [wifiSettings, setWifiSettings] = useState({
    ssid: '',
    password: '',
    is_enabled: true,  // Varsayılan olarak true
  });

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingWifi, setLoadingWifi] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // İşletmeleri yükle
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await API.get('businesses/');
        
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          setBusinesses(res.data.results);
          if (res.data.results.length === 1) {
            setSelectedBusiness(res.data.results[0]);
          }
        } else {
          setError('İşletmeler yüklenirken format hatası oluştu');
          setBusinesses([]);
        }
      } catch (err) {
        console.error('İşletmeler yüklenirken hata:', err);
        setError('İşletmeler yüklenirken hata oluştu');
        setBusinesses([]);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, []);

  // Seçili işletmenin WiFi bilgilerini getir
  useEffect(() => {
    const fetchWifiInfo = async () => {
      if (!selectedBusiness) return;
      setLoadingWifi(true);
      
      try {
        const response = await API.get(
          `businesses/${selectedBusiness.slug}/wifi-info/`
        );
        
        console.log('WiFi bilgileri:', response.data);
        
        setWifiSettings({
          ssid: response.data.ssid || '',
          password: response.data.password || '',
          is_enabled: response.data.is_enabled ?? true,  // null ise true yap
        });
      } catch (err) {
        console.warn('WiFi bilgileri alınamadı, yeni WiFi kaydı oluşturulacak:', err);
        setWifiSettings({ ssid: '', password: '', is_enabled: true });
      } finally {
        setLoadingWifi(false);
      }
    };

    if (selectedBusiness) {
      fetchWifiInfo();
    }
  }, [selectedBusiness]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusiness) {
      alert('Lütfen bir işletme seçin!');
      return;
    }

    try {
      console.log('Gönderilen WiFi ayarları:', wifiSettings);
      
      // WiFi bilgilerini güncelle veya oluştur
      const response = await API.put(
        `businesses/${selectedBusiness.slug}/wifi-info/`,
        wifiSettings
      );

      console.log('Kayıt başarılı:', response.data);

      setIsEditing(false);
      setSuccessMessage('WiFi ayarları başarıyla kaydedildi!');
      
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert(`Kaydetme başarısız: ${err.response?.data?.detail || err.message}`);
      
      if (err.response?.data) {
        console.error('Hata detayları:', err.response.data);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setWifiSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    console.log('Input değişti:', name, type === 'checkbox' ? checked : value);
  };


  if (loadingBusinesses) {
    return (
      <div className="wifi-settings-container">
        <Sidebar />
        <div className="wifi-settings-main">
          <div className="loading">İşletmeler yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wifi-settings-container">
        <Sidebar />
        <div className="wifi-settings-main">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wifi-settings-container">
      <Sidebar />

      <div className="wifi-settings-main">
        <div className="page-header">
          <div className="header-left">
            <h1>WiFi Ayarları</h1>
            <p>Restoran WiFi ağınızı yapılandırın ve yönetin</p>
          </div>
        </div>

        {/* Başarı mesajı */}
        {successMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}

        {/* İşletme seçimi */}
        <div className="business-selection">
          <h3>İşletme Seçin</h3>
          <select
            className="business-select"
            value={selectedBusiness?.slug || ''}
            onChange={(e) => {
              const selected = businesses.find((b) => b.slug === e.target.value);
              setSelectedBusiness(selected || null);
              setIsEditing(false);
            }}
          >
            <option value="">-- İşletme Seçin --</option>
            {businesses.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* WiFi ayar formu */}
        {selectedBusiness ? (
          <div className="wifi-settings-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-wifi"></i> {selectedBusiness.name} - WiFi Bilgileri
              </h2>
              {!isEditing && !loadingWifi && (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  <i className="fas fa-edit"></i> Düzenle
                </button>
              )}
            </div>

            {loadingWifi ? (
              <div className="loading">WiFi bilgileri yükleniyor...</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Ağ Adı (SSID)</label>
                  <input
                    type="text"
                    name="ssid"
                    value={wifiSettings.ssid}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    placeholder="WiFi ağ adını girin"
                  />
                </div>

                <div className="form-group">
                  <label>Şifre</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={wifiSettings.password}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                      placeholder="WiFi şifresini girin"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword((s) => !s)}
                      disabled={!isEditing}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="form-checkboxes">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      name="is_enabled"
                      checked={wifiSettings.is_enabled}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                    <span className="checkmark"></span>
                    WiFi erişimini etkinleştir
                  </label>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setIsEditing(false);
                        // Formu resetle
                        setLoadingWifi(true);
                        axios.get(
                          `${API_BASE_URL}/businesses/${selectedBusiness.slug}/wifi-info/`,
                          { headers: authHeaders() }
                        )
                        .then(response => {
                          setWifiSettings({
                            ssid: response.data.ssid || '',
                            password: response.data.password || '',
                            is_enabled: response.data.is_enabled ?? true,
                          });
                        })
                        .catch(() => {
                          setWifiSettings({ ssid: '', password: '', is_enabled: true });
                        })
                        .finally(() => {
                          setLoadingWifi(false);
                        });
                      }}
                    >
                      İptal
                    </button>
                    <button type="submit" className="btn-save">
                      <i className="fas fa-save"></i> Kaydet
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Debug bilgisi */}
            <div className="debug-info">
              <small>
                İşletme: {selectedBusiness.name} (ID: {selectedBusiness.id}, Slug: {selectedBusiness.slug})
                <br />
                WiFi Durumu: {wifiSettings.is_enabled ? 'Aktif' : 'Pasif'}
                <br />
                SSID: {wifiSettings.ssid || 'Belirtilmemiş'}
              </small>
            </div>
          </div>
        ) : (
          <div className="no-business-selected">
            <div className="info-message">
              <i className="fas fa-info-circle"></i>
              <p>WiFi ayarlarını düzenlemek için lütfen bir işletme seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WiFiSettingsPage;