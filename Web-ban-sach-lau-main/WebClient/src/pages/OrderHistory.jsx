import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, ShoppingBag } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return; // Chờ cho đến khi Auth xác định xong trạng thái người dùng

    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data } = await client.get('/orders');
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { text: 'Đang xử lý', color: '#f59e0b', icon: <Clock size={16} /> };
      case 'shipped': return { text: 'Đang giao', color: '#3b82f6', icon: <Package size={16} /> };
      case 'completed': return { text: 'Hoàn thành', color: '#10b981', icon: <CheckCircle2 size={16} /> };
      case 'cancelled': return { text: 'Đã hủy', color: '#ef4444', icon: <XCircle size={16} /> };
      default: return { text: status, color: '#6b7280', icon: <Package size={16} /> };
    }
  };

  if (loading) {
    return <div style={styles.centerContainer}>Đang tải lịch sử đơn hàng...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Lịch sử đơn hàng</h1>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <ShoppingBag size={64} color="#d1d5db" />
          <p style={styles.emptyText}>Bạn chưa có đơn hàng nào.</p>
          <button onClick={() => navigate('/')} style={styles.shopBtn}>Mua sắm ngay</button>
        </div>
      ) : (
        <div style={styles.orderList}>
          {orders.map((order) => {
            const status = getStatusInfo(order.status);
            return (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div style={styles.orderIdGroup}>
                    <Package size={20} color="var(--primary)" />
                    <span style={styles.orderId}>Đơn hàng #{order.id}</span>
                  </div>
                  <div style={{ ...styles.statusBadge, backgroundColor: status.color + '15', color: status.color }}>
                    {status.icon}
                    <span>{status.text}</span>
                  </div>
                </div>

                <div style={styles.orderBody}>
                  <div style={styles.orderInfo}>
                    <p style={styles.orderDate}>Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                    <p style={styles.orderAddress}>Địa chỉ: {order.addresses?.address || 'N/A'}</p>
                  </div>
                  <div style={styles.orderTotalGroup}>
                    <span style={styles.totalLabel}>Tổng cộng:</span>
                    <span style={styles.totalValue}>{order.total_price?.toLocaleString()}₫</span>
                  </div>
                </div>

                <div style={styles.orderFooter}>
                  <button
                    style={styles.detailsBtn}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    Xem chi tiết <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '30px',
    color: 'var(--text-main)',
  },
  centerContainer: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: 'var(--text-muted)',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  emptyText: {
    marginTop: '20px',
    fontSize: '18px',
    color: 'var(--text-muted)',
    marginBottom: '30px',
  },
  shopBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '12px 30px',
    borderRadius: '25px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    transition: 'transform 0.2s',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid var(--border)',
  },
  orderIdGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  orderId: {
    fontWeight: '700',
    fontSize: '18px',
    color: 'var(--text-main)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  orderBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '20px',
  },
  orderInfo: {
    flex: 1,
  },
  orderDate: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    marginBottom: '5px',
  },
  orderAddress: {
    color: 'var(--text-main)',
    fontSize: '15px',
    maxWidth: '500px',
  },
  orderTotalGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  totalValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  detailsBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  }
};

export default OrderHistory;
