import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Menu3Navbar from '../../../components/Navbar3/Menu3Navbar';
import './Menu3CommentPage.css';

const API_BASE_URL = "http://localhost:8000/api";

const Menu3CommentPage = () => {
  const [searchParams] = useSearchParams();
  const businessSlug = searchParams.get("business");

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({
    name: '',
    comment: '',
    rating: 5
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // Yorumları çek
  const fetchComments = async () => {
    if (!businessSlug) {
      console.error("businessSlug is undefined!");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE_URL}/comments/?business=${businessSlug}`
      );
      
      console.log("Yorumlar:", res.data);
      const commentsData = Array.isArray(res.data) 
        ? res.data 
        : res.data.results || [];
      
      setComments(commentsData);
    } catch (err) {
      console.error("Yorumlar alınamadı:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [businessSlug]);

  // Yorum gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!businessSlug) {
      setError("İşletme bilgisi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }

    if (!newComment.name.trim() || !newComment.comment.trim()) {
      setError("Lütfen tüm alanları doldurun!");
      return;
    }

    const payload = {
      business_slug: businessSlug,
      user_name: newComment.name,
      user_email: "guest@example.com",
      comment: newComment.comment,
      rating: newComment.rating,
    };

    try {
      await axios.post(`${API_BASE_URL}/comments/`, payload);
      
      setNewComment({ name: '', comment: '', rating: 5 });
      setSuccess("Yorumunuz başarıyla gönderildi! Onaylandıktan sonra görüntülenecektir. 🎉");
      
      // 2 saniye sonra mesajı temizle
      setTimeout(() => {
        setSuccess("");
      }, 3000);

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

  if (loading) {
    return (
      <div className="comment-page-menu3">
        <div className="loading-menu3">Yorumlar yükleniyor...</div>
        <Menu3Navbar />
      </div>
    );
  }

  return (
    <div className="comment-page-menu3">
      <div className="comment-header-menu3">
        <h1>Müşteri Yorumları</h1>
        <p>Deneyimlerinizi bizimle paylaşın</p>
      </div>

      <div className="comment-form-container-menu3">
        <form onSubmit={handleSubmit} className="comment-form-menu3">
          <input
            type="text"
            placeholder="Adınız"
            value={newComment.name}
            onChange={(e) => setNewComment({...newComment, name: e.target.value})}
            required
          />
          <textarea
            placeholder="Yorumunuz"
            value={newComment.comment}
            onChange={(e) => setNewComment({...newComment, comment: e.target.value})}
            rows="4"
            required
          />
          <select
            value={newComment.rating}
            onChange={(e) => setNewComment({...newComment, rating: parseInt(e.target.value)})}
          >
            <option value={5}>5 Yıldız ⭐⭐⭐⭐⭐</option>
            <option value={4}>4 Yıldız ⭐⭐⭐⭐</option>
            <option value={3}>3 Yıldız ⭐⭐⭐</option>
            <option value={2}>2 Yıldız ⭐⭐</option>
            <option value={1}>1 Yıldız ⭐</option>
          </select>

          {error && <div className="error-message-menu3">{error}</div>}
          {success && <div className="success-message-menu3">{success}</div>}

          <button type="submit">Yorum Gönder</button>
        </form>
      </div>

      <div className="comments-list-menu3">
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="comment-item-menu3">
              <div className="comment-header-info-menu3">
                <h3>{comment.user_name || 'Anonim'}</h3>
                <div className="comment-rating-menu3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < comment.rating ? 'star active' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="comment-text-menu3">{comment.comment}</p>
              <span className="comment-date-menu3">
                {new Date(comment.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
          ))
        ) : (
          <div className="no-comments-menu3">
            <p>Henüz onaylanmış yorum bulunmamaktadır.</p>
            <p>İlk yorumu siz yapın! 🎉</p>
          </div>
        )}
      </div>

      <Menu3Navbar />
    </div>
  );
};

export default Menu3CommentPage;