import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyStore } from '../services/api';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendorStoreName, setVendorStoreName] = useState(null);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
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

            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="فتح القائمة">
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide Menu */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={closeMobileMenu}></div>
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            <div className="logo-icon">Y</div>
            <div className="logo-text">Yemen<span>Market</span></div>
          </Link>
          <button className="mobile-menu-close" onClick={closeMobileMenu}>✕</button>
        </div>
        <div className="mobile-menu-links">
          {user && (
            <>
              <Link to="/profile" onClick={closeMobileMenu}>
                <span>{user.role === 'admin' ? '🛡️' : user.role === 'vendor' ? '🏪' : '👤'}</span>
                <span>{user.username}</span>
              </Link>
              <div className="divider"></div>
            </>
          )}
          <Link to="/" onClick={closeMobileMenu}>🏠 الرئيسية</Link>
          <Link to="/products" onClick={closeMobileMenu}>📦 المنتجات</Link>
          <Link to="/stores" onClick={closeMobileMenu}>🏪 المتاجر</Link>
          <Link to="/cart" onClick={closeMobileMenu}>
            🛒 سلة التسوق {totalItems > 0 && `(${totalItems})`}
          </Link>
          <Link to="/notifications" onClick={closeMobileMenu}>🔔 الإشعارات</Link>
          
          {user?.role === 'admin' && (
            <>
              <div className="divider"></div>
              <Link to="/admin" onClick={closeMobileMenu}>🛡️ إدارة المنصة</Link>
            </>
          )}
          
          {user?.role === 'vendor' && (
            <>
              <div className="divider"></div>
              <Link to="/vendor/dashboard" onClick={closeMobileMenu}>
                📊 {vendorStoreName ? `إدارة: ${vendorStoreName}` : 'لوحة تحكم المتجر'}
              </Link>
            </>
          )}
          
          <div className="divider"></div>
          
          {user ? (
            <button className="logout-btn" onClick={handleLogout}>🚪 تسجيل الخروج</button>
          ) : (
            <>
              <Link to="/login" onClick={closeMobileMenu}>🔑 تسجيل الدخول</Link>
              <Link to="/register" onClick={closeMobileMenu}>📝 إنشاء حساب</Link>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span>
            <span>الرئيسية</span>
          </Link>
          <Link to="/products" className={`bottom-nav-item ${isActive('/products') ? 'active' : ''}`}>
            <span className="nav-icon">📦</span>
            <span>المنتجات</span>
          </Link>
          <Link to="/cart" className={`bottom-nav-item ${isActive('/cart') ? 'active' : ''}`}>
            <span className="nav-icon">🛒</span>
            <span>السلة</span>
            {totalItems > 0 && <span className="nav-badge">{totalItems}</span>}
          </Link>
          <Link to="/stores" className={`bottom-nav-item ${isActive('/stores') ? 'active' : ''}`}>
            <span className="nav-icon">🏪</span>
            <span>المتاجر</span>
          </Link>
          <Link to={user ? '/profile' : '/login'} className={`bottom-nav-item ${isActive('/profile') || isActive('/login') ? 'active' : ''}`}>
            <span className="nav-icon">{user ? '👤' : '🔑'}</span>
            <span>{user ? 'حسابي' : 'دخول'}</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
