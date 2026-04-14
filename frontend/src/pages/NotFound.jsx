import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="page-content">
    <div className="container">
      <div className="notfound-container">
        <div className="notfound-code">404</div>
        <div className="notfound-icon">🔍</div>
        <h1>الصفحة غير موجودة</h1>
        <p>عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها</p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary">🏠 العودة للرئيسية</Link>
          <Link to="/products" className="btn btn-outline">🛍️ تصفح المنتجات</Link>
        </div>
      </div>
    </div>
  </div>
);

export default NotFound;
