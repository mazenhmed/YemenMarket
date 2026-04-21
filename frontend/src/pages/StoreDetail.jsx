import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getStore, getProducts } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const colors = ['#059669', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

const StoreDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const toast = useToast();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeRes = await getStore(id);
        setStore(storeRes.data);
        const prodRes = await getProducts({ vendor: id, page_size: 50 });
        const prodData = prodRes.data.results || prodRes.data;
        setProducts(Array.isArray(prodData) ? prodData : []);
      } catch {
        setStore({ id: parseInt(id), store_name: 'متجر', description: 'قم بتشغيل الخادم لعرض التفاصيل', city: '-', rating: '0', is_verified: false });
        setProducts([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleAddToCart = (p) => {
    addToCart({ id: p.id, name: p.name, price: Number(p.price), vendor: store?.store_name || 'متجر', icon: '📦' });
    toast.success('تمت الإضافة للسلة ✅');
  };

  if (loading) return <div className="page-content"><LoadingSpinner /></div>;
  if (!store) return null;

  return (
    <div className="page-content">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">الرئيسية</Link><span>/</span>
          <Link to="/stores">المتاجر</Link><span>/</span>
          <span className="current">{store.store_name}</span>
        </div>

        <div className="store-detail-header">
          <div className="store-detail-avatar" style={{ background: `linear-gradient(135deg, ${colors[(id - 1) % colors.length]}, ${colors[id % colors.length]})`, overflow: 'hidden' }}>
            {store.logo ? (
              <img src={store.logo} alt={store.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (store.store_name || 'م')[0]
            )}
          </div>
          <div className="store-detail-info">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {store.store_name} 
              {store.is_verified && <span title="موثق من الإدارة" style={{fontSize: '1.2rem'}}>✅</span>}
              {store.is_premium && <span title="متجر مميز" style={{fontSize: '1.2rem'}}>🥇</span>}
            </h1>
            <p>{store.description}</p>
            <div className="store-detail-stats">
              <span>⭐ {store.rating}</span>
              <span>📍 {store.city}</span>
              <span>📦 {products.length} منتج</span>
              {store.is_verified && <span className="store-verified">موثق من المنصة</span>}
            </div>
            <div style={{marginTop: '1.5rem'}}>
              <a 
                href={`https://wa.me/${store.owner_phone || store.phone || '777161670'}?text=${encodeURIComponent(`مرحباً ${store.store_name}.. لقد زرت متجركم على منصة يمن ماركت وأود الاستفسار عن:`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{padding: '0.6rem 1.2rem', background: '#25D366', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold'}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                تواصل مع المتجر
              </a>
            </div>
          </div>
        </div>

        <h2 style={{ margin: '2rem 0 1.5rem' }}>منتجات المتجر ({products.length})</h2>

        {products.length > 0 ? (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <Link to={`/product/${product.id}`}>
                  <div className="product-image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{width:'100%',height:'100%',objectFit:'contain',backgroundColor:'#f8fafc'}} />
                    ) : (
                      <span className="product-image-icon">📦</span>
                    )}
                  </div>
                </Link>
                <div className="product-info">
                  <Link to={`/product/${product.id}`}><h3 className="product-name">{product.name}</h3></Link>
                  <div className="product-meta">
                    <span className="product-price">{Number(product.price).toLocaleString()} ريال</span>
                    <span className="product-rating">⭐ {product.rating}</span>
                  </div>
                  <button className="btn btn-primary btn-sm btn-full" onClick={() => handleAddToCart(product)}>أضف للسلة</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><span className="empty-icon">📭</span><h3>لا توجد منتجات بعد</h3></div>
        )}
      </div>
    </div>
  );
};

export default StoreDetail;
