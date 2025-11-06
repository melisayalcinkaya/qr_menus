import React, { useEffect, useState } from 'react';
import styles from './CommentsPage.module.css';
import { FaStar, FaUserCircle, FaQuoteRight, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api';

const Menu2CommentsPage = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const businessSlug = searchParams.get("business");

    useEffect(() => {
        const fetchComments = async () => {
            if (!businessSlug) {
                console.error("Business slug bulunamadı!");
                setLoading(false);
                return;
            }

            try {
                // Sadece bu işletmeye ait onaylanmış yorumları getir
                const response = await axios.get(
                    `${API_BASE_URL}/comments/?business=${businessSlug}`
                );
                
                console.log("Yorumlar:", response.data);
                const commentsData = Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];
                    
                setComments(commentsData);
            } catch (err) {
                console.error("Yorumlar yüklenirken hata oluştu:", err);
                setComments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [businessSlug]);

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    const handleMakeCommentClick = () => {
        navigate(`/menu2/make-comment?business=${businessSlug}`);
    };

    if (loading) {
        return <div className={styles.loading}>Yorumlar yükleniyor...</div>;
    }

    return (
        <div className={styles.commentsPage}>
            <header className={styles.commentsHeader}>
                <div className={styles.testimonialHeader}>
                    <FaUserCircle className={styles.userIcon} aria-hidden="true" />
                    <h1 className={styles.headerTitle}>Müşteri Yorumları</h1>
                </div>
            </header>

            <main className={styles.commentsList}>
                {comments.length === 0 ? (
                    <p className={styles.noComments}>Henüz onaylanmış yorum bulunmuyor.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className={styles.commentCard}>
                            <div className={styles.stars} aria-label={`Puan: ${comment.rating || 0}`}>
                                {[...Array(Math.min(comment.rating || 0, 5))].map((_, i) => (
                                    <FaStar key={i} className={styles.starIcon} />
                                ))}
                            </div>
                            <div className={styles.quoteIcon}>
                                <FaQuoteRight aria-hidden="true" />
                            </div>
                            <p className={styles.commentText}>
                                {truncateText(comment.comment, 200)}
                            </p>
                            <p className={styles.commentAuthor}>
                                - {comment.user_name || 'Anonim'}
                            </p>
                            <p className={styles.commentDate}>
                                {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    ))
                )}
            </main>

            <footer className={styles.commentFooter}>
                <div
                    className={styles.makeCommentLink}
                    onClick={handleMakeCommentClick}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleMakeCommentClick();
                    }}
                    aria-label="Yorum yapma sayfasına git"
                >
                    <span>Sen de yorum yap!</span>
                    <FaArrowRight className={styles.arrowIcon} />
                </div>
            </footer>
            <div style={{ height: '80px' }}></div>
        </div>
    );
};

export default Menu2CommentsPage;