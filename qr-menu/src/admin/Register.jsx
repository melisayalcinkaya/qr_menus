import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../src/styles/login.css";

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Çerez adıyla başlıyorsa al
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const username = e.target.username.value;
        const email = e.target.email.value;
        const password1 = e.target.password1.value;
        const password2 = e.target.password2.value;

        if (password1 !== password2) {
            alert("Şifreler eşleşmiyor!");
            return;
        }

        try {
            const csrfToken = getCookie("csrftoken");

            const response = await fetch("http://localhost:8000/api/register/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username,
                email,
                password1,
                password2,
              }),
            });

            if (response.ok) {
                navigate("/admin/Login"); // ✅ Mutlak yol
            }else {
                const data = await response.json();
                alert("Kayıt başarısız: " + JSON.stringify(data));
            }
        } catch (error) {
            alert("Sunucu hatası: " + error.message);
        }
    };


  return (
    <div className="container">
      <div className="brand-section">
        <div className="brand-logo">📱</div>
        <h1 className="brand-title">QR Menu</h1>
        <p className="brand-subtitle">
          Dijital menü yönetim sisteminizle işletmenizi modernleştirin ve müşteri deneyimini geliştirin.
        </p>
      </div>

      {message && (
        <div className="message-area">
          <div className="alert alert-error">{message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-container active">
            <h2 className="form-title">Kayıt Ol</h2>
            <p className="form-subtitle">
              Yeni hesap oluşturun ve QR Menu'yu kullanmaya başlayın
            </p>

            <div className="form-group">
              <label className="form-label">Kullanıcı Adı</label>
              <input
                type="text"
                className="form-input"
                name="username"
                placeholder="Kullanıcı Adınız"
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-posta Adresi</label>
              <input
                type="email"
                className="form-input"
                name="email"
                placeholder="ornek@email.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Şifre</label>
              <input
                type="password"
                className="form-input"
                name="password1"
                placeholder="En az 8 karakter"
                required
                minLength="8"
                value={formData.password1}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Şifre Tekrar</label>
              <input
                type="password"
                className="form-input"
                name="password2"
                placeholder="Şifrenizi tekrar girin"
                required
                value={formData.password2}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="form-button">
              Hesap Oluştur
            </button>

            <p className="form-toggle">
              Zaten hesabınız var mı?{" "}
            <span 
              style={{ cursor: "pointer", color: "#007bff" }}
              onClick={() => navigate("/admin/login")} // ✅ Mutlak yol
            >
              Giriş yap
            </span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Register;
