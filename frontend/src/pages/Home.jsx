import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getCategories, getFeaturedProducts, getStores } from '../services/api';

const FALLBACK_CATEGORIES = [
  { id: 1, name_ar: 'إلكترونيات', icon: '📱', product_count: 8 },
  { id: 2, name_ar: 'أزياء وملابس', icon: '👗', product_count: 4 },
  { id: 3, name_ar: 'أثاث ومنزل', icon: '🏠', product_count: 2 },
  { id: 4, name_ar: 'أغذية طبيعية', icon: '🥗', product_count: 4 },
  { id: 5, name_ar: 'عناية وجمال', icon: '💄', product_count: 3 },
  { id: 6, name_ar: 'رياضة', icon: '⚽', product_count: 3 },
];

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'سماعات بلوتوث لاسلكية برو', price: 45000, vendor_name: 'متجر التقنية', rating: '4.8', sold_count: 134 },
  { id: 2, name: 'لابتوب ألترا بوك', price: 350000, vendor_name: 'عالم الحاسوب', rating: '4.9', sold_count: 48 },
  { id: 3, name: 'عسل سدر يمني 1 كيلو', price: 35000, vendor_name: 'بيت العسل', rating: '4.9', sold_count: 210 },
  { id: 4, name: 'فستان سهرة أنيق', price: 55000, vendor_name: 'أزياء صنعاء', rating: '4.6', sold_count: 67 },
];

const FALLBACK_STORES = [
  { id: 1, store_name: 'متجر التقنية الحديثة', rating: '4.8', city: 'صنعاء', is_verified: true, logo: 'https://cdn-icons-png.flaticon.com/512/619/619153.png' },
  { id: 2, store_name: 'أزياء صنعاء', rating: '4.7', city: 'صنعاء', is_verified: true, logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050239.png' },
  { id: 3, store_name: 'بيت العسل اليمني', rating: '4.9', city: 'تعز', is_verified: true, logo: 'https://cdn-icons-png.flaticon.com/512/2101/2101740.png' },
];

const colors = ['#059669', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];

const Home = () => {
  const { addToCart } = useCart();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes, storeRes] = await Promise.all([
          getCategories(), getFeaturedProducts(), getStores({ page_size: 4 })
        ]);
        setCategories(catRes.data.results || catRes.data || FALLBACK_CATEGORIES);
        setFeaturedProducts(prodRes.data.results || prodRes.data || FALLBACK_PRODUCTS);
        const stData = storeRes.data.results || storeRes.data || FALLBACK_STORES;
        setStores(Array.isArray(stData) ? stData.slice(0, 4) : FALLBACK_STORES);
      } catch {
        setCategories(FALLBACK_CATEGORIES);
        setFeaturedProducts(FALLBACK_PRODUCTS);
        setStores(FALLBACK_STORES);
      }
    };
    fetchData();
  }, []);

  const getIcon = (cat) => {
    if (cat.includes('إلكترون')) return '📱';
    if (cat.includes('أزياء')) return '👗';
    if (cat.includes('أغذية')) return '🥗';
    if (cat.includes('عناية')) return '💄';
    if (cat.includes('رياض')) return '⚽';
    if (cat.includes('أثاث')) return '🏠';
    return '📦';
  };

  const handleAddToCart = (p) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      vendor_id: p.vendor_id || p.vendor,
      vendor_name: p.vendor_name || 'متجر',
      vendor: p.vendor_name || 'متجر',
      image: p.image || null,
      icon: getIcon(p.category_name || ''),
    });
    toast.success('تمت الإضافة للسلة ✅');
  };

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-tag"><div className="hero-tag-dot"></div> منصة التجارة الإلكترونية الأولى في اليمن</div>
              <h1>
                <span className="text-gradient-main">تسوق بذكاء</span>
                من <span className="highlight">أفضل المتاجر</span><br />
                <span className="text-flag"><span className="flag-gradient">اليمنية</span></span>
              </h1>
              <p className="hero-desc">اكتشف آلاف المنتجات من متاجر موثوقة مع توصيل سريع وضمان جودة. السوق اليمني في متناول يدك.</p>
              <div className="hero-buttons">
                <Link to="/products" className="btn btn-primary">تسوق الآن ←</Link>
                <Link to="/stores" className="btn btn-outline">تصفح المتاجر</Link>
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><div className="hero-stat-number">+500</div><div className="hero-stat-label">منتج متنوع</div></div>
                <div className="hero-stat"><div className="hero-stat-number">+50</div><div className="hero-stat-label">متجر موثوق</div></div>
                <div className="hero-stat"><div className="hero-stat-number">+1000</div><div className="hero-stat-label">عميل سعيد</div></div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-card-stack">
                <div className="hero-float-card"><div className="float-card-icon" style={{background:'rgba(16,185,129,0.1)'}}>🛒</div><div className="float-card-title">تسوق آمن</div><div className="float-card-sub">ضمان الجودة والأصالة</div></div>
                <div className="hero-float-card"><div className="float-card-icon" style={{background:'rgba(245,158,11,0.1)'}}>⚡</div><div className="float-card-title">توصيل سريع</div><div className="float-card-sub">لجميع المحافظات</div></div>
                <div className="hero-float-card"><div className="float-card-icon" style={{background:'rgba(99,102,241,0.1)'}}>🏪</div><div className="float-card-title">متاجر موثوقة</div><div className="float-card-sub">بائعون معتمدون</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">📂 الأقسام</span>
            <h2>تصفح حسب القسم</h2>
            <p>اعثر على ما تبحث عنه بسرعة من خلال أقسامنا المتنوعة</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat, i) => (
              <Link to={`/products?category=${cat.name_ar || cat.name}`} key={cat.id || i} className="category-card">
                <div className="category-icon">{cat.icon || getIcon(cat.name_ar || cat.name || '')}</div>
                <div className="category-name">{cat.name_ar || cat.name}</div>
                <div className="category-count">{cat.product_count || 0} منتج</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-badge">⭐ الأكثر مبيعاً</span>
            <h2>منتجات مميزة</h2>
            <p>أكثر المنتجات شعبية ومبيعاً في المنصة</p>
          </div>
          <div className="products-grid">
            {featuredProducts.slice(0, 8).map(product => (
              <div key={product.id} className="product-card">
                <Link to={`/product/${product.id}`}>
                  <div className="product-image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{width:'100%',height:'100%',objectFit:'contain',backgroundColor:'#f8fafc'}} />
                    ) : (
                      <span className="product-image-icon">{getIcon(product.category_name || '')}</span>
                    )}
                    {product.is_featured && <span className="product-badge" style={{background:'linear-gradient(135deg, #6366f1, #8b5cf6)'}}>مميز</span>}
                  </div>
                </Link>
                <div className="product-info">
                  <div className="product-vendor">{product.vendor_name || 'متجر'}</div>
                  <Link to={`/product/${product.id}`}><h3 className="product-name">{product.name}</h3></Link>
                  <div className="product-meta">
                    <span className="product-price">{Number(product.price).toLocaleString()} ريال</span>
                    <span className="product-rating">⭐ {product.rating}</span>
                  </div>
                  <div className="product-actions">
                    <button className="btn btn-primary btn-sm btn-full" onClick={() => handleAddToCart(product)}>أضف للسلة</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/products" className="btn btn-outline">عرض جميع المنتجات ←</Link>
          </div>
        </div>
      </section>

      {/* Stores */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">🏪 المتاجر</span>
            <h2>متاجر موثوقة</h2>
            <p>تعرف على أفضل المتاجر في المنصة</p>
          </div>
          <div className="stores-grid">
            {stores.map((store, i) => (
              <Link to={`/store/${store.id}`} key={store.id} className="store-card">
                <div className="store-avatar" style={{ background: `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`, overflow: 'hidden' }}>
                  {store.logo ? (
                    <img src={store.logo} alt={store.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (store.store_name || 'م')[0]
                  )}
                </div>
                <div>
                  <div className="store-name">{store.store_name}</div>
                  <div className="store-meta">⭐ {store.rating} • {store.city}</div>
                  {store.is_verified && <div className="store-verified">✅ موثق</div>}
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/stores" className="btn btn-outline">عرض جميع المتاجر ←</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-badge">💎 لماذا نحن</span>
            <h2>لماذا تختار YemenMarket؟</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card"><div className="feature-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>🔒</div><div className="feature-title">تسوق آمن</div><div className="feature-desc">حماية كاملة لمعلوماتك وبياناتك الشخصية مع أنظمة دفع موثوقة</div></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>🚚</div><div className="feature-title">شحن سريع</div><div className="feature-desc">توصيل لجميع المحافظات اليمنية خلال 2-5 أيام عمل</div></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>💰</div><div className="feature-title">أفضل الأسعار</div><div className="feature-desc">أسعار منافسة مع عروض وخصومات حصرية على مدار العام</div></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: 'rgba(244,63,94,0.1)' }}>🔄</div><div className="feature-title">سهولة الإرجاع</div><div className="feature-desc">سياسة إرجاع مرنة خلال 14 يوم من الشراء</div></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-section">
            <div className="cta-content">
              <h2>كن بائعاً في YemenMarket</h2>
              <p>انضم لأكبر منصة تجارة إلكترونية في اليمن وابدأ ببيع منتجاتك لآلاف العملاء</p>
              <div className="cta-buttons">
                <Link to="/register" className="btn-white">ابدأ الآن مجاناً</Link>
                <Link to="/stores" className="btn-white-outline">تعرف على المزيد</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
