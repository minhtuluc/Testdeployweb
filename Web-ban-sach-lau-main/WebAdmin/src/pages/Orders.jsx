import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  ClipboardList, 
  Search, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  User,
  CreditCard
} from 'lucide-react';
import client from '../api/client';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/admin/orders');
      setOrders(data || []);
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: 'Chờ xử lý', color: '#f59e0b', icon: <Clock size={14} /> };
      case 'paid': return { label: 'Đã thanh toán', color: '#10b981', icon: <CreditCard size={14} /> };
      case 'shipped': return { label: 'Đang giao', color: '#2196F3', icon: <Truck size={14} /> };
      case 'completed': return { label: 'Hoàn thành', color: '#10b981', icon: <CheckCircle size={14} /> };
      case 'cancelled': return { label: 'Đã hủy', color: '#ef4444', icon: <XCircle size={14} /> };
      default: return { label: status, color: '#94a3b8', icon: <ClipboardList size={14} /> };
    }
  };

  const filteredOrders = orders.filter(o => {
    const orderIdMatches = o.id ? o.id.toString().includes(search) : false;
    const userNameMatches = o.users?.name 
      ? o.users.name.toLowerCase().includes(search.toLowerCase()) 
      : false;
    return orderIdMatches || userNameMatches;
  });


  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdating(true);
      await client.put(`/admin/orders/${id}/status`, { status: newStatus });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      alert('Cập nhật trạng thái thành công!');
    } catch (err) {
      alert('Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Quản lý đơn hàng</h1>
          <p style={styles.subtitle}>Theo dõi và kiểm soát toàn bộ giao dịch trên hệ thống.</p>
        </div>
        
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Tìm theo Mã đơn hoặc Tên khách hàng..." 
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>Mã đơn</th>
              <th style={styles.th}>Khách hàng</th>
              <th style={styles.th}>Tổng tiền</th>
              <th style={styles.th}>Ngày đặt</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={styles.loadingTd}>Đang tải danh sách đơn hàng...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan="6" style={styles.emptyTd}>Không tìm thấy đơn hàng nào</td></tr>
            ) : filteredOrders.map((order) => {
              const status = getStatusInfo(order.status);
              return (
                <tr key={order.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.orderId}>#{order.id}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <User size={16} color="var(--text-muted)" />
                      <div>
                        <div style={styles.userName}>{order.users?.name || 'Khách vãng lai'}</div>
                        <div style={styles.userEmail}>{order.users?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.price}>{order.total_price?.toLocaleString()}₫</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.date}>{new Date(order.created_at).toLocaleString('vi-VN')}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: `${status.color}15`,
                      color: status.color,
                    }}>
                      {status.icon}
                      <span style={{marginLeft: '6px'}}>{status.label}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.actionBtn}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                    >
                      <Eye size={18} />
                      <span>Chi tiết</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && selectedOrder && ReactDOM.createPortal(
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={styles.modal} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h2 style={{fontSize: '22px'}}>Chi tiết đơn hàng #{selectedOrder.id}</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <div style={styles.orderMeta}>
              <div style={styles.metaItem}>
                <strong>Ngày đặt:</strong> {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
              </div>
              <div style={styles.metaItem}>
                <strong>Trạng thái:</strong> 
                <span style={{color: getStatusInfo(selectedOrder.status).color, fontWeight: '700', marginLeft: '8px'}}>
                  {getStatusInfo(selectedOrder.status).label.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={styles.itemsList}>
              {selectedOrder.order_items?.map((item) => (
                <div key={item.id} style={styles.orderItem}>
                  <img src={item.products?.image || 'https://via.placeholder.com/60'} alt="" style={styles.itemImg} />
                  <div style={{flex: 1}}>
                    <div style={styles.itemName}>{item.products?.name}</div>
                    <div style={styles.itemSub}>Số lượng: {item.quantity} | Đơn giá: {item.price?.toLocaleString()}₫</div>
                  </div>
                  <div style={styles.itemTotal}>{(item.price * item.quantity).toLocaleString()}₫</div>
                </div>
              ))}
            </div>

            <div style={styles.orderFooter}>
              <div style={styles.totalRow}>
                <span>Tổng cộng:</span>
                <span style={styles.totalValue}>{selectedOrder.total_price?.toLocaleString()}₫</span>
              </div>
              
              <div style={styles.statusActions}>
                <p style={styles.actionLabel}>Cập nhật trạng thái:</p>
                <div style={styles.btnGroup}>
                  {selectedOrder.status === 'pending' && (
                    <button style={styles.statusBtn} onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}>Xác nhận & Giao hàng</button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button style={styles.statusBtn} onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}>Giao hàng thành công</button>
                  )}
                  {['pending', 'shipped'].includes(selectedOrder.status) && (
                    <button style={{...styles.statusBtn, backgroundColor: '#ef4444'}} onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}>Hủy đơn</button>
                  )}
                </div>
              </div>
            </div>
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
  searchWrapper: {
    position: 'relative',
    width: '380px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    outline: 'none',
    fontSize: '14px',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  theadRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid var(--border)',
  },
  th: {
    padding: '16px 24px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px 24px',
    fontSize: '14px',
  },
  orderId: {
    fontWeight: '700',
    color: 'var(--text)',
    fontFamily: 'monospace',
    fontSize: '15px',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: { fontWeight: '600', color: 'var(--text)' },
  userEmail: { fontSize: '12px', color: 'var(--text-muted)' },
  price: {
    fontWeight: '700',
    color: 'var(--primary)',
  },
  date: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    color: 'var(--secondary)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  loadingTd: { padding: '40px', textAlign: 'center', color: 'var(--text-muted)' },
  emptyTd: { padding: '40px', textAlign: 'center', color: 'var(--text-muted)' },
  
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
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '600px',
    height: '85vh',
    borderRadius: '24px',
    padding: '32px',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '16px',
    flexShrink: 0,
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-muted)', cursor: 'pointer' },
  orderMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    flexShrink: 0,
  },
  metaItem: { fontSize: '14px', color: 'var(--text)' },
  itemsList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px', 
    marginBottom: '24px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    paddingRight: '4px',
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
  },
  itemImg: { width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' },
  itemName: { fontWeight: '600', fontSize: '14px', color: 'var(--text)' },
  itemSub: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  itemTotal: { fontWeight: '700', color: 'var(--text)' },
  orderFooter: { borderTop: '2px solid #f1f5f9', paddingTop: '20px', flexShrink: 0 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', marginBottom: '24px' },
  totalValue: { color: 'var(--primary)' },
  statusActions: { backgroundColor: '#fdf2f2', padding: '16px', borderRadius: '12px' },
  actionLabel: { fontSize: '13px', fontWeight: '700', color: '#991b1b', marginBottom: '12px', textTransform: 'uppercase' },
  btnGroup: { display: 'flex', gap: '12px' },
  statusBtn: {
    flex: 1,
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  }
};

export default Orders;
