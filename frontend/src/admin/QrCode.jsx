import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar/Sidebar";
import "../../src/styles/qrcode.css"; // Stil dosyası eklendi

const QrCode = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedMenu, setSelectedMenu] = useState("menu_1");
  const [qrCode, setQrCode] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access");

  // İşletme listesini çek
  useEffect(() => {
    if (!token) {
      setError("Lütfen giriş yapın");
      return;
    }

    setIsLoading(true);
    axios
      .get("http://localhost:8000/api/businesses/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("API Yanıtı:", res.data);
        
        // Farklı response formatlarını handle et
        let businessData = [];
        if (Array.isArray(res.data)) {
          businessData = res.data;
        } else if (res.data.results && Array.isArray(res.data.results)) {
          businessData = res.data.results;
        } else if (typeof res.data === 'object') {
          businessData = [res.data];
        }
        
        setBusinesses(businessData);
        console.log("İşletmeler yüklendi:", businessData);
      })
      .catch((err) => {
        console.error("İşletme çekme hatası:", err);
        setError("İşletmeler yüklenirken hata oluştu");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

// QR oluşturma fonksiyonu
const generateQR = () => {
  if (!selectedBusiness) {
    alert("Lütfen bir işletme seçin!");
    return;
  }

  if (!token) {
    setError("Lütfen giriş yapın");
    return;
  }

  setIsLoading(true);
  setError("");

  // backend business_id bekliyorsa
  axios
    .post(
      "http://localhost:8000/api/qr/generate/",
      {
        business_id: selectedBusiness, // burada id gönderiyoruz
        menu_type: selectedMenu,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )
    .then((res) => {
      console.log("QR oluşturma başarılı:", res.data);
      setQrCode(res.data.qr_code);
      setQrUrl(res.data.url);
    })
    .catch((err) => {
      console.error("QR oluşturma hatası:", err.response?.data || err);
      setError(
        err.response?.data?.error || "QR oluşturulamadı. Lütfen tekrar deneyin."
      );
    })
    .finally(() => {
      setIsLoading(false);
    });
};


  // QR kodu indir
  const downloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrCode}`;
    link.download = `qrcode-${selectedMenu}-${selectedBusiness}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <Sidebar />
      
      <div className="page-main">
        <header className="page-header">
          <h1>QR Kod Oluştur</h1>
          <p>İşletmeniz için QR kod oluşturun ve müşterilerinizin menünüze erişmesini sağlayın</p>
        </header>

        <div className="qr-content">
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="qr-form">
            {/* İşletme seçimi */}
            <div className="form-group">
              <label>İşletme Seç *</label>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                disabled={isLoading || businesses.length === 0}
              >
                <option value="">İşletme Seçin</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slug})
                  </option>
                ))}
              </select>
              {businesses.length === 0 && !isLoading && (
                <small className="text-warning">
                  Henüz hiç işletmeniz bulunmamaktadır.
                </small>
              )}
            </div>

            {/* Menü tipi seçimi */}
            <div className="form-group">
              <label>Menü Tasarımı Seç</label>
              <select 
                value={selectedMenu} 
                onChange={(e) => setSelectedMenu(e.target.value)}
                disabled={isLoading}
              >
                <option value="menu_1">Menü 1</option>
                <option value="menu_2">Menü 2</option>
                <option value="menu_3">Menü 3</option>
              </select>
            </div>

            {/* QR kod oluştur butonu */}
            <button 
              onClick={generateQR} 
              disabled={isLoading || !selectedBusiness}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Oluşturuluyor...
                </>
              ) : (
                <>
                  <i className="fas fa-qrcode"></i> QR Kod Oluştur
                </>
              )}
            </button>
          </div>

          {/* QR kod görüntüleme */}
          {qrCode && (
            <div className="qr-result">
              <h3>QR Kodunuz Hazır!</h3>
              
              <div className="qr-image-container">
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="QR Code" 
                  className="qr-image"
                />
              </div>

              <div className="qr-info">
                <p>
                  <strong>URL:</strong> 
                  <a href={qrUrl} target="_blank" rel="noopener noreferrer">
                    {qrUrl}
                  </a>
                </p>
                <p>
                  <small>
                    Bu QR kodu müşterilerinizin menünüzü görüntülemesi için kullanabilirsiniz.
                  </small>
                </p>
              </div>

              <div className="qr-actions">
                <button onClick={downloadQR} className="btn-secondary">
                  <i className="fas fa-download"></i> QR Kodunu İndir
                </button>
                
                <button 
                  onClick={() => window.open(qrUrl, '_blank')}
                  className="btn-primary"
                >
                  <i className="fas fa-external-link-alt"></i> Menüyü Görüntüle
                </button>
              </div>
            </div>
          )}

          {isLoading && businesses.length === 0 && (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>İşletmeler yükleniyor...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCode;