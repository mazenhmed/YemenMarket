import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getProducts, getCategories } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'سماعات بلوتوث لاسلكية برو', price: 45000, vendor_name: 'متجر التقنية', rating: '4.8', category_name: 'إلكترونيات', icon: '🎧' },
  { id: 2, name: 'لابتوب ألترا بوك - معالج حديث', price: 350000, vendor_name: 'عالم الحاسوب', rating: '4.9', category_name: 'إلكترونيات', icon: '💻' },
  { id: 3, name: 'ساعة ذكية رياضية مقاومة للماء', price: 25000, vendor_name: 'ساعات اليمن', rating: '4.7', category_name: 'إلكترونيات', icon: '⌚' },
  { id: 4, name: 'فستان سهرة أنيق', price: 55000, vendor_name: 'أزياء صنعاء', rating: '4.6', category_name: 'أزياء وملابس', icon: '👗' },
  { id: 5, name: 'عسل سدر يمني طبيعي 1 كيلو', price: 35000, vendor_name: 'بيت العسل', rating: '4.9', category_name: 'أغذية طبيعية', icon: '🍯' },
  { id: 6, name: 'طقم عناية بالبشرة', price: 28000, vendor_name: 'جمال اليمن', rating: '4.7', category_name: 'عناية وجمال', icon: '💄' },
];

const Products = () => {
  const { addToCart } = useCart();
  const toast = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCat = searchParams.get('category') || 'الكل';
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'الكل');
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories first
        const catRes = await getCategories();
        const catData = catRes.data.results || catRes.data;
        setCategories(Array.isArray(catData) ? catData : []);

        // Fetch all products across all pages
        let allProds = [];
        let page = 1;
        let hasNext = true;
        
        while (hasNext && page <= 10) { // Safety limit 10 pages
          const res = await getProducts({ page: page, page_size: 100 });
          const items = res.data.results || res.data;
          allProds = [...allProds, ...(Array.isArray(items) ? items : [])];
          
          if (res.data.next) {
            page++;
          } else {
            hasNext = false;
          }
        }
        setProducts(allProds);

      } catch (err) {
        console.error("Error fetching data:", err);
        setProducts(FALLBACK_PRODUCTS);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const categoryNames = ['الكل', ...categories.map(c => c.name_ar || c.name)];

  const filtered = products.filter(p => {
    const catName = (p.category_name || '').trim();
    const active = activeCategory.trim();
    const matchCategory = active === 'الكل' || catName === active;
    const matchSearch = !searchQuery || 
      p.name.includes(searchQuery) || 
      (p.vendor_name || '').includes(searchQuery);
    return matchCategory && matchSearch;
  });

  // Apply Sorting
  let sortedProducts = [...filtered];
  if (sortBy === 'most_ordered') {
    sortedProducts.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
  } else if (sortBy === 'alphabetical') {
    sortedProducts.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  } else if (sortBy === 'random') {
    sortedProducts.sort(() => Math.random() - 0.5);
  }

  const getIcon = (p) => {
    if (p.icon) return p.icon;
    const cat = p.category_name || '';
    if (cat.includes('إلكترون')) return '📱';
    if (cat.includes('أزياء')) return '👗';
    if (cat.includes('أغذية')) return '🥗';
    if (cat.includes('عناية')) return '💄';
    if (cat.includes('رياض')) return '⚽';
    if (cat.includes('أثاث')) return '🏠';
    return '📦';
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      vendor_id: product.vendor_id || product.vendor,
      vendor_name: product.vendor_name || 'متجر',
      vendor: product.vendor_name || 'متجر',
      image: product.image || null,
      icon: getIcon(product),
    });
    toast.success('تمت الإضافة للسلة ✅');
  };

  const renderProductCard = (product) => (
    <div key={product.id} className="product-card">
      <Link to={`/product/${product.id}`}>
        <div className="product-image">
          {product.image ? (
            <img src={product.image} alt={product.name} style={{width:'100%',height:'100%',objectFit:'contain',backgroundColor:'#f8fafc'}} />
          ) : (
            <span className="product-image-icon">{getIcon(product)}</span>
          )}
          {product.is_on_sale && <span className="product-badge">خصم {product.discount_percentage}%</span>}
          {product.is_featured && !product.is_on_sale && <span className="product-badge" style={{background:'linear-gradient(135deg, #6366f1, #8b5cf6)'}}>مميز</span>}
        </div>
      </Link>
      <div className="product-info">
        <div className="product-vendor">{product.vendor_name || 'متجر'}</div>
        <Link to={`/product/${product.id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <div className="product-meta">
          <span className="product-price">{Number(product.price).toLocaleString()} ريال</span>
          <span className="product-rating">⭐ {product.rating}</span>
        </div>
        <div className="product-actions">
          <button className="btn btn-primary btn-sm btn-full" onClick={() => handleAddToCart(product)}>أضف للسلة</button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="page-content"><LoadingSpinner text="جارِ تحميل المنتجات..." /></div>;

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>جميع المنتجات</h1>
          <p>اكتشف تشكيلة واسعة من المنتجات المميزة من أفضل البائعين</p>
        </div>

        <div className="search-bar-wrapper">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="ابحث عن منتج أو متجر..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="filter-tabs">
          {categoryNames.map(cat => (
            <button key={cat} className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>

        <div className="results-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span>عرض {filtered.length} منتج</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>فرز حسب:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <option value="default">الترتيب الافتراضي</option>
              <option value="most_ordered">🔥 الأكثر طلباً</option>
              <option value="alphabetical">🔤 أبجدي (أ - ي)</option>
              <option value="random">🎲 ترتيب عشوائي</option>
            </select>
          </div>
        </div>

        {activeCategory === 'الكل' && !searchQuery ? (
          <div className="grouped-products">
            {categories.map((cat, idx) => {
              const catName = cat.name_ar || cat.name;
              const catProds = sortedProducts.filter(p => (p.category_name || '').trim() === catName.trim()).slice(0, 3);
              if (catProds.length === 0) return null;
              return (
                <div key={cat.id || idx} style={{ marginBottom: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #cbd5e1', paddingBottom: '0.8rem' }}>
                    <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e293b', margin: 0 }}>
                      <span style={{ fontSize: '1.8rem' }}>{cat.icon || '📁'}</span> {catName}
                    </h2>
                    <button className="btn btn-outline btn-sm" onClick={() => setActiveCategory(catName)}>عرض المزيد ←</button>
                  </div>
                  <div className="products-grid">
                    {catProds.map(renderProductCard)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="products-grid">
            {sortedProducts.map(renderProductCard)}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>لم يتم العثور على نتائج</h3>
            <p>جرب البحث بكلمات مختلفة أو تصفح الأقسام الأخرى</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
