import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useSearchParams } from 'react-router-dom';
import './CategoryProductPage.css';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : `http://${window.location.hostname}:8000`;

const CategoryProductPage = ({ onGoBack }) => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // useParams ve useSearchParams hook'larını kullanarak parametreleri alalım
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const businessSlug = searchParams.get('business');

  useEffect(() => {
    console.log("useParams categoryId:", categoryId);
    console.log("URLSearchParams business:", businessSlug);
    
    // Kategori ID'sini farklı kaynaklardan almaya çalışalım
    const effectiveCategoryId = categoryId || new URLSearchParams(window.location.search).get('category');
    
    console.log("Effective Category ID:", effectiveCategoryId);
    
    if (!effectiveCategoryId) {
      setError("Kategori ID eksik. Lütfen bir kategori seçin. Mevcut URL: " + window.location.href);
      setIsLoading(false);
      return;
    }
    
    if (!businessSlug) {
      setError("İşletme bilgisi eksik. URL'de business parametresi bulunamadı.");
      setIsLoading(false);
      return;
    }

    const fetchCategoryAndProducts = async () => {
      setIsLoading(true);
      try {
        // Kategori bilgisi
        console.log("Kategori API'ye istek atılıyor:", `${API_BASE_URL}/api/categories/${effectiveCategoryId}/`);
        const categoryRes = await axios.get(`${API_BASE_URL}/api/categories/${effectiveCategoryId}/`);
        console.log("Kategori yanıtı:", categoryRes.data);
        setCategory(categoryRes.data);

        // Ürünleri kategoriye göre doğrudan API'den al
        console.log("Ürün API'ye istek atılıyor:", `${API_BASE_URL}/api/products/?business=${businessSlug}&category=${effectiveCategoryId}`);
        const productsRes = await axios.get(
          `${API_BASE_URL}/api/products/?business=${businessSlug}&category=${effectiveCategoryId}`
        );
        
        console.log("Ürün yanıtı:", productsRes.data);
        
        // API yanıtındaki veri yapısına göre uyarlama
        const productsData = productsRes.data.results || productsRes.data;
        setProducts(productsData);
      } catch (err) {
        console.error("Ürünler veya kategori alınamadı:", err);
        setError("Veriler yüklenirken bir hata oluştu: " + (err.response?.data?.message || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [categoryId, businessSlug]);

  // Hata durumunu kontrol et
  if (error) return <div className="error">{error}</div>;
  
  // Yükleniyor durumu
  if (isLoading) return <div className="loading">Yükleniyor...</div>;
  
  // Kategori yoksa
  if (!category) return <div className="empty">Kategori bulunamadı.</div>;

  return (
    <div className="category-product-page">
      <h2>{category.name}</h2>
      <div className="product-list">
        {products.length > 0 ? (
          products.map(product => (
            <div key={product.id} className="product-card">
              <img
                src={product.image || product.image_url || 'https://placehold.co/120x120'}
                alt={product.name}
                onError={(e) => { 
                  e.target.onerror = null; 
                  e.target.src = 'https://placehold.co/120x120'; 
                }}
              />
              <div className="product-details">
                <h3>{product.name}</h3>
                <p>Kategori: {category.name}</p>
                <p>₺{product.price}</p>
                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty">Bu kategoride ürün bulunmamaktadır.</div>
        )}
      </div>
    </div>
  );
};

export default CategoryProductPage;