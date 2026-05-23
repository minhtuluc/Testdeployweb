import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Package, 
  Clock, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import client from '../api/client';

const ShipperPortal = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'my-deliveries'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of order currently being updated
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const endpoint = activeTab === 'pending' ? '/shipper/orders/pending' : '/shipper/orders/my-deliveries';
      const { data } = await client.get(endpoint);
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching shipper orders:', err);
      setErrorMsg('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const showToast = (type, message) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleClaimOrder = async (orderId) => {
    try {
      setActionLoading(orderId);
      await client.put(`/shipper/orders/${orderId}/claim`);
      showToast('success', 'Bạn đã nhận giao đơn hàng thành công! Hãy chuẩn bị đi giao.');
      fetchOrders();
    } catch (err) {
      console.error('Error claiming order:', err);
      showToast('error', err.response?.data?.message || 'Nhận đơn giao thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setActionLoading(orderId);
      await client.put(`/shipper/orders/${orderId}/complete`);
      showToast('success', 'Tuyệt vời! Đã cập nhật giao hàng thành công.');
      fetchOrders();
    } catch (err) {
      console.error('Error completing order:', err);
      showToast('error', 'Cập nhật hoàn thành giao hàng thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Toast Alert Messages */}
      {successMsg && (
        <div style={styles.toastSuccess}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={styles.toastError}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Cổng thông tin Shipper</h1>
          <p style={styles.subtitle}>Quản lý, nhận đơn và cập nhật hành trình giao nhận hàng</p>
        </div>
        <div style={styles.statsBadge}>
          <Truck size={20} color="#2196F3" />
          <span style={styles.statsText}>{orders.length} đơn khả dụng</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'pending' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('pending')}
        >
          <Package size={18} />
          <span>Đơn hàng chờ nhận</span>
          {activeTab === 'pending' && <span style={styles.countBadge}>{orders.length}</span>}
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'my-deliveries' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('my-deliveries')}
        >
          <Truck size={18} />
          <span>Đang đi giao</span>
          {activeTab === 'my-deliveries' && <span style={styles.countBadge}>{orders.length}</span>}
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Đang tải dữ liệu đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIconContainer}>
            <Truck size={48} color="rgba(33, 150, 243, 0.3)" />
          </div>
          <h3 style={styles.emptyTitle}>
            {activeTab === 'pending' ? 'Không có đơn hàng nào chờ giao' : 'Bạn chưa nhận giao đơn hàng nào'}
          </h3>
          <p style={styles.emptyText}>
            {activeTab === 'pending' 
              ? 'Tất cả đơn hàng hiện đã được các shipper khác đảm nhận.' 
              : 'Hãy chuyển qua tab "Đơn hàng chờ nhận" để chọn những đơn hàng có địa chỉ tối ưu nhất.'}
          </p>
        </div>
      ) : (
        <div style={styles.ordersGrid}>
          {orders.map((order) => {
            const address = order.addresses || {};
            const customer = order.users || {};
            
            return (
              <div key={order.id} className="shipper-card" style={styles.orderCard}>
                {/* Card Top */}
                <div style={styles.cardHeader}>
                  <div style={styles.orderIdGroup}>
                    <span style={styles.orderLabel}>ĐƠN HÀNG</span>
                    <span style={styles.orderId}>#{order.id}</span>
                  </div>
                  <div style={styles.timeGroup}>
                    <Clock size={14} style={{ marginRight: '4px' }} />
                    <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div style={styles.divider}></div>

                {/* Customer Details */}
                <div style={styles.cardSection}>
                  <div style={styles.infoRow}>
                    <User size={16} style={styles.iconStyle} />
                    <div>
                      <div style={styles.label}>Người nhận</div>
                      <div style={styles.value}>{address.full_name || customer.name || 'Khách hàng'}</div>
                    </div>
                  </div>

                  <div style={styles.infoRow}>
                    <Phone size={16} style={styles.iconStyle} />
                    <div>
                      <div style={styles.label}>Số điện thoại</div>
                      <a href={`tel:${address.phone || customer.phone}`} style={styles.phoneLink}>
                        {address.phone || customer.phone || 'N/A'}
                      </a>
                    </div>
                  </div>

                  <div style={styles.infoRow}>
                    <MapPin size={16} style={styles.iconStyle} />
                    <div>
                      <div style={styles.label}>Địa chỉ giao hàng</div>
                      <div style={styles.value}>
                        {address.address || 'Chưa có địa chỉ chi tiết'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.divider}></div>

                {/* Payment details */}
                <div style={styles.cardSectionInline}>
                  <div style={styles.infoRowInline}>
                    <DollarSign size={16} style={styles.iconStyle} />
                    <div>
                      <div style={styles.label}>Tổng tiền thu</div>
                      <div style={styles.priceValue}>{order.total_price?.toLocaleString()}₫</div>
                    </div>
                  </div>

                  <div style={styles.infoRowInline}>
                    <CreditCard size={16} style={styles.iconStyle} />
                    <div>
                      <div style={styles.label}>Hình thức</div>
                      <div style={styles.paymentMethod}>
                        {order.payment_method?.toUpperCase()} 
                        <span style={{ 
                          ...styles.paymentStatusBadge,
                          color: order.payment_status === 'completed' ? '#10b981' : '#f59e0b',
                          backgroundColor: order.payment_status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'
                        }}>
                          {order.payment_status === 'completed' ? 'Đã thanh toán' : 'Thu hộ COD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div style={styles.cardActionContainer}>
                  {activeTab === 'pending' ? (
                    <button 
                      style={styles.claimButton}
                      disabled={actionLoading === order.id}
                      onClick={() => handleClaimOrder(order.id)}
                    >
                      {actionLoading === order.id ? (
                        <div style={styles.miniSpinner}></div>
                      ) : (
                        <>
                          <span>Nhận giao đơn này</span>
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      style={styles.completeButton}
                      disabled={actionLoading === order.id}
                      onClick={() => handleCompleteOrder(order.id)}
                    >
                      {actionLoading === order.id ? (
                        <div style={styles.miniSpinner}></div>
                      ) : (
                        <>
                          <CheckCircle size={16} style={{ marginRight: '6px' }} />
                          <span>Đã giao thành công</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inject custom micro-animations */}
      <style>{`
        .shipper-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .shipper-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg) !important;
          border-color: rgba(33, 150, 243, 0.3) !important;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from { transform: translateX(120%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '35px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--text)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  statsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 18px',
    borderRadius: '20px',
    background: 'rgba(33, 150, 243, 0.08)',
    border: '1px solid rgba(33, 150, 243, 0.15)',
  },
  statsText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2196F3',
  },
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '15px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  activeTab: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    color: '#2196F3',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: '#2196F3',
    color: '#fff',
    marginLeft: '6px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border)',
    borderTop: '3px solid #2196F3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '60px 40px',
    backgroundColor: '#fff',
    borderRadius: '24px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  emptyIconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text)',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  ordersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '24px',
  },
  orderCard: {
    padding: '25px',
    backgroundColor: '#fff',
    borderRadius: '24px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'default',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  orderIdGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  orderLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
  },
  orderId: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#2196F3',
  },
  timeGroup: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '15px 0',
  },
  cardSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  cardSectionInline: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoRowInline: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    flex: 1,
  },
  iconStyle: {
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  label: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    fontSize: '14px',
    color: 'var(--text)',
    fontWeight: '600',
    marginTop: '2px',
    lineHeight: '1.4',
  },
  phoneLink: {
    fontSize: '14px',
    color: '#2196F3',
    fontWeight: '700',
    textDecoration: 'none',
    marginTop: '2px',
    display: 'inline-block',
  },
  priceValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#10b981',
    marginTop: '2px',
  },
  paymentMethod: {
    fontSize: '13px',
    color: 'var(--text)',
    fontWeight: '700',
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  paymentStatusBadge: {
    fontSize: '9px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'none',
  },
  cardActionContainer: {
    marginTop: 'auto',
  },
  claimButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#2196F3',
    color: '#fff',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.2)',
  },
  completeButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#fff',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
  },
  toastSuccess: {
    position: 'fixed',
    top: '30px',
    right: '30px',
    padding: '15px 25px',
    borderRadius: '16px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 9999,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
  },
  toastError: {
    position: 'fixed',
    top: '30px',
    right: '30px',
    padding: '15px 25px',
    borderRadius: '16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 9999,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
  },
  miniSpinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  }
};

export default ShipperPortal;
