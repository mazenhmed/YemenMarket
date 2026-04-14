import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        {/* Payment Methods Strip */}
        <div className="footer-payment-strip">
          <span className="fps-title">طرق الدفع المدعومة</span>
          <div className="fps-icons">
            <span title="الدفع عند الاستلام">💵</span>
            <span title="فلوسك">📱</span>
            <span title="جوالي">📲</span>
            <span title="كريمي">🏦</span>
            <span title="تحويل بنكي">🏛️</span>
            <span title="Visa / Mastercard">💳</span>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <div className="logo-icon">Y</div>
              <div className="logo-text">Yemen<span>Market</span></div>
            </Link>
            <p>أكبر منصة تجارة إلكترونية يمنية متعددة البائعين. نربط بين المتاجر والمصانع والعملاء في مكان واحد آمن وموثوق.</p>
          </div>

          <div className="footer-col">
            <h4>روابط سريعة</h4>
            <Link to="/">الصفحة الرئيسية</Link>
            <Link to="/products">جميع المنتجات</Link>
            <Link to="/stores">المتاجر</Link>
            <Link to="/tracking">تتبع الشحنة</Link>
          </div>

          <div className="footer-col">
            <h4>للبائعين</h4>
            <Link to="/register">سجل كبائع</Link>
            <Link to="/vendor/dashboard">لوحة التحكم</Link>
            <Link to="/login">تسجيل الدخول</Link>
          </div>

          <div className="footer-col">
            <h4>تواصل معنا</h4>
            <a href="mailto:info@yemenmarket.com">info@yemenmarket.com</a>
            <a href="tel:+967770000000">170 161 777 967+</a>
            <a href="#">مارب , اليمن</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 YemenMarket. جميع الحقوق محفوظة.</p>
          <p>صُنع بإتقان 💚 في اليمن</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
