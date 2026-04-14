import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderInvoice } from '../services/api';

const Invoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderInvoice(id)
      .then(res => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="page-content"><div className="container"><div className="loading-state"><div className="spinner"></div></div></div></div>;
  if (!order) return <div className="page-content"><div className="container"><div className="empty-state"><div className="empty-icon">📄</div><h3>الفاتورة غير موجودة</h3><Link to="/profile" className="btn btn-primary">العودة</Link></div></div></div>;

  const paymentLabels = {
    cash: 'الدفع عند الاستلام', transfer: 'تحويل بنكي', floosak: 'فلوسك',
    jawali: 'جوالي', kuraimi: 'كريمي', credit_card: 'بطاقة ائتمان',
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/profile" className="btn btn-outline">&larr; العودة</Link>
          <button className="btn btn-primary" onClick={handlePrint}>🖨️ طباعة الفاتورة</button>
        </div>

        <div className="invoice-container" id="invoice-printable">
          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="invoice-logo">
              <div className="logo-icon" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>Y</div>
              <div>
                <h2 style={{ margin: 0 }}>Yemen<span style={{ color: 'var(--primary)' }}>Market</span></h2>
                <small>منصة التجارة الإلكترونية اليمنية</small>
              </div>
            </div>
            <div className="invoice-meta">
              <h2 style={{ margin: 0, color: 'var(--primary)' }}>فاتورة</h2>
              <p style={{ margin: '0.3rem 0' }}><strong>رقم الفاتورة:</strong> INV-{order.order_number}</p>
              <p style={{ margin: '0.3rem 0' }}><strong>التاريخ:</strong> {new Date(order.created_at).toLocaleDateString('ar-YE')}</p>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* Customer Info */}
          <div className="invoice-info-grid">
            <div className="invoice-info-block">
              <h4>بيانات العميل</h4>
              <p>{order.full_name}</p>
              <p>📞 {order.phone}</p>
              <p>📍 {order.city} — {order.address}</p>
            </div>
            <div className="invoice-info-block">
              <h4>بيانات الطلب</h4>
              <p><strong>رقم الطلب:</strong> {order.order_number}</p>
              <p><strong>الحالة:</strong> <span className="badge">{order.get_status_display || order.status}</span></p>
              <p><strong>الدفع:</strong> {paymentLabels[order.payment_method] || order.payment_method}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>المنتج</th>
                <th>سعر الوحدة</th>
                <th>الكمية</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>{item.product_name}</td>
                  <td>{Number(item.product_price).toLocaleString()} ريال</td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.total || item.product_price * item.quantity).toLocaleString()} ريال</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="invoice-totals">
            <div className="invoice-total-row"><span>المجموع الفرعي</span><span>{Number(order.subtotal).toLocaleString()} ريال</span></div>
            {Number(order.shipping_cost) > 0 && (
              <div className="invoice-total-row"><span>الشحن</span><span>{Number(order.shipping_cost).toLocaleString()} ريال</span></div>
            )}
            {Number(order.shipping_cost) === 0 && (
              <div className="invoice-total-row"><span>الشحن</span><span style={{ color: '#059669' }}>مجاني</span></div>
            )}
            {Number(order.discount_amount) > 0 && (
              <div className="invoice-total-row" style={{ color: '#059669' }}><span>الخصم</span><span>- {Number(order.discount_amount).toLocaleString()} ريال</span></div>
            )}
            <div className="invoice-total-row grand-total">
              <span>الإجمالي النهائي</span>
              <span>{Number(order.total_price).toLocaleString()} ريال</span>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <p>شكراً لتسوقك من <strong>YemenMarket</strong> — أكبر منصة تجارة إلكترونية يمنية</p>
            <small>info@yemenmarket.com | 967+ 777 161 170</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
