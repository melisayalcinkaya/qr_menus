import React, { useRef, useState, useEffect } from 'react';
import './CategoryProductSlider.css';

const CategoryProductSlider = ({ category, products, categoryId, businessSlug, imageUrl }) => {
  const cardColors = ['pink', 'purple', 'blue', 'orange'];
  const scrollContainerRef = useRef(null);
  const [showMoreIndicator, setShowMoreIndicator] = useState(false);

  // Scroll durumunu kontrol et - daha fazla içerik var mı?
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        // Eğer içerik genişliği container'dan büyükse "daha fazla" göster
        setShowMoreIndicator(scrollWidth > clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  // Scroll event listener - kullanıcı kaydırdıkça indicator'ı güncelle
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        // Sona yaklaştıysa indicator'ı gizle
        setShowMoreIndicator(scrollLeft + clientWidth < scrollWidth - 50);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <section className="category-section-menu2">
      <div className="category-header-menu2">
        <h2 className="category-title-menu2">{category}</h2>
        {/* Daha Fazla - Sadece scroll için indikatör, tıklanabilir değil */}
        {showMoreIndicator && (
          <span className="see-more-indicator">
            Daha Fazla →
          </span>
        )}
      </div>
      <div className="products-container-menu2">
        <div className="products-grid-menu2" ref={scrollContainerRef}>
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className={`product-card-menu2 ${cardColors[index % cardColors.length]}`}
              // Tıklama yok - sadece görüntüleme
            >
              <div className="product-header-menu2">
                <div className="product-image-container-menu2">
                  <img 
                    src={product.image || product.image_url || 'https://via.placeholder.com/150'}
                    alt={product.name}
                    className="product-image-menu2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                </div>
              </div>

              {/* Rating */}
              {product.rating && (
                <div className="product-rating-inline-menu2">
                  <span className="rating-star-menu2">★</span>
                  <span className="rating-score-menu2">{product.rating}</span>
                </div>
              )}

              <div className="product-info-menu2">
                <h3 className="product-name-menu2">{product.name}</h3>
                <p className="product-description-menu2">{product.description}</p>
              </div>

              <div className="product-footer-menu2">
                <span className="product-price-menu2">₺{product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobil için kaydırma ipucu */}
      {showMoreIndicator && (
        <div className="scroll-hint">
          <i className="fas fa-hand-point-right"></i>
          <span>Kaydırarak daha fazla ürün görün</span>
        </div>
      )}
    </section>
  );
};

export default CategoryProductSlider;