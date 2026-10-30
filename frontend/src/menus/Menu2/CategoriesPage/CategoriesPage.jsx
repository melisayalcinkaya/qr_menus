// src/menus/Menu2/CategoriesPage/CategoriesPage.jsx
import React, { useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styles from './CategoriesPage.module.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CategoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const API_BASE_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : `http://${window.location.hostname}:8000`;

  const businessSlug = new URLSearchParams(window.location.search).get('business');

  useEffect(() => {
    if (!businessSlug) {
      setError("İşletme bulunamadı.");
      setIsLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        let res = await axios.get(`${API_BASE_URL}/api/categories/?business=${businessSlug}`);
        let data = res.data;

        // Pagination varsa results kullan
        if (data && typeof data === 'object' && data.results) data = data.results;
        if (!Array.isArray(data)) data = [];

        setCategories(data);
      } catch (err) {
        console.error("Kategori verileri alınırken hata oluştu:", err);
        setError("Kategoriler yüklenirken hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [API_BASE_URL, businessSlug]);

  const filteredCategories = categories.filter((category) =>
    category.name && category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

const handleCardClick = (categoryId) => {
  const businessSlug = new URLSearchParams(window.location.search).get('business');
  const target = `/menu2/categories/${categoryId}?business=${businessSlug}`;
  console.log("Navigating to:", target);
  navigate(target);
};


  const handleSearchClick = () => setIsSearchActive(true);
  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
  };

  if (isLoading) return <div className={styles.loadingMessage}>Kategoriler yükleniyor...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (filteredCategories.length === 0) return <div className={styles.noResults}>Sonuç bulunamadı.</div>;

  return (
    <div className={styles.categoriesPage}>
      <header className={styles.appHeader}>
        {!isSearchActive ? (
          <>
            <h1 className={styles.appTitle}>Food App</h1>
            {/* <button className={styles.searchButton} onClick={handleSearchClick}>
              <FiSearch />
            </button> */}
          </>
        ) : (
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Favori yemeğini ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            <button className={styles.closeSearch} onClick={handleCloseSearch}>
              <FiX />
            </button>
          </div>
        )}
      </header>

      <main className={styles.mainContent}>
        <div className={styles.categoriesContainerVertical}>
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className={styles.categoryItem}
              onClick={() => handleCardClick(category.id)}
            >
              <img
                src={category.banner_image || 'https://placehold.co/100x100/CCCCCC/FFFFFF?text=No+Image'}
                alt={category.name}
                className={styles.categoryImage}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/CCCCCC/FFFFFF?text=Error'; }}
              />
              <div className={styles.categoryText}>
                <h3 className={styles.categoryName}>{category.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;