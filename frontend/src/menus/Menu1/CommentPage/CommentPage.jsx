import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import "./CommentPage.css";

const CommentPage = () => {
  const [searchParams] = useSearchParams();
  const businessSlug = searchParams.get("business");

  const [comments, setComments] = useState([]);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // ✅ başarı mesajı için yeni state

  const API_BASE_URL = "http://localhost:8000/api";

  const fetchComments = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/comments/?business=${businessSlug}`
      );
      const commentsData = res.data.results || []; 
    
      const approvedComments = commentsData.filter(
          comment => comment.status === 'approved'
      );
      setComments(approvedComments);
    } catch (err) {
      console.error("Yorumlar alınamadı:", err);
    }
  };

  useEffect(() => {
    if (businessSlug) fetchComments();
    else console.error("businessSlug is undefined!");
  }, [businessSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!businessSlug) {
      setError("İşletme bilgisi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }

    const payload = {
      business_slug: businessSlug,
      user_name: author || "Anonim",
      user_email: "guest@example.com",
      comment: text,
      rating: rating,
    };

    try {
      await axios.post(`${API_BASE_URL}/comments/`, payload);
      setText("");
      setAuthor("");
      setRating(0);
      fetchComments();
      setSuccess("Yorumunuz başarıyla gönderildi! 🎉"); // ✅ başarı mesajı
    } catch (err) {
      console.error("Comment error:", err.response?.data || err.message);
      setError(
        err.response?.data?.business_slug
          ? Array.isArray(err.response.data.business_slug)
            ? err.response.data.business_slug[0]
            : err.response.data.business_slug
          : "Yorum gönderilemedi!"
      );
    }
  };

  const handleStarClick = (value) => {
    setRating(value);
    setError("");
    setSuccess("");
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((val) => (
      <span
        key={val}
        className={`star ${rating >= val ? "filled" : ""}`}
        onClick={() => handleStarClick(val)}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="comment-page-menu1">
      <h2 className="comment-title-menu1">Yorumlar</h2>

      <div className="comment-input-container-menu1">
        <form onSubmit={handleSubmit} className="comment-form-menu1">
          <input
            type="text"
            placeholder="Adınız"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <textarea
            placeholder="Yorumunuz"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows="4"
          />
          <div className="rating-section-menu1">
            <label>Puanınız:</label>
            <div className="rating-stars-menu1">
              {renderStars()}
              <span className="rating-text-menu1">
                {rating > 0 ? `${rating} yıldız` : "Puan verin"}
              </span>
            </div>

            {error && <div className="error-message-menu1">{error}</div>}
            {success && <div className="success-message-menu1">{success}</div>} {/* ✅ yeni mesaj */}
          </div>

          <button type="submit" className="submit-button-menu1">
            Yorumu Gönder
          </button>
        </form>
      </div>

      <div className="comment-list">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <strong>{comment.user_name}</strong>
                <span className="comment-rating">
                  {Array.from({ length: comment.rating }, (_, i) => (
                    <span key={i} className="star filled">
                      ★
                    </span>
                  ))}
                  ({comment.rating}/5)
                </span>
              </div>
              <p className="comment-text">{comment.comment}</p>
              <span className="comment-date">
                {new Date(comment.created_at).toLocaleDateString("tr-TR")}
              </span>
            </div>
          ))
        ) : (
          <div className="no-comments">Henüz yorum bulunmamaktadır.</div>
        )}
      </div>
    </div>
  );
};

export default CommentPage;
