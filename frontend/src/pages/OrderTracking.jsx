import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trackShipment } from '../services/api';

const STATUS_TIMELINE = [
  { key: 'preparing', label: 'قيد التجهيز', icon: '📦', desc: 'يتم تجهيز طلبك' },
  { key: 'picked_up', label: 'تم الاستلام', icon: '🏪', desc: 'تم استلام الطرد من البائع' },
  { key: 'in_transit', label: 'في الطريق', icon: '🚚', desc: 'الشحنة في الطريق إليك' },
  { key: 'out_for_delivery', label: 'خارج للتوصيل', icon: '🛵', desc: 'المندوب في طريقه إليك' },
  { key: 'delivered', label: 'تم التوصيل', icon: '✅', desc: 'تم توصيل الطلب بنجاح' },
];

const OrderTracking = () => {
  const { trackingNumber } = useParams();
  const [inputNumber, setInputNumber] = useState(trackingNumber || '');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trackingNumber) handleTrack(trackingNumber);
  }, [trackingNumber]);

  const handleTrack = async (num) => {
    const tn = num || inputNumber;
    if (!tn) return;
    setLoading(true);
    setError('');
    try {
      const res = await trackShipment(tn);
      setShipment(res.data);
    } catch {
      setShipment(null);
      setError('رقم التتبع غير صحيح أو لم يتم إنشاء شحنة لهذا الطلب بعد');
    }
    setLoading(false);
  };

  const getStatusIndex = (status) => STATUS_TIMELINE.findIndex(s => s.key === status);
  const currentIndex = shipment ? getStatusIndex(shipment.status) : -1;

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>📦 تتبع الشحنة</h1>
          <p>تتبع حالة شحنتك في الوقت الفعلي</p>
        </div>

        {/* Search Box */}
        <div className="tracking-search-box">
          <div className="tracking-search-inner">
            <input
              type="text"
              placeholder="أدخل رقم التتبع (مثال: YM-SH-XXXXXXXX)"
              value={inputNumber}
              onChange={e => setInputNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              className="tracking-input"
            />
            <button className="btn btn-primary" onClick={() => handleTrack()} disabled={loading}>
              {loading ? 'جارِ البحث...' : '🔍 تتبع'}
            </button>
          </div>
        </div>

        {error && (
          <div className="tracking-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {shipment && (
          <div className="tracking-result">
            {/* Shipment Info */}
            <div className="tracking-info-cards">
              <div className="tracking-info-card">
                <div className="tracking-info-label">رقم التتبع</div>
                <div className="tracking-info-value">{shipment.tracking_number}</div>
              </div>
              <div className="tracking-info-card">
                <div className="tracking-info-label">شركة الشحن</div>
                <div className="tracking-info-value">{shipment.carrier}</div>
              </div>
              <div className="tracking-info-card">
                <div className="tracking-info-label">الموقع الحالي</div>
                <div className="tracking-info-value">{shipment.current_location || 'غير محدد'}</div>
              </div>
              {shipment.estimated_delivery && (
                <div className="tracking-info-card">
                  <div className="tracking-info-label">التوصيل المتوقع</div>
                  <div className="tracking-info-value">{new Date(shipment.estimated_delivery).toLocaleDateString('ar-YE')}</div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="tracking-timeline">
              {STATUS_TIMELINE.map((step, idx) => {
                const isActive = idx <= currentIndex;
                const isCurrent = idx === currentIndex;
                const isReturned = shipment.status === 'returned';
                return (
                  <div key={step.key} className={`timeline-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="timeline-icon-wrapper">
                      <div className={`timeline-icon ${isActive ? 'done' : ''}`}>{step.icon}</div>
                      {idx < STATUS_TIMELINE.length - 1 && <div className={`timeline-line ${isActive && idx < currentIndex ? 'done' : ''}`}></div>}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-label">{step.label}</div>
                      <div className="timeline-desc">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {shipment.notes && (
              <div className="tracking-notes"><strong>ملاحظات:</strong> {shipment.notes}</div>
            )}
          </div>
        )}

        {!shipment && !error && !loading && (
          <div className="empty-state" style={{ marginTop: '3rem' }}>
            <div className="empty-icon">🔍</div>
            <h3>أدخل رقم التتبع لمتابعة شحنتك</h3>
            <p>ستجد رقم التتبع في صفحة الملف الشخصي بجانب طلبك</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
