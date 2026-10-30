import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import axios from 'axios';
import '../../src/styles/comments.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// API temel URL'si
const API_BASE_URL = 'http://localhost:8000/api/';

// 1. Axios instance'ını component DIŞINDA oluşturun
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Axios Interceptor (Araya Girici)
// 'api' instance'ı ile yapılan HER istekten önce bu fonksiyon çalışır.
api.interceptors.request.use(
  (config) => {
    // Token'ı her zaman localStorage'dan taze olarak al
    const token = localStorage.getItem('access');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // İstek hatası olursa
    return Promise.reject(error);
  }
);


const CommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [selectedComment, setSelectedComment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // 3. Component içindeki eski 'token' ve 'api' tanımlarını SİLİN
  // const token = localStorage.getItem('access_token'); // ❌ KALDIRILDI
  // const api = axios.create({ ... }); // ❌ KALDIRILDI (dışarı taşındı)


  const fetchComments = async () => {
    try {
      // 4. Artık sadece 'api' instance'ını kullanın. Header'lar otomatik eklenecek.
      const response = await api.get('comments/');

      console.log("API yanıtı:", response.data);
      setComments(response.data.results || []);
    } catch (error) {
      console.error('Yorumlar çekilemedi:', error);
      if (error.response && error.response.status === 401) {
        console.error("Yetkilendirme sorunu! Token geçersiz veya süresi dolmuş.");
        // Gerekirse kullanıcıyı login sayfasına yönlendirin
        // window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const approveComment = async (commentId) => {
    try {
      // 5. Manuel header'ları kaldırın, 'axios' yerine 'api' kullanın
      await api.patch(`comments/${commentId}/approve/`, {});
      fetchComments();
    } catch (error) {
      console.error('Yorumu onaylama hatası:', error);
    }
  };

  const rejectComment = async (commentId) => {
    try {
      // 6. Manuel header'ları kaldırın, 'axios' yerine 'api' kullanın
      await api.patch(`comments/${commentId}/reject/`, {});
      fetchComments();
    } catch (error) {
      console.error('Yorumu reddetme hatası:', error);
    }
  };

  const deleteComment = async (commentId) => {
    if (window.confirm('Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      try {
        // 7. Bu fonksiyon zaten 'api' kullanıyordu, artık yeni interceptor'lü 'api'yi kullanacak.
        await api.delete(`comments/${commentId}/`);
        fetchComments();
      } catch (error) {
        console.error('Yorumu silme hatası:', error);
      }
    }
  };

  // --- Buradan sonrası aynı kalabilir ---

  // Modal fonksiyonları
  const viewComment = (comment) => {
    setSelectedComment(comment);
    setShowViewModal(true);
  };
  const closeModal = () => {
    setShowViewModal(false);
    setSelectedComment(null);
  };

  // Filtreleme
  const filteredComments = comments.filter(comment => {
    const matchesSearch = 
      comment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || comment.status === filterStatus;
    const matchesRating = filterRating === 'all' || comment.rating.toString() === filterRating;
    return matchesSearch && matchesStatus && matchesRating;
  });

  // İstatistik
  const stats = {
    total: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length
  };

  // Yardımcı fonksiyonlar
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('tr-TR') : '-';
  const getUserInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const renderStars = (rating) => [...Array(5)].map((_, i) => (
    <i key={i} className={`fas fa-star ${i < rating ? '' : 'empty'}`}></i>
  ));
  const getStatusText = (status) => ({ approved: 'Onaylandı', rejected: 'Reddedildi', pending: 'Beklemede' }[status] || 'Bilinmiyor');

  return (
    <div className="comments-container">
      <Sidebar />
      <div className="comments-main">
        <div className="page-header">
          <div className="header-left">
            <h1>Yorum Yönetimi</h1>
            <p>Müşteri yorumlarını görüntüleyin ve yönetin</p>
          </div>
          <div className="header-stats">
            <div className="stat-item"><span className="stat-number">{stats.total}</span> <span className="stat-label">Toplam Yorum</span></div>
            <div className="stat-item pending"><span className="stat-number">{stats.pending}</span> <span className="stat-label">Bekleyen</span></div>
            <div className="stat-item approved"><span className="stat-number">{stats.approved}</span> <span className="stat-label">Onaylanan</span></div>
            <div className="stat-item rejected"><span className="stat-number">{stats.rejected}</span> <span className="stat-label">Reddedilen</span></div>
          </div>
        </div>

        <div className="breadcrumb">
          <a href="/admin/dashboard">Dashboard</a>
          <i className="fas fa-chevron-right"></i>
          <span>Yorumlar</span>
        </div>

        <div className="content-toolbar">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Yorumlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekleyenler</option>
              <option value="approved">Onaylananlar</option>
              <option value="rejected">Reddedilenler</option>
            </select>
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
              <option value="all">Tüm Puanlar</option>
              <option value="5">5 Yıldız</option>
              <option value="4">4 Yıldız</option>
              <option value="3">3 Yıldız</option>
              <option value="2">2 Yıldız</option>
              <option value="1">1 Yıldız</option>
            </select>
            <div className="results-info">{filteredComments.length} sonuç bulundu</div>
          </div>
        </div>

        <div className="page-content">
          {filteredComments.length > 0 ? (
            <div className="comments-list">
              {filteredComments.map((comment) => (
                <div key={comment.id} className={`comment-card ${comment.status}`}>
                  <div className="comment-header">
                    <div className="comment-user">
                      <div className="user-avatar">{getUserInitials(comment.user_name)}</div>
                      <div className="user-info">
                        <h4>{comment.user_name}</h4>
                        <p className="user-email">{comment.user_email}</p>
                      </div>
                    </div>
                    <div className="comment-meta">
                      <span className="comment-date">{formatDate(comment.created_at)}</span>
                      <span className={`comment-status ${comment.status}`}>{getStatusText(comment.status)}</span>
                    </div>
                  </div>
                  <div className="product-info"><i className="fas fa-utensils"></i> <span>{comment.product_name}</span></div>
                  <div className="comment-content">
                    <p className="comment-text">{comment.comment}</p>
                    <div className="comment-rating">
                      <div className="stars">{renderStars(comment.rating)}</div>
                      <span className="rating-text">{comment.rating} yıldız</span>
                    </div>
                  </div>
                  <div className="comment-actions">
                    <button className="btn-icon btn-view" onClick={() => viewComment(comment)}><i className="fas fa-eye"></i></button>
                    {comment.status !== 'approved' && <button className="btn-icon btn-approve" onClick={() => approveComment(comment.id)}><i className="fas fa-check"></i></button>}
                    {comment.status !== 'rejected' && <button className="btn-icon btn-reject" onClick={() => rejectComment(comment.id)}><i className="fas fa-times"></i></button>}
                    <button className="btn-icon btn-delete" onClick={() => deleteComment(comment.id)}><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><i className="far fa-comment-dots"></i></div>
              <h3>Yorum bulunamadı</h3>
              <p>Arama kriterlerinize uygun yorum bulunmamaktadır.</p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showViewModal && selectedComment && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2><i className="fas fa-comment"></i> Yorum Detayları</h2>
                <button className="btn-close" onClick={closeModal}><i className="fas fa-times"></i></button>
              </div>
              <div className="modal-body">
                <div className="comment-user">
                  <div className="user-avatar">{getUserInitials(selectedComment.user_name)}</div>
                  <div className="user-info">
                    <h4>{selectedComment.user_name}</h4>
                    <p className="user-email">{selectedComment.user_email}</p>
                  </div>
                </div>
                <div className="product-info"><i className="fas fa-utensils"></i> <span>{selectedComment.product_name}</span></div>
                <div className="comment-rating"><div className="stars">{renderStars(selectedComment.rating)}</div> <span className="rating-text">{selectedComment.rating} yıldız</span></div>
                <div className="comment-text"><p>{selectedComment.comment}</p></div>
                <div className="comment-meta">
                  <p><strong>Oluşturulma Tarihi:</strong> {formatDate(selectedComment.created_at)}</p>
                  {selectedComment.status === 'approved' && <p><strong>Onaylanma Tarihi:</strong> {formatDate(selectedComment.approved_at)}</p>}
                  {selectedComment.status === 'approved' && <p><strong>Onaylayan:</strong> {selectedComment.approved_by}</p>}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeModal}>Kapat</button>
                {selectedComment.status !== 'approved' && <button className="btn-primary" onClick={() => { approveComment(selectedComment.id); closeModal(); }}><i className="fas fa-check"></i> Onayla</button>}
                {selectedComment.status !== 'rejected' && <button className="btn-danger" onClick={() => { rejectComment(selectedComment.id); closeModal(); }}><i className="fas fa-times"></i> Reddet</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsPage;