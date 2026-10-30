import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./MakeCommentPage.css";

const API_BASE_URL = "http://localhost:8000/api";

const MakeCommentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const businessSlug = searchParams.get("business");

  const [userName, setUserName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!businessSlug) {
      setError("İşletme bilgisi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }

    if (!rating || !comment.trim()) {
      setError("Lütfen puan verip bir yorum yazın!");
      return;
    }

    const payload = {
      business_slug: businessSlug,
      user_name: userName || "Anonim",
      user_email: "guest@example.com",
      comment: comment,
      rating: rating,
    };

    try {
      console.log("Gönderilen veri:", payload);
      await axios.post(`${API_BASE_URL}/comments/`, payload);

      setUserName("");
      setComment("");
      setRating(0);
      setSuccess("Yorumunuz başarıyla gönderildi! Onaylandıktan sonra görüntülenecektir. 🎉");

      // 2 saniye sonra yorumlar sayfasına yönlendir
      setTimeout(() => {
        navigate(`/menu2/comments?business=${businessSlug}`);
      }, 2000);

    } catch (err) {
      console.error("Yorum gönderilirken hata:", err.response?.data || err.message);
      setError(
        err.response?.data?.business_slug
          ? Array.isArray(err.response.data.business_slug)
            ? err.response.data.business_slug[0]
            : err.response.data.business_slug
          : "Yorum gönderilemedi!"
      );
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= rating ? "star-filled" : "star-empty"}
        onClick={() => {
          setRating(star);
          setError("");
          setSuccess("");
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="comment-page-container">
      <div className="comment-page-header">
        <h2>Yorum Yap</h2>
      </div>

      <form onSubmit={handleSubmit} className="comment-form">
        <div className="rating-section">
          <h3>Puan Ver</h3>
          <div className="stars">{renderStars()}</div>
          {rating > 0 && <p>{rating} yıldız</p>}
        </div>

        <div className="comment-textarea-section">
          <h3>İsminiz</h3>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Adınız (isteğe bağlı)"
          />
          <h3>Yorumunuz</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Yorumunuzu yazın..."
            rows="6"
            required
          ></textarea>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" className="submit-comment-button">
          Yorumu Gönder
        </button>
      </form>

      <button 
        onClick={() => navigate(`/menu2/comments?business=${businessSlug}`)} 
        className="back-button"
      >
        Geri Dön
      </button>
    </div>
  );
};

export default MakeCommentPage;