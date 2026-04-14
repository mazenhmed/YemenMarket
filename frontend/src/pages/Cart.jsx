import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="empty-icon">🛒</span>
            <h2>سلة التسوق فارغة</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>لم تقم بإضافة أي منتجات بعد</p>
            <Link to="/products" className="btn btn-primary">تصفح المنتجات</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>سلة التسوق</h1>
          <p>لديك {cartItems.length} منتج في السلة</p>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <span style={{ fontSize: '2.5rem' }}>{item.icon}</span>
                </div>
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p className="cart-item-vendor">{item.vendor}</p>
                  <div className="cart-item-price">{item.price.toLocaleString()} ريال</div>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>🗑️ حذف</button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ marginTop: '1rem' }}>🗑️ تفريغ السلة</button>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h3>ملخص الطلب</h3>
            <div className="summary-row">
              <span>المجموع الفرعي</span>
              <span>{totalPrice.toLocaleString()} ريال</span>
            </div>
            <div className="summary-row">
              <span>التوصيل</span>
              <span style={{ color: 'var(--primary-600)' }}>مجاناً</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>الإجمالي</span>
              <span>{totalPrice.toLocaleString()} ريال</span>
            </div>
            <Link to="/checkout" className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}>
              متابعة الشراء
            </Link>
            <Link to="/products" className="btn btn-outline btn-full" style={{ marginTop: '0.75rem' }}>
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
