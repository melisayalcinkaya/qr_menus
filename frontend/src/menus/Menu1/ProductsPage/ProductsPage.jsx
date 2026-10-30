import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./ProductsPage.css";
import API from "../../../api";
const ProductsPage = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);

  const businessSlug = searchParams.get("business");

  useEffect(() => {
    if (!categoryId || !businessSlug) return;

    const fetchData = async () => {
      try {
        // 1. Kategori bilgisini al
        const catRes = await API.get(`categories/${categoryId}/`);
        setCategory(catRes.data);

        // 2. Ürünleri kategoriye göre al
        const prodRes = await API.get(
          `products/?business=${businessSlug}&category=${categoryId}`
        );
        setProducts(prodRes.data.results || prodRes.data); // pagination durumuna göre
      } catch (err) {
        console.error("Ürünler veya kategori alınamadı:", err);
      }
    };

    fetchData();
  }, [categoryId, businessSlug]);

  if (!category) return <div>Yükleniyor...</div>;

  return (
    <div className="products-page-menu1">
      <h1 className="category-heading-menu1">{category.name}</h1>

      <div className="product-grid-menu1">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-card-menu1">
              <img
                src={product.image || product.image_url}
                alt={product.name}
                className="product-image-menu1"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <h4 className="product-title-menu1">{product.name}</h4>
              <div className="product-info-menu1">
                <span>{product.price} TL</span>
              </div>
              <p className="product-description-menu1">{product.description}</p>
            </div>
          ))
        ) : (
          <p>Bu kategoriye ait ürün bulunamadı.</p>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
