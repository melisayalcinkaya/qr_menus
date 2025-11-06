import { FaCommentDots, FaHandPaper, FaHome, FaWifi, FaGlobe, FaTimes } from 'react-icons/fa';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './BottomNavBar.module.css';
import API from '../../api'; // API.js üzerinden çağrı

const BottomNavBar = ({ activeTab, onTabChange }) => {
    const [showPopup, setShowPopup] = useState(null);
    const [wifiInfo, setWifiInfo] = useState({ ssid: '', password: '', is_enabled: false });
    const [tableNumber, setTableNumber] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const businessSlug = searchParams.get("business");

    // WiFi bilgilerini çekme
    useEffect(() => {
        if (businessSlug) {
            fetchBusinessWifiInfo();
        }
    }, [businessSlug]);

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

    const handleItemClick = (item) => {
        if (activeTab === item && (item !== 'home' && item !== 'comment')) {
            setShowPopup(null);
            return;
        }

        if (item === 'home') {
            navigate(`/menu2?business=${businessSlug}`);
            setShowPopup(null);
            onTabChange && onTabChange(item);
        } else if (item === "comment") {
            navigate(`/menu2/comments?business=${businessSlug}`);
        } else if (item === "make-comment") {
            navigate(`/menu2/make-comment?business=${businessSlug}`);
        } else {
            setShowPopup(item);
        }
    };

    const handlePopupClick = (e) => e.stopPropagation();

    const handleClosePopup = () => {
        setShowPopup(null);
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
            const response = await API.post("waiter-calls/public/", {
                business_slug: businessSlug,
                table_number: tableNumber,
                location: location || null,
                notes: notes || null
            });

            console.log("Garson çağrısı başarılı:", response.data);
            alert(`Garson çağrıldı! (Masa ${tableNumber}${location ? ` - ${location}` : ''})`);
            handleClosePopup();
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
        handleClosePopup();
    };

    return (
        <div className={styles.navBarContainer}>
            {/* Comment */}
            <div
                className={`${styles.navItem} ${activeTab === 'comment' ? styles.active : ''}`}
                onClick={() => handleItemClick('comment')}
            >
                <FaCommentDots />
            </div>

            {/* Waiter Call */}
            <div
                className={`${styles.navItem} ${showPopup === 'hand' ? styles.active : ''}`}
                onClick={() => handleItemClick('hand')}
            >
                <FaHandPaper />
                {showPopup === 'hand' && (
                    <div className={styles.popup} onClick={handlePopupClick}>
                        <div className={styles.popupHeader}>
                            <h4>Garson Çağrısı</h4>
                            <button className={styles.closeButton} onClick={handleClosePopup}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Masa Numarası *</label>
                            <input
                                type="text"
                                placeholder="Masa numarası"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                required
                                className={styles.inputField}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Lokasyon (Opsiyonel)</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className={styles.selectField}
                            >
                                <option value="">Seçiniz</option>
                                <option value="İç Mekan">İç Mekan</option>
                                <option value="Bahçe">Bahçe</option>
                                <option value="Teras">Teras</option>
                                <option value="Salon">Salon</option>
                                <option value="Oda">Oda</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Ek Not (Opsiyonel)</label>
                            <textarea
                                placeholder="Ek notunuz..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="2"
                                className={styles.textareaField}
                            />
                        </div>
                        <div className={styles.popupActions}>
                            <button 
                                type="button"
                                onClick={handleCallWaiter} 
                                className={styles.callButton}
                            >
                                Garson Çağır
                            </button>
                            <button 
                                type="button"
                                onClick={handleClosePopup} 
                                className={styles.cancelCallButton}
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Home */}
            <div
                className={`${styles.navItem} ${activeTab === 'home' ? styles.active : ''}`}
                onClick={() => handleItemClick('home')}
            >
                <FaHome />
            </div>

            {/* Wifi */}
            <div
                className={`${styles.navItem} ${showPopup === 'wifi' ? styles.active : ''}`}
                onClick={() => handleItemClick('wifi')}
            >
                <FaWifi />
                {showPopup === 'wifi' && (
                    <div className={styles.popup} onClick={handlePopupClick}>
                        <div className={styles.popupHeader}>
                            <h4>Wi-Fi Bilgisi</h4>
                            <button className={styles.closeButton} onClick={handleClosePopup}>
                                <FaTimes />
                            </button>
                        </div>
                        {wifiInfo.is_enabled ? (
                            <>
                                <p><strong>SSID:</strong> {wifiInfo.ssid}</p>
                                <p><strong>Şifre:</strong> {wifiInfo.password}</p>
                            </>
                        ) : (
                            <p>WiFi erişimi etkin değil</p>
                        )}
                    </div>
                )}
            </div>

            {/* Globe / Language */}
            <div
                className={`${styles.navItem} ${showPopup === 'globe' ? styles.active : ''}`}
                onClick={() => handleItemClick('globe')}
            >
                <FaGlobe />
                {showPopup === 'globe' && (
                    <div className={styles.popup} onClick={handlePopupClick}>
                        <div className={styles.popupHeader}>
                            <h4>Dil Seçimi</h4>
                            <button className={styles.closeButton} onClick={handleClosePopup}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.languageOption} onClick={() => handleLanguageSelect('Türkçe')}>🇹🇷 Türkçe</div>
                        <div className={styles.languageOption} onClick={() => handleLanguageSelect('English')}>🇬🇧 English</div>
                        <div className={styles.languageOption} onClick={() => handleLanguageSelect('Français')}>🇫🇷 Français</div>
                        <div className={styles.languageOption} onClick={() => handleLanguageSelect('Deutsch')}>🇩🇪 Deutsch</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BottomNavBar;
