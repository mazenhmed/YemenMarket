import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyStore } from '../services/api';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [vendorStoreName, setVendorStoreName] = useState(null);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user && user.role === 'vendor') {
      getMyStore()
        .then(res => {
          if (res.data && res.data.store_name) {
            setVendorStoreName(res.data.store_name);
          }
        })
        .catch(() => {});
    } else {
      setVendorStoreName(null);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">Y</div>
          <div className="logo-text">Yemen<span>Market</span></div>
        </Link>

        <ul className="nav-links">
          <li><Link to="/" className="nav-link">الرئيسية</Link></li>
          <li><Link to="/stores" className="nav-link">المتاجر</Link></li>
          <li><Link to="/products" className="nav-link">المنتجات</Link></li>
          
          {user?.role === 'admin' && (
            <li><Link to="/admin" className="nav-link nav-link-admin">🛡️ إدارة المنصة</Link></li>
          )}
          
          {user?.role === 'vendor' && (
            <li><Link to="/vendor/dashboard" className="nav-link nav-link-vendor" title="الانتقال للمتجر">
                 🏪 {vendorStoreName ? `متجري (${vendorStoreName})` : 'متجري'}
            </Link></li>
          )}
        </ul>

        <div className="nav-actions">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Cart */}
          <Link to="/cart" className="nav-cart" title="سلة التسوق">
            🛒
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="nav-user-wrapper">
              <button className="nav-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="nav-user-avatar">
                  {user.role === 'admin' ? '🛡️' : user.role === 'vendor' ? '🏪' : '👤'}
                </span>
                <span className="nav-user-name">{user.username}</span>
                <span className="nav-user-role-tag">
                  {user.role === 'admin' ? 'مدير' : user.role === 'vendor' ? (vendorStoreName || 'بائع') : 'عميل'}
                </span>
              </button>

              {menuOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <strong>{user.username}</strong>
                    <small>{user.email}</small>
                  </div>
                  <div className="nav-dropdown-divider"></div>
                  
                  <Link to="/profile" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>👤 الملف الشخصي</Link>
                  <Link to="/notifications" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>🔔 الإشعارات</Link>
                  
                  {user.role === 'admin' && (
                    <Link to="/admin" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>🛡️ إدارة المنصة</Link>
                  )}
                  
                  {user.role === 'vendor' && (
                    <Link to="/vendor/dashboard" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                      🏪 {vendorStoreName ? `إدارة: ${vendorStoreName}` : 'لوحة تحكم المتجر'}
                    </Link>
                  )}
                  
                  <Link to="/cart" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>🛒 سلة التسوق</Link>
                  
                  <div className="nav-dropdown-divider"></div>
                  <button className="nav-dropdown-item logout" onClick={handleLogout}>🚪 تسجيل الخروج</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">تسجيل الدخول</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
