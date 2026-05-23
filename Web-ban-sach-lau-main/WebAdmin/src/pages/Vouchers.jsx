import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle,
  Tag,
  Percent,
  CircleDollarSign,
  X
} from 'lucide-react';
import client from '../api/client';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    max_discount: '',
    min_order: '',
    expired_at: ''
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/admin/vouchers');
      setVouchers(data || []);
    } catch (err) {
      console.error('Lỗi tải voucher:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDelete = async (id, code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã giảm giá "${code}"?`)) {
      try {
        await client.delete(`/admin/vouchers/${id}`);
        setVouchers(vouchers.filter(v => v.id !== id));
      } catch (err) {
        alert('Không thể xóa voucher');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discount_percent: Number(formData.discount_percent),
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        min_order: formData.min_order ? Number(formData.min_order) : null,
      };

      await client.post('/admin/vouchers', payload);
      alert('Tạo mã giảm giá thành công!');
      setShowModal(false);
      setFormData({ code: '', discount_percent: '', max_discount: '', min_order: '', expired_at: '' });
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Quản lý mã giảm giá</h1>
          <p style={styles.subtitle}>Tạo và quản lý các chương trình ưu đãi hệ thống.</p>
        </div>
        
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Thêm mã mới</span>
        </button>
      </header>

      <div style={styles.grid}>
        {loading ? (
          <div style={styles.loadingFull}>Đang tải danh sách voucher...</div>
        ) : vouchers.length === 0 ? (
          <div style={styles.emptyFull}>Chưa có mã giảm giá nào được tạo</div>
        ) : vouchers.map((v) => (
          <div key={v.id} style={styles.voucherCard}>
            <div style={styles.voucherLeft}>
              <div style={styles.voucherIcon}>
                <Ticket size={24} color="#fff" />
              </div>
              <div style={styles.dashLine}></div>
            </div>
            
            <div style={styles.voucherRight}>
              <div style={styles.cardHeader}>
                <h3 style={styles.voucherCode}>{v.code}</h3>
                <button 
                  style={styles.deleteIcon}
                  onClick={() => handleDelete(v.id, v.code)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={styles.discountRow}>
                <span style={styles.discountValue}>{v.discount_percent}% OFF</span>
              </div>
              
              <div style={styles.detailsRow}>
                <div style={styles.detailItem}>
                  <AlertCircle size={14} />
                  <span>Tối thiểu: {v.min_order?.toLocaleString() || 0}₫</span>
                </div>
                <div style={styles.detailItem}>
                  <Calendar size={14} />
                  <span>Hết hạn: {new Date(v.expired_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              
              <div style={styles.statusBadge}>
                {new Date(v.expired_at) < new Date() ? 'Hết hạn' : 'Đang áp dụng'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm mới */}
      {showModal && ReactDOM.createPortal(
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={styles.modal} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h2 style={{fontSize: '20px'}}>Tạo mã giảm giá mới</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mã giảm giá (VD: OMNI50)</label>
                <div style={styles.inputWrapper}>
                  <Tag size={18} style={styles.icon} />
                  <input 
                    type="text" 
                    placeholder="NHẬP MÃ" 
                    style={styles.input}
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputRow}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>% Giảm</label>
                  <div style={styles.inputWrapper}>
                    <Percent size={18} style={styles.icon} />
                    <input 
                      type="number" 
                      placeholder="VD: 10" 
                      style={styles.input}
                      value={formData.discount_percent}
                      onChange={e => setFormData({...formData, discount_percent: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Giảm tối đa (₫)</label>
                  <div style={styles.inputWrapper}>
                    <CircleDollarSign size={18} style={styles.icon} />
                    <input 
                      type="number" 
                      placeholder="Để trống nếu không giới hạn" 
                      style={styles.input}
                      value={formData.max_discount}
                      onChange={e => setFormData({...formData, max_discount: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Đơn hàng tối thiểu (₫)</label>
                <div style={styles.inputWrapper}>
                  <CircleDollarSign size={18} style={styles.icon} />
                  <input 
                    type="number" 
                    placeholder="VD: 100000" 
                    style={styles.input}
                    value={formData.min_order}
                    onChange={e => setFormData({...formData, min_order: e.target.value})}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Ngày hết hạn</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={18} style={styles.icon} />
                  <input 
                    type="date" 
                    style={styles.input}
                    value={formData.expired_at}
                    onChange={e => setFormData({...formData, expired_at: e.target.value})}
                    required
                  />
                </div>
              </div>

              <button type="submit" style={styles.submitBtn}>Tạo Voucher</button>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '30px',
  },
  title: { fontSize: '28px', fontWeight: '700' },
  subtitle: { color: 'var(--text-muted)', marginTop: '4px' },
  addBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    transition: 'transform 0.2s',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: 'var(--shadow)' }
  },
  voucherLeft: {
    width: '100px',
    backgroundColor: 'var(--primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  voucherIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: '2px dashed rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashLine: {
    position: 'absolute',
    right: '-1px',
    top: '10%',
    bottom: '10%',
    borderRight: '2px dashed #f8fafc',
  },
  voucherRight: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  voucherCode: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: 'var(--text)',
  },
  deleteIcon: {
    background: 'none',
    color: '#ef4444',
    padding: '4px',
    borderRadius: '6px',
    '&:hover': { backgroundColor: '#fee2e2' }
  },
  discountRow: {
    marginBottom: '16px',
  },
  discountValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  detailsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border)',
    paddingTop: '10px',
    marginTop: 'auto',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    borderRadius: '24px',
    padding: '32px',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-lg)',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  closeBtn: { background: 'none', color: 'var(--text-muted)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inputRow: { display: 'flex', gap: '16px' },
  label: { fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginLeft: '4px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '12px', color: 'var(--text-muted)' },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  submitBtn: {
    marginTop: '10px',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  loadingFull: { gridColumn: '1/-1', padding: '80px', textAlign: 'center', color: 'var(--text-muted)' },
  emptyFull: { gridColumn: '1/-1', padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }
};

export default Vouchers;
