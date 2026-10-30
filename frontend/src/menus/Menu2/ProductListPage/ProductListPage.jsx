import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductListPage.css';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : `http://${window.location.hostname}:8000`;

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const businessSlug = new URLSearchParams(window.location.search).get('business');

  useEffect(() => {
    if (!businessSlug) return;

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/businesses/${businessSlug}/products/`);
        setProducts(response.data);
      } catch (err) {
        console.error("Ürünler alınamadı:", err);
        setError("Ürünler yüklenirken hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [businessSlug]);

  if (isLoading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="productListPage">
      <h2 className="title">Ürünler</h2>
      <div className="productList">
        {products.length > 0 ? (
          products.map(product => (
            <div key={product.id} className="productItem">
              <img
                className="productImage"
                src={product.image ? `${API_BASE_URL}${product.image}` : 'https://placehold.co/150x150'}
                alt={product.name}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150'; }}
              />
              <div className="productDetails">
                <h3 className="productName">{product.name}</h3>
                <p className="productPrice">₺{product.price}</p>
                <p className="productDescription">Kategori: {product.category}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">Henüz ürün bulunmamaktadır.</div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
