import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStores } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const FALLBACK_STORES = [
  { id: 1, store_name: 'متجر التقنية الحديثة', description: 'أحدث الأجهزة الإلكترونية', city: 'صنعاء', rating: '4.8', is_verified: true },
  { id: 2, store_name: 'أزياء صنعاء', description: 'أحدث صيحات الموضة', city: 'صنعاء', rating: '4.7', is_verified: true },
  { id: 3, store_name: 'بيت العسل اليمني', description: 'عسل سدر طبيعي وأعشاب', city: 'تعز', rating: '4.9', is_verified: true },
  { id: 4, store_name: 'عالم الحاسوب', description: 'لابتوبات وملحقات', city: 'عدن', rating: '4.8', is_verified: true },
  { id: 5, store_name: 'جمال اليمن', description: 'منتجات عناية بالبشرة', city: 'صنعاء', rating: '4.7', is_verified: true },
  { id: 6, store_name: 'رياضة اليمن', description: 'ملابس ومعدات رياضية', city: 'إب', rating: '4.4', is_verified: false },
];

const colors = ['#059669', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await getStores({ page_size: 50 });
        const data = res.data.results || res.data;
        setStores(Array.isArray(data) ? data : FALLBACK_STORES);
      } catch {
        setStores(FALLBACK_STORES);
      }
      setLoading(false);
    };
    fetchStores();
  }, []);

  const filtered = stores.filter(s =>
    !searchQuery || s.store_name.includes(searchQuery) || (s.city || '').includes(searchQuery)
  );

  if (loading) return <div className="page-content"><LoadingSpinner text="جارِ تحميل المتاجر..." /></div>;

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>المتاجر</h1>
          <p>تعرف على أفضل المتاجر الموثوقة في منصة YemenMarket</p>
        </div>

        <div className="search-bar-wrapper">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="ابحث عن متجر..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="results-info"><span>عرض {filtered.length} متجر</span></div>

        <div className="stores-page-grid">
          {filtered.map((store, i) => (
            <Link to={`/store/${store.id}`} key={store.id} className="store-page-card">
              <div className="store-page-avatar" style={{ background: `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`, overflow: 'hidden' }}>
                {store.logo ? (
                  <img src={store.logo} alt={store.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (store.store_name || 'م')[0]
                )}
              </div>
              <div>
                <div className="store-page-name">
                  {store.store_name}
                  {store.is_verified && <span className="verified-badge">✅ موثق</span>}
                  {store.is_premium && <span style={{fontSize:'0.85rem',background:'linear-gradient(135deg, #fef08a, #f59e0b)',color:'#713f12',padding:'0.2rem 0.8rem',borderRadius:'20px',marginRight:'0.5rem',fontWeight:'bold',display:'inline-flex',alignItems:'center',gap:'0.2rem'}}>🥇 مميز</span>}
                </div>
                <p className="store-page-desc">{store.description}</p>
                <div className="store-page-meta">
                  <span>⭐ {store.rating}</span>
                  <span>📍 {store.city}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🏪</span>
            <h3>لم يتم العثور على متاجر</h3>
            <p>جرب البحث بكلمات مختلفة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;
