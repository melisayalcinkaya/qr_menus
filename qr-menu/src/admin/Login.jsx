import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../src/styles/login.css";
import API from "../API";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessages([]);

    try {
      const response = await API.post("token/", {
        username: formData.username,
        password: formData.password,
      });

      // Token'ları localStorage'a kaydet
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      // Başarılıysa dashboard'a yönlendir
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error.response?.data);
      setMessages([
        {
          type: "error",
          text:
            error.response?.data?.detail ||
            "Giriş başarısız. Bilgilerinizi kontrol edin.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return (
    <div className="container">
      <div className="brand-section">
        <div className="brand-logo">📱</div>
        <h1 className="brand-title">QR Menu</h1>
        <p className="brand-subtitle">
          Dijital menü yönetim sisteminizle işletmenizi modernleştirin ve müşteri
          deneyimini geliştirin.
        </p>
      </div>

      <div className="form-section">
        {messages.length > 0 && (
          <div className="message-area">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`alert alert-${msg.type}`}
                onClick={clearMessages}
                style={{ cursor: "pointer" }}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}

        {isForgotPassword ? (
          <div>
            {/* Şifre sıfırlama formu eklenebilir */}
          </div>
        ) : (
          <form className="form-container active" onSubmit={handleLoginSubmit}>
            <h2 className="form-title">Giriş Yap</h2>
            <p className="form-subtitle">
              Hesabınıza giriş yaparak yönetim panelinize erişin
            </p>

            <div className="form-group">
              <label className="form-label">Kullanıcı Adı</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Kullanıcı Adı"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Şifre</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="forgot-password">
              <span
                onClick={() => setIsForgotPassword(true)}
                style={{ cursor: "pointer" }}
              >
                Şifremi unuttum
              </span>
            </div>

            <button type="submit" className="form-button" disabled={isLoading}>
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>

            <p className="form-toggle">
              Hesabınız yok mu?{" "}
              <span
                onClick={() => navigate("/admin/register")}
                style={{ cursor: "pointer", color: "#667eea" }}
              >
                Kayıt ol
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;