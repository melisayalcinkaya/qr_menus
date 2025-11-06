import { useEffect, useState } from 'react';
import axios from 'axios';
import WelcomeBanner from '../../../components/WelcomeBanner/WelcomeBanner';
import SearchBar from '../../../components/SearchBar3/SearchBar';
import CategoryProductSlider from '../../../components/CategoryProductSlider/CategoryProductSlider';
import './HomePage.css';
import Menu3Navbar from '../../../components/Navbar3/Menu3Navbar';

const HomePage = () => {
  const [companyName, setCompanyName] = useState('');
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : `http://${window.location.hostname}:8000`;

  const businessSlug = new URLSearchParams(window.location.search).get('business');

  useEffect(() => {
    if (!businessSlug) {
      setError("İşletme bulunamadı.");
      setIsLoading(false);
      return;
    }

    // İşletme bilgilerini çek
    const fetchBusinessInfo = async () => {
      try {
        const businessRes = await axios.get(`${API_BASE_URL}/api/businesses/${businessSlug}/`);
        setCompanyName(businessRes.data.name || '');
      } catch (err) {
        console.error("İşletme bilgisi alınamadı:", err);
      }
    };

    // Kategorileri ve ürünleri çek
    const fetchCategoriesAndProducts = async () => {
      try {
        // Kategorileri al
        let categoriesRes = await axios.get(`${API_BASE_URL}/api/categories/?business=${businessSlug}`);
        let categoriesData = categoriesRes.data;

        // Pagination varsa results kullan
        if (categoriesData && typeof categoriesData === 'object' && categoriesData.results) {
          categoriesData = categoriesData.results;
        }
        if (!Array.isArray(categoriesData)) categoriesData = [];

        // Her kategori için ürünleri al
        const categoriesWithProducts = await Promise.all(
          categoriesData.map(async (category) => {
            try {
              const productsRes = await axios.get(
                `${API_BASE_URL}/api/products/?business=${businessSlug}&category=${category.id}`
              );
              
              let productsData = productsRes.data;
              // Pagination varsa results kullan
              if (productsData && typeof productsData === 'object' && productsData.results) {
                productsData = productsData.results;
              }
              if (!Array.isArray(productsData)) productsData = [];

              return {
                ...category,
                products: productsData
              };
            } catch (err) {
              console.error(`Kategori ${category.name} ürünleri alınamadı:`, err);
              return {
                ...category,
                products: []
              };
            }
          })
        );

        setCategories(categoriesWithProducts);
        setFilteredCategories(categoriesWithProducts);
      } catch (err) {
        console.error("Kategori verileri alınırken hata oluştu:", err);
        setError("Kategoriler yüklenirken hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessInfo();
    fetchCategoriesAndProducts();
  }, [businessSlug, API_BASE_URL]);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.map(category => ({
        ...category,
        products: category.products.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      })).filter(category => category.products.length > 0);

      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  if (isLoading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home-page">
      <WelcomeBanner companyName={companyName} />
      <SearchBar onSearch={setSearchTerm} />
      <main className="main-content">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <CategoryProductSlider
              key={category.id}
              category={category.name}
              products={category.products}
              categoryId={category.id}
              businessSlug={businessSlug}
              imageUrl={category.banner_image || category.image_url}
            />
          ))
        ) : (
          <div className="no-results">
            {searchTerm ? 'Arama kriterlerinize uygun sonuç bulunamadı.' : 'Henüz kategori bulunmamaktadır.'}
          </div>
        )}
      </main>
      <Menu3Navbar />
    </div>
  );
};

export default HomePage;