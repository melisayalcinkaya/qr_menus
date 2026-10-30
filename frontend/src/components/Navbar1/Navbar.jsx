import React, { useState } from "react";
import { FaHome, FaCommentDots, FaGlobe, FaWifi, FaConciergeBell } from "react-icons/fa";
import "./Navbar.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../API"; // API.js import edildi

const Navbar = () => {
  const [active, setActive] = useState("home");
  const [showLanguage, setShowLanguage] = useState(false);
  const [showWifi, setShowWifi] = useState(false);
  const [showWaiter, setShowWaiter] = useState(false);
  const [wifiInfo, setWifiInfo] = useState({ ssid: '', password: '', is_enabled: false });
  const [tableNumber, setTableNumber] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessSlug = searchParams.get("business");

  const handleClick = (id) => {
    setActive(id);
    if (id === "home") navigate(`/menu1?business=${businessSlug}`); // ✅ parametre ismi düzeltildi
    if (id === "chat") navigate(`/menu1/comments?business=${businessSlug}`);
    if (id === "language") setShowLanguage(!showLanguage);
    if (id === "wifi") {
      setShowWifi(!showWifi);
      if (businessSlug && !showWifi) {
        fetchBusinessWifiInfo();
      }
    }
    if (id === "waiter") setShowWaiter(true);
  };

  const fetchBusinessWifiInfo = async () => {
    try {
      const response = await API.get(`public/wifi/${businessSlug}/`);
      
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
      const response = await API.post("waiter-calls/public/", {
        business_slug: businessSlug,
        table_number: tableNumber,
        location: location || null,
        notes: notes || null
      });

      console.log("Garson çağrısı başarılı:", response.data);
      
      alert(`Garson çağrıldı! (Masa ${tableNumber}${location ? ` - ${location}` : ''})`);
      setShowWaiter(false);
      setTableNumber("");
      setLocation("");
      setNotes("");
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

  return (
    <>
      <div className="navbar-container-1">
        <button
          onClick={() => handleClick("home")}
          className={`nav-item-1 ${active === "home" ? "active" : ""}`}
        >
          <span className="icon-1"><FaHome /></span>
          {active === "home" && <span className="label-1">Home</span>}
        </button>

        <button
          onClick={() => handleClick("chat")}
          className={`nav-item-1 ${active === "chat" ? "active" : ""}`}
        >
          <span className="icon-1"><FaCommentDots /></span>
        </button>

        <button
          onClick={() => handleClick("language")}
          className={`nav-item-1 ${active === "language" ? "active" : ""}`}
        >
          <span className="icon-1"><FaGlobe /></span>
        </button>

        <button
          onClick={() => handleClick("wifi")}
          className={`nav-item-1 ${active === "wifi" ? "active" : ""}`}
        >
          <span className="icon-1"><FaWifi /></span>
        </button>

        <button
          onClick={() => handleClick("waiter")}
          className={`nav-item-1 ${active === "waiter" ? "active" : ""}`}
        >
          <span className="icon-1"><FaConciergeBell /></span>
        </button>
      </div>

      {/* WIFI BİLGİSİ */}
      {showWifi && (
        <div className="popup-1">
          <h4>Wi-Fi Bilgisi</h4>
          {wifiInfo.is_enabled ? (
            <>
              <p><strong>SSID:</strong> {wifiInfo.ssid}</p>
              <p><strong>Şifre:</strong> {wifiInfo.password}</p>
            </>
          ) : (
            <p>WiFi erişimi etkin değil</p>
          )}
          <button onClick={() => setShowWifi(false)}>Kapat</button>
        </div>
      )}

      {/* GARSON ÇAĞIR */}
      {showWaiter && (
        <div className="popup-1">
          <h4>Garson Çağrısı</h4>
          
          <div className="form-group">
            <label>Masa Numarası *</label>
            <input
              type="text"
              placeholder="Masa numarası"
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
            />
          </div>

          <div className="popup-actions">
            <button onClick={handleCallWaiter} className="btn-primary">
              Garson Çağır
            </button>
            <button onClick={() => setShowWaiter(false)} className="btn-secondary">
              İptal
            </button>
          </div>
        </div>
      )}

      {/* DİL SEÇİMİ */}
      {showLanguage && (
        <div className="popup-1">
          <h4>Dil Seçimi</h4>
          <div className="language-options-1">
            <button>🇹🇷 Türkçe</button>
            <button>🇬🇧 English</button>
            <button>🇫🇷 Français</button>
            <button>🇩🇪 Deutsch</button>
            <button onClick={() => setShowLanguage(false)}>Kapat</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
