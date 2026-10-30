// src/pages/ProductsPage.jsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import '../../src/styles/products.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import API from '../API';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function ProductsPage() {
  const { businessSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryFromUrl = searchParams.get('category');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: categoryFromUrl || '',
    image: null,
    is_active: true,
    is_popular: false,
    preparation_time: '',
    ingredients: '[]',
    allergens: '[]',
  });

  // ✅ Kategorileri yükle
  useEffect(() => {
    if (!businessSlug) return;

    const fetchCategories = async () => {
      try {
        const res = await API.get(`categories/`, {
          params: { business: businessSlug },
        });

        const cats = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];

        setCategories(cats);
        console.log('Kategoriler yüklendi:', cats);
      } catch (err) {
        console.error('Kategoriler yüklenemedi:', err.response?.data || err);
        setError('Kategoriler yüklenirken hata oluştu');
      }
    };

    fetchCategories();
  }, [businessSlug]);

  // ✅ Ürünleri yükle
  useEffect(() => {
    if (!businessSlug) return;

    const fetchProducts = async () => {
      setIsPageLoading(true);
      try {
        const res = await API.get(`products/`, {
          params: { business: businessSlug },
        });

        const allProducts = res.data.results || res.data || [];
        setProducts(allProducts);
      } catch (err) {
        console.error('Ürünler yüklenemedi:', err);
        setError('Ürünler yüklenirken hata oluştu');
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchProducts();
  }, [businessSlug]);

  // ✅ URL'den kategori gelirse formu otomatik doldur
  useEffect(() => {
    if (categoryFromUrl) {
      setFormData((prev) => ({ ...prev, category: categoryFromUrl }));
      setShowAddModal(true);
    }
  }, [categoryFromUrl]);

  // ✅ Form resetleme
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: null,
      is_active: true,
      is_popular: false,
      preparation_time: '',
      ingredients: '[]',
      allergens: '[]',
    });
    setShowAddModal(false);
    setError(null);
  };

  // ✅ Dosya yükleme
  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  // ✅ Input değişikliği
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ✅ Ürün kaydet
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      setError('Lütfen bir kategori seçin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) body.append(key, value);
      });

      const res = await API.post(`products/`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProducts((prev) => [res.data, ...prev]);
      resetForm();
    } catch (err) {
      console.error('Ürün kaydetme hatası:', err);
      const errorData = err.response?.data;
      let message = 'Ürün kaydedilemedi';

      if (typeof errorData === 'object') {
        message = Object.entries(errorData)
          .map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(', ') : e}`)
          .join('; ');
      } else if (typeof errorData === 'string') {
        message = errorData;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Ürün sil
  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      await API.delete(`products/${id}/`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Silme hatası:', err);
      setError('Ürün silinemedi');
    }
  };

  // ✅ Ürün düzenleme
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category?.id || '',
      image: null,
      is_active: product.is_active,
      is_popular: product.is_popular,
      preparation_time: product.preparation_time || '',
      ingredients: JSON.stringify(product.ingredients || []),
      allergens: JSON.stringify(product.allergens || []),
    });
    setShowAddModal(true);
  };

  // ✅ Malzeme ekleme
  const handleAddIngredients = () => {
    const newItem = prompt('Yeni malzeme ekleyin:');
    if (newItem) {
      try {
        const current = JSON.parse(formData.ingredients || '[]');
        setFormData((p) => ({
          ...p,
          ingredients: JSON.stringify([...current, newItem]),
        }));
      } catch (err) {
        console.error('Malzeme ekleme hatası:', err);
      }
    }
  };

  // ✅ Alerjen ekleme
  const handleAddAllergens = () => {
    const newItem = prompt('Yeni alerjen ekleyin:');
    if (newItem) {
      try {
        const current = JSON.parse(formData.allergens || '[]');
        setFormData((p) => ({
          ...p,
          allergens: JSON.stringify([...current, newItem]),
        }));
      } catch (err) {
        console.error('Alerjen ekleme hatası:', err);
      }
    }
  };

  if (isPageLoading) {
    return (
      <div className="products-container">
        <Sidebar />
        <div className="products-main">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-container">
      <Sidebar />
      <div className="products-main">
        <header className="page-header">
          <div className="header-left">
            <h1>Ürün Yönetimi - {businessSlug}</h1>
            <p>İşletmenize ait ürünleri yönetin</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus"></i> Yeni Ürün
            </button>
          </div>
        </header>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
            <button onClick={() => setError(null)} className="btn-close-alert">×</button>
          </div>
        )}

        <div className="page-content">
          {products.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open"></i>
              <h3>Henüz ürün yok</h3>
              <p>Bu işletmede henüz ürün bulunamadı.</p>
              <button 
                className="btn-primary" 
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus"></i> İlk Ürünü Ekle
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id || product.slug} className="product-card">
                  <div className="product-image">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="no-image-placeholder">
                      <i className="fas fa-image"></i>
                    </div>
                  </div>
                  
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">{product.price} ₺</p>
                    <p className="product-category">
                      {product.category_name || product.category?.name || 'Kategorisiz'}
                    </p>
                    <p className="product-description">
                      {product.description || 'Açıklama yok'}
                    </p>
                    
                    {product.ingredients && product.ingredients.length > 0 && (
                      <div className="product-tags">
                        <small>Malzemeler: {product.ingredients.join(', ')}</small>
                      </div>
                    )}
                  </div>
                  
                  <div className="product-status">
                    {product.is_active ? (
                      <span className="status-active">Aktif</span>
                    ) : (
                      <span className="status-inactive">Pasif</span>
                    )}
                    {product.is_popular && <span className="status-popular">Popüler</span>}
                  </div>
                  
                  <div className="product-actions">
                    <button 
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(product)}
                      title="Düzenle"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(product.id)}
                      title="Sil"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal kısmı aynı kalıyor */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-box"></i>
                Yeni Ürün
              </h2>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label>Ürün Adı *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Ürün adını girin"
                />
              </div>

              <div className="form-group">
                <label>Kategori *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={isLoading || !Array.isArray(categories) || categories.length === 0}
                >
                  <option value="">Kategori Seçin</option>
                  {Array.isArray(categories) &&
                    categories.map((category, index) => (
                      <option key={category.id || category.slug || index} value={category.id}>
                        {category.name}
                      </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <small style={{color: '#ff4757'}}>
                    Önce bir kategori oluşturmalısınız.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Fiyat (₺) *</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  disabled={isLoading}
                  placeholder="Ürün açıklaması"
                />
              </div>

              <div className="form-group">
                <label>Ürün Görseli</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <small>JPEG, PNG veya GIF formatında yükleyebilirsiniz</small>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    Aktif
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_popular"
                      checked={formData.is_popular}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    Popüler
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Hazırlanma Süresi (dakika)</label>
                <input
                  type="number"
                  name="preparation_time"
                  min="0"
                  value={formData.preparation_time}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Örn: 15"
                />
              </div>

              <div className="form-group">
                <label>Malzemeler</label>
                <div className="array-input">
                  <button 
                    type="button" 
                    onClick={handleAddIngredients}
                    className="btn-secondary btn-small"
                  >
                    <i className="fas fa-plus"></i> Malzeme Ekle
                  </button>
                  <small>Eklenen malzemeler: {JSON.parse(formData.ingredients || '[]').length}</small>
                </div>
              </div>

              <div className="form-group">
                <label>Alerjenler</label>
                <div className="array-input">
                  <button 
                    type="button" 
                    onClick={handleAddAllergens}
                    className="btn-secondary btn-small"
                  >
                    <i className="fas fa-plus"></i> Alerjen Ekle
                  </button>
                  <small>Eklenen alerjenler: {JSON.parse(formData.allergens || '[]').length}</small>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading || !formData.category}
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-save"></i>
                  )}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}