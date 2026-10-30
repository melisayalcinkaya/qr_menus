// src/pages/CategoriesPage.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import "../../src/styles/categories.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import API from "../API";

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    banner_image: null,
    business_slug: "",
  });
  const [previewImage, setPreviewImage] = useState(null);

  // İşletmeleri yükle
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await API.get(`/businesses/`);
        const data = res.data.results || res.data || [];
        setBusinesses(data);
      } catch (err) {
        console.error(err);
        setError("İşletmeler yüklenirken hata oluştu");
      }
    };
    fetchBusinesses();
  }, []);

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        let url = `/categories/`;
        if (selectedBusiness !== "all")
          url += `?business=${encodeURIComponent(selectedBusiness)}`;
        const res = await API.get(url);
        setCategories(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
        setError("Kategoriler yüklenirken hata oluştu");
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [selectedBusiness]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, banner_image: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else setPreviewImage(null);
  };

  const openModalForEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      banner_image: null,
      business_slug: category.businesses?.[0]?.slug || "",
    });
    setPreviewImage(category.banner_image || null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setFormData({ name: "", banner_image: null, business_slug: "" });
    setPreviewImage(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.business_slug) return;

    setIsLoading(true);
    setError(null);
    try {
      let payload;
      let url = `/categories/`;

      if (formData.banner_image) {
        payload = new FormData();
        payload.append("name", formData.name);
        payload.append(
          "business_slugs",
          JSON.stringify([formData.business_slug])
        );
        payload.append("banner_image", formData.banner_image);
      } else {
        payload = {
          name: formData.name,
          business_slugs: [formData.business_slug],
        };
      }

      const headers = {
        "Content-Type": formData.banner_image
          ? "multipart/form-data"
          : "application/json",
      };

      if (editingCategory) {
        url += `${editingCategory.id}/`;
        await API.patch(url, payload, { headers });
      } else {
        await API.post(url, payload, { headers });
      }

      closeModal();
      const refreshUrl =
        selectedBusiness !== "all"
          ? `/categories/?business=${selectedBusiness}`
          : `/categories/`;
      const res = await API.get(refreshUrl);
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Kategori ekleme/güncelleme hatası"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`"${category.name}" silinsin mi?`)) return;
    try {
      await API.delete(`/categories/${category.id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Silme hatası"
      );
    }
  };

  const handleAddProduct = (category) => {
    const businessSlug =
      selectedBusiness !== "all"
        ? selectedBusiness
        : category.businesses?.[0]?.slug;
    if (!businessSlug) return alert("İşletme bulunamadı");
    navigate(`/admin/dashboard/${businessSlug}/products?category=${category.id}`);
  };

  return (
    <div className="categories-container">
      <Sidebar />

      <div className="categories-main">
        <header className="page-header">
          <div className="header-left">
            <h1>Kategori Yönetimi</h1>
            <p>Menü kategorilerinizi yönetin ve düzenleyin</p>
            <small style={{ color: "#666", fontSize: "12px" }}>
              Toplam: {categories.length} |{" "}
              {selectedBusiness === "all"
                ? "Tüm işletmeler"
                : `Seçili: ${selectedBusiness}`}
            </small>
          </div>

          <div className="header-actions">
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              disabled={isLoading}
            >
              <option value="all">Tüm İşletmeler</option>
              {businesses.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>

            <button
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
              disabled={isLoading}
            >
              <i className="fas fa-plus"></i> Yeni Kategori
            </button>
          </div>
        </header>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
            <button
              onClick={() => setError(null)}
              className="btn-close-alert"
            >
              ×
            </button>
          </div>
        )}

        <div className="page-content">
          {isLoading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i> Yükleniyor...
            </div>
          ) : categories.length > 0 ? (
            <div className="categories-grid">
              {categories.map((cat) => (
                <div key={cat.id} className="category-card">
                  {cat.banner_image ? (
                    <img
                      src={cat.banner_image}
                      alt={cat.name}
                      className="category-banner"
                    />
                  ) : (
                    <div className="no-image-placeholder">
                      <i className="fas fa-folder"></i>
                    </div>
                  )}

                  <div className="category-info">
                    <h3>{cat.name}</h3>
                    <p className="business-names">
                      {cat.businesses?.map((b) => b.name).join(", ") ||
                        "İşletme yok"}
                    </p>
                  </div>

                  <div className="category-actions">
                    <button
                      onClick={() => handleAddProduct(cat)}
                      title="Ürün Ekle"
                    >
                      <i className="fas fa-plus-circle"></i>
                    </button>
                    <button
                      onClick={() => openModalForEdit(cat)}
                      title="Düzenle"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      title="Sil"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-folder-open"></i>
              <h3>Henüz kategori yok</h3>
              <p>
                {selectedBusiness === "all"
                  ? "Hiçbir işletmenizde kategori yok."
                  : "Bu işletmede kategori yok."}
              </p>
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                İlk Kategoriyi Ekle
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingCategory ? "Kategori Düzenle" : "Yeni Kategori"}</h2>
              <button className="btn-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Kategori Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>İşletme *</label>
                <select
                  value={formData.business_slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business_slug: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">İşletme Seçin</option>
                  {businesses.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Banner Resmi</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Önizleme"
                    className="image-preview"
                  />
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-save"></i>
                  )}
                  {editingCategory ? " Güncelle" : " Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
