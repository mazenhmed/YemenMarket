import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../services/api';

const SalesReport = () => {
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports/sales/', { params: { period } });
      setReport(res.data);
    } catch (err) {
      console.error("Error fetching report", err);
    }
    setLoading(false);
  };

  if (loading) return <div className="page-content"><div className="container"><div className="spinner"></div></div></div>;

  if (!report) return <div className="page-content"><div className="container"><h3>خطأ في جلب التقرير</h3></div></div>;

  return (
    <div className="page-content">
      <div className="container" style={{ direction: 'rtl' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary-700)' }}>📊 تقرير المبيعات والأرباح</h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #ccc' }}
          >
            <option value="daily">يومي (آخر 7 أيام)</option>
            <option value="weekly">أسبوعي (آخر شهر)</option>
            <option value="monthly">شهري (آخر سنة)</option>
            <option value="yearly">سنوي (كل السنوات)</option>
          </select>
        </div>

        <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '3rem' }}>
          <div className="admin-stat-card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <div className="admin-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>💰</div>
            <div>
              <div className="admin-stat-value">{Number(report.summary.total_revenue || 0).toLocaleString()} ريال</div>
              <div className="admin-stat-label">إجمالي الأرباح</div>
            </div>
          </div>
          <div className="admin-stat-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
            <div className="admin-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>🛒</div>
            <div>
              <div className="admin-stat-value">{report.summary.total_orders || 0}</div>
              <div className="admin-stat-label">عدد الطلبات</div>
            </div>
          </div>
          <div className="admin-stat-card" style={{ background: '#fef3c7', borderColor: '#fde68a' }}>
            <div className="admin-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>📈</div>
            <div>
              <div className="admin-stat-value">{Number(report.summary.average_order_value || 0).toLocaleString()} ريال</div>
              <div className="admin-stat-label">متوسط قيمة الطلب</div>
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', color: 'var(--primary-700)' }}>مؤشر المبيعات ({period})</h3>
        <div className="dashboard-table" style={{ background: 'white', padding: '1rem', borderRadius: '12px', overflowX: 'auto' }}>
          <div className="table-header" style={{ gridTemplateColumns: 'revert', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{flex: 1}}>التاريخ</span>
            <span style={{flex: 1, textAlign: 'center'}}>الطلبات</span>
            <span style={{flex: 1, textAlign: 'left'}}>المبيعات</span>
          </div>
          {report.trend.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>لا توجد بيانات لهذه الفترة</p>
          ) : (
            report.trend.map((t, idx) => (
              <div key={idx} className="table-row" style={{ gridTemplateColumns: 'revert', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '1rem 0' }}>
                <span style={{flex: 1}}>{new Date(t.date).toLocaleDateString('ar')}</span>
                <span style={{flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#3b82f6'}}>{t.orders_count} طلب</span>
                <span style={{flex: 1, textAlign: 'left', fontWeight: 'bold', color: '#059669'}}>{Number(t.total_sales).toLocaleString()} ريال</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
