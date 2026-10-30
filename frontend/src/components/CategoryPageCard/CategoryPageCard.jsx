import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CategoryPageCard.css';

const CategoryPageCard = ({ searchTerm }) => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : `http://${window.location.hostname}:8000`;

  useEffect(() => {
    const businessSlug = new URLSearchParams(window.location.search).get('business');
    if (!businessSlug) {
      setError("İşletme bulunamadı.");
      setIsLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/categories/?business=${businessSlug}`
        );

        console.log("API Response:", res.data); // Debug için

        let data = res.data;
        
        // Paginationlu response geliyorsa results'u al
        if (data && typeof data === 'object' && data.results) {
          data = data.results;
        }
        
        // Eğer hala array değilse, boş array yap
        if (!Array.isArray(data)) {
          console.warn("Beklenmeyen response formatı:", data);
          data = [];
        }

        setCards(data);
      } catch (err) {
        console.error("Kategori verileri alınırken hata oluştu:", err);
        setError("Kategoriler yüklenirken hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [API_BASE_URL]);

  const filteredCards = cards.filter((card) =>
    card.name &&
    card.name.toLowerCase().includes(searchTerm ? searchTerm.toLowerCase() : '')
  );

  if (isLoading) {
    return <div className="loading">Menü yükleniyor...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (filteredCards.length === 0) {
    return <div className="empty">Henüz kategori bulunmamaktadır.</div>;
  }

  const handleCardClick = (categoryId) => {
    const urlParams = new URLSearchParams(window.location.search);
    const businessSlug = urlParams.get('business');

    navigate(`/menu1/categories/${categoryId}?business=${businessSlug}`);
  };

  return (
    <div className="category-container-menu">
      {filteredCards.map((card) => (
        <div
          key={card.id}
          className="category-card-menu"
          onClick={() => handleCardClick(card.id)}
        >
          {card.banner_image && (
            <img
              src={card.banner_image}
              alt={card.name}
              className="category-image-menu"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <h3 className="category-title-menu">{card.name}</h3>
        </div>
      ))}
    </div>
  );
};

export default CategoryPageCard;
