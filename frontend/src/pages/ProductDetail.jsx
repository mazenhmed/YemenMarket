import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getProduct, getProductReviews } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getProduct(id);
        setProduct(res.data);
        try {
          const revRes = await getProductReviews(id);
          setReviews(revRes.data.results || revRes.data || []);
        } catch { /* reviews optional */ }
      } catch {
        // Fallback
        setProduct({
          id: parseInt(id),
          name: 'منتج تجريبي',
          price: 45000,
          vendor_name: 'متجر تجريبي',
          vendor_id: 1,
          rating: '4.8',
          rating_count: 0,
          description: 'هذا منتج تجريبي. قم بتشغيل الخادم الخلفي لعرض البيانات الحقيقية.',
          stock_quantity: 10,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="page-content"><LoadingSpinner /></div>;
  if (!product) return null;

  const getIcon = () => {
    const cat = product.category_name || '';
    if (cat.includes('إلكترون')) return '📱';
    if (cat.includes('أزياء')) return '👗';
    if (cat.includes('أغذية')) return '🥗';
    if (cat.includes('عناية')) return '💄';
    if (cat.includes('رياض')) return '⚽';
    if (cat.includes('أثاث')) return '🏠';
    return '📦';
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        vendor_id: product.vendor_id || product.vendor,
        vendor_name: product.vendor_name || 'متجر',
        vendor: product.vendor_name || 'متجر',
        image: product.image || null,
        icon: getIcon(),
      });
    }
    toast.success(`تمت إضافة ${quantity} إلى السلة ✅`);
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">الرئيسية</Link><span>/</span>
          <Link to="/products">المنتجات</Link><span>/</span>
          <span className="current">{product.name}</span>
        </div>

        <div className="product-detail-grid">
          <div className="product-detail-image">
            <div className="detail-image-main">
              {product.image ? (
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '20px' }} />
              ) : (
                <span style={{ fontSize: '6rem' }}>{getIcon()}</span>
              )}
            </div>
          </div>

          <div className="product-detail-info">
            <Link to={`/store/${product.vendor_id || product.vendor}`} className="product-vendor" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', background: 'rgba(16, 185, 129, 0.05)', padding: '0.4rem 1rem', borderRadius: '50px', width: 'fit-content', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              {product.vendor_logo ? (
                <img src={product.vendor_logo} alt={product.vendor_name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.2rem' }}>🏪</span>
              )}
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{product.vendor_name || 'متجر'}</span>
            </Link>
            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-rating">
              <span className="stars">⭐⭐⭐⭐⭐</span>
              <span className="rating-text">{product.rating} ({product.rating_count || 0} تقييم)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className="detail-price">{Number(product.price).toLocaleString()} ريال</div>
              {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem' }}>{Number(product.compare_price).toLocaleString()} ريال</span>
              )}
            </div>

            {product.is_on_sale && (
              <span className="product-badge" style={{ display: 'inline-block', marginBottom: '1rem' }}>خصم {product.discount_percentage}%</span>
            )}

            <p className="detail-desc">{product.description}</p>

            {product.stock_quantity !== undefined && (
              <p style={{ color: product.stock_quantity > 0 ? 'var(--primary-600)' : 'var(--accent-rose)', fontWeight: 600, margin: '0.5rem 0' }}>
                {product.stock_quantity > 0 ? `✅ متوفر (${product.stock_quantity} قطعة)` : '❌ نفذ المخزون'}
              </p>
            )}

            <div className="detail-divider"></div>

            <div className="quantity-selector">
              <label>الكمية:</label>
              <div className="quantity-controls">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <div className="detail-actions" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button className="btn btn-primary btn-full" onClick={handleAddToCart}
                style={{ padding: '1rem', fontSize: '1.1rem' }}
                disabled={product.stock_quantity === 0}>
                🛒 أضف إلى السلة
              </button>
              <a
                href={`https://wa.me/${product.vendor_phone || '777161670'}?text=${encodeURIComponent(`مرحباً، أريد طلب هذا المنتج:\n${product.name}\nالسعر: ${Number(product.price).toLocaleString()} ريال\nالكمية المطلوبة: ${quantity}\nرابط: ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-full"
                style={{ padding: '1rem', fontSize: '1.1rem', background: '#25D366', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                الطلب السريع عبر واتساب
              </a>
            </div>

            <div className="detail-features">
              <div className="detail-feature"><span>✅</span> شحن مجاني للطلبات أكثر من 50,000 ريال</div>
              <div className="detail-feature"><span>🔄</span> إمكانية الإرجاع خلال 14 يوم</div>
              <div className="detail-feature"><span>🔒</span> ضمان الجودة من المنصة</div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>⭐ التقييمات ({reviews.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(r => (
                <div key={r.id} className="order-history-card">
                  <div className="order-history-top">
                    <span style={{ fontWeight: 700 }}>👤 {r.username || 'مستخدم'}</span>
                    <span>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
