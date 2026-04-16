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

        <div className="results-info">
          <span>عرض {filtered.length} منتج</span>
        </div>

        <div className="products-grid">
          {filtered.map(product => (
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
          ))}
        </div>

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
