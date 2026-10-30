import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../api'; // ✅ API dosyasından import edildi
import './Menu3Navbar.css';

const Menu3Navbar = () => {
  const [activePopup, setActivePopup] = useState(null);
  const [wifiInfo, setWifiInfo] = useState({ ssid: '', password: '', is_enabled: false });
  const [tableNumber, setTableNumber] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessSlug = searchParams.get("business");

  // WiFi bilgilerini çekme
  useEffect(() => {
    if (businessSlug && activePopup === 'wifi') {
      fetchBusinessWifiInfo();
    }
  }, [businessSlug, activePopup]);

  const fetchBusinessWifiInfo = async () => {
    try {
      const response = await API.get(`/public/wifi/${businessSlug}/`);
      setWifiInfo({
        ssid: response.data.ssid || '',
        password: response.data.password || '',
        is_enabled: response.data.is_enabled || false
      });
    } catch (err) {
      console.error("WiFi bilgisi alınamadı:", err);
      setWifiInfo({ ssid: '', password: '', is_enabled: false });
    }
  };

  const showPopup = (type) => {
    if (type === 'comments') {
      console.log('Business slug:', businessSlug);
      console.log('Navigating to:', `/menu3/comments?business=${businessSlug}`);
      
      if (!businessSlug) {
        alert("İşletme bilgisi bulunamadı. Lütfen sayfayı yenileyin.");
        return;
      }
      
      navigate(`/menu3/comments?business=${businessSlug}`);
      return;
    }
    setActivePopup(type);
  };

  const closePopup = () => {
    setActivePopup(null);
    setTableNumber("");
    setLocation("");
    setNotes("");
  };

  const handleCallWaiter = async () => {
    if (!tableNumber) {
      alert("Lütfen masa numarası giriniz.");
      return;
    }

    if (!businessSlug) {
      alert("İşletme bilgisi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }

    try {
      const response = await API.post(
        `/waiter-calls/public/`,
        {
          business_slug: businessSlug,
          table_number: tableNumber,
          location: location || null,
          notes: notes || null
        }
      );

      console.log("Garson çağrısı başarılı:", response.data);
      
      alert(`Garson çağrıldı! (Masa ${tableNumber}${location ? ` - ${location}` : ''})`);
      closePopup();
    } catch (err) {
      console.error("Garson çağırma hatası:", err);
      
      if (err.response?.status === 401) {
        alert("Yetkilendirme hatası. Lütfen backend permission ayarlarını kontrol edin.");
      } else if (err.response?.data) {
        const errorMsg = Object.values(err.response.data).join(', ');
        alert(`Hata: ${errorMsg}`);
      } else {
        alert("Garson çağrılırken hata oluştu. Lütfen daha sonra tekrar deneyin.");
      }
    }
  };

  const handleLanguageSelect = (lang) => {
    alert(`Dil ${lang} olarak ayarlandı.`);
    closePopup();
  };

  const handleHomeClick = () => {
    navigate(`/menu3?business=${businessSlug}`);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <button className="navbar-item active" onClick={handleHomeClick}>
            <div className="navbar-icon">🏠</div>
            <span>Ana Sayfa</span>
          </button>
          <button className="navbar-item" onClick={() => showPopup('comments')}>
            <div className="navbar-icon">💬</div>
            <span>Yorumlar</span>
          </button>
          <button className="navbar-item" onClick={() => showPopup('language')}>
            <div className="navbar-icon">🌐</div>
            <span>Dil</span>
          </button>
          <button className="navbar-item" onClick={() => showPopup('wifi')}>
            <div className="navbar-icon">📶</div>
            <span>WiFi</span>
          </button>
          <button className="navbar-item" onClick={() => showPopup('waiter')}>
            <div className="navbar-icon">🔔</div>
            <span>Garson</span>
          </button>
        </div>
      </nav>

      {/* Popup içerikleri (hiçbir değişiklik yapılmadı) */}
      {activePopup === 'language' && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closePopup}>&times;</button>
            <h3 className="popup-title">Dil Seçimi</h3>
            <div className="language-option" onClick={() => handleLanguageSelect('Türkçe')}>
              <span className="language-flag">🇹🇷</span>
              <span>Türkçe</span>
            </div>
            <div className="language-option" onClick={() => handleLanguageSelect('English')}>
              <span className="language-flag">🇺🇸</span>
              <span>English</span>
            </div>
            <div className="language-option" onClick={() => handleLanguageSelect('Deutsch')}>
              <span className="language-flag">🇩🇪</span>
              <span>Deutsch</span>
            </div>
            <div className="language-option" onClick={() => handleLanguageSelect('Français')}>
              <span className="language-flag">🇫🇷</span>
              <span>Français</span>
            </div>
          </div>
        </div>
      )}

      {activePopup === 'wifi' && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closePopup}>&times;</button>
            <h3 className="popup-title">WiFi Bilgileri</h3>
            {wifiInfo.is_enabled ? (
              <>
                <p className="popup-text"><strong>Ağ Adı:</strong> {wifiInfo.ssid}</p>
                <p className="popup-text"><strong>Şifre:</strong> {wifiInfo.password}</p>
                <p className="popup-text">Ücretsiz internet erişimi için yukarıdaki bilgileri kullanabilirsiniz.</p>
              </>
            ) : (
              <p className="popup-text">WiFi erişimi şu anda etkin değil.</p>
            )}
          </div>
        </div>
      )}

      {activePopup === 'waiter' && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closePopup}>&times;</button>
            <h3 className="popup-title">Garson Çağır</h3>
            <p className="popup-text">Masa numaranızı girin ve garson çağırın.</p>
            
            <div className="form-group">
              <label>Masa Numarası *</label>
              <input 
                type="text" 
                placeholder="Masa numarası" 
                className="table-number-input"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Lokasyon (Opsiyonel)</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="location-select"
              >
                <option value="">Seçiniz</option>
                <option value="İç Mekan">İç Mekan</option>
                <option value="Bahçe">Bahçe</option>
                <option value="Teras">Teras</option>
                <option value="Salon">Salon</option>
                <option value="Oda">Oda</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ek Not (Opsiyonel)</label>
              <textarea
                placeholder="Ek notunuz..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="notes-textarea"
              />
            </div>

            <div className="popup-actions">
              <button className="call-waiter-btn" onClick={handleCallWaiter}>
                Garson Çağır
              </button>
              <button className="cancel-btn" onClick={closePopup}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Menu3Navbar;
