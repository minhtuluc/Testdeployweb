import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard, 
  Star, 
  CheckCircle2, 
  Clock, 
  X,
  Loader2
} from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const { data } = await client.get(`/orders/${id}`);
      setOrderData(data);
    } catch (err) {
      console.error('Lỗi tải chi tiết đơn hàng:', err);
      showError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrderDetail();
  }, [id, authLoading, user]);

  const handleOpenReview = (product) => {
    setSelectedProduct(product);
    setRating(5);
    setComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setSubmitting(true);
      await client.post('/reviews', {
        product_id: selectedProduct.product_id,
        order_id: id,
        rating,
        comment
      });
      success('Cảm ơn bạn đã đánh giá sản phẩm!');
      setShowReviewModal(false);
      fetchOrderDetail(); // Refresh to update "Reviewed" status
    } catch (err) {
      showError(err.response?.data?.message || 'Lỗi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      return;
    }

    try {
      setCancelling(true);
      await client.put(`/orders/${id}/status`, { status: 'cancelled' });
      success('Hủy đơn hàng thành công!');
      fetchOrderDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <Loader2 className="spinner" size={40} color="var(--primary)" />
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (!orderData) return null;

  const { order, items } = orderData;

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { text: 'Chờ xử lý', color: '#f59e0b', icon: <Clock size={18} /> };
      case 'paid': return { text: 'Đã thanh toán', color: '#10b981', icon: <CreditCard size={18} /> };
      case 'shipped': return { text: 'Đang giao', color: '#3b82f6', icon: <Package size={18} /> };
      case 'completed': return { text: 'Đã hoàn thành', color: '#10b981', icon: <CheckCircle2 size={18} /> };
      case 'cancelled': return { text: 'Đã hủy', color: '#ef4444', icon: <X size={18} /> };
      default: return { text: status, color: '#ef4444', icon: <X size={18} /> };
    }
  };

  const status = getStatusInfo(order.status);

  return (
    <div style={styles.container} className="animate-fade-in">
      <button onClick={() => navigate('/orders')} style={styles.backBtn}>
        <ArrowLeft size={18} /> Quay lại danh sách
      </button>

      <div style={styles.header}>
        <h1 style={styles.title}>Chi tiết đơn hàng #{order.id}</h1>
        <div style={{...styles.statusBadge, backgroundColor: status.color + '15', color: status.color}}>
          {status.icon} <span>{status.text}</span>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left Col: Order Items */}
        <div style={styles.leftCol}>
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>Sản phẩm đã đặt</h3>
            <div style={styles.itemList}>
              {items.map(item => (
                <div key={item.id} style={styles.itemRow}>
                  <div style={styles.itemMain}>
                     <div style={styles.itemNameGroup}>
                        <Link to={`/product/${item.product_id}`} style={{textDecoration: 'none'}}>
                           <h4 style={styles.itemName}>{item.product_name}</h4>
                        </Link>
                        <p style={styles.itemVariant}>
                           {item.size && `Size: ${item.size}`} {item.color && ` | Màu: ${item.color}`}
                        </p>
                     </div>
                     <div style={styles.itemPriceGroup}>
                        <span style={styles.itemQty}>x{item.quantity}</span>
                        <span style={styles.itemPrice}>{item.price?.toLocaleString()}₫</span>
                     </div>
                  </div>
                  
                  {order.status === 'completed' && (
                    <div style={styles.reviewAction}>
                      {item.reviewed ? (
                        <span style={styles.reviewedLabel}>
                          <CheckCircle2 size={14} /> Đã đánh giá
                        </span>
                      ) : (
                        <button 
                          style={styles.reviewBtn} 
                          onClick={() => handleOpenReview(item)}
                        >
                          <Star size={14} /> Viết đánh giá
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div style={styles.divider}></div>
            
            <div style={styles.totalSection}>
               <div style={styles.totalRow}>
                  <span>Tạm tính:</span>
                  <span>{order.total_price?.toLocaleString()}₫</span>
               </div>
               <div style={styles.totalRow}>
                  <span>Phí vận chuyển:</span>
                  <span>Miễn phí</span>
               </div>
               <div style={{...styles.totalRow, fontWeight: '800', fontSize: '20px', marginTop: '10px'}}>
                  <span>Tổng cộng:</span>
                  <span style={{color: 'var(--primary)'}}>{order.total_price?.toLocaleString()}₫</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Col: Info */}
        <div style={styles.rightCol}>
          <div className="glass" style={styles.card}>
            <div style={styles.infoSection}>
               <div style={styles.infoTitle}>
                  <MapPin size={18} color="var(--primary)" /> 
                  <span>Thông tin nhận hàng</span>
               </div>
               <p style={styles.infoName}>Minh Tú (Demo)</p>
               <p style={styles.infoDetail}>Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</p>
               <p style={styles.infoDetail}>090 123 4567</p>
            </div>

            <div style={{...styles.divider, margin: '20px 0'}}></div>

            <div style={styles.infoSection}>
               <div style={styles.infoTitle}>
                  <CreditCard size={18} color="var(--primary)" /> 
                  <span>Phương thức thanh toán</span>
               </div>
               <p style={styles.infoDetail}>Thanh toán khi nhận hàng (COD)</p>
            </div>

            {['pending', 'paid'].includes(order.status) && (
              <>
                <div style={{...styles.divider, margin: '20px 0'}}></div>
                <button
                  className="cancel-btn"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div style={styles.modalOverlay}>
          <div className="animate-fade-in" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>Đánh giá sản phẩm</h3>
              <button style={styles.closeBtn} onClick={() => setShowReviewModal(false)}><X size={20} /></button>
            </div>
            
            <div style={styles.modalBody}>
              <p style={styles.reviewTarget}>{selectedProduct?.product_name}</p>
              
              <div style={styles.starRating}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    style={styles.starBtn}
                  >
                    <Star 
                      size={32} 
                      fill={s <= rating ? "#f59e0b" : "transparent"} 
                      color={s <= rating ? "#f59e0b" : "#d1d5db"} 
                    />
                  </button>
                ))}
              </div>

              <textarea 
                style={styles.reviewArea}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <button 
                style={styles.submitBtn} 
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="spinner" size={20} /> : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .cancel-btn {
          width: 100%;
          background-color: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
          padding: 12px;
          border-radius: 20px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          margin-top: 10px;
        }
        .cancel-btn:hover {
          background-color: #ef4444;
          color: #fff;
        }
        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  centerContainer: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '25px',
    fontWeight: '700',
    fontSize: '14px',
  },
  grid: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
  },
  leftCol: { flex: '1 1 60%', minWidth: '400px' },
  rightCol: { flex: '1 1 30%', minWidth: '300px' },
  card: {
    borderRadius: '24px',
    padding: '30px',
    boxShadow: 'var(--shadow)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '20px',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  itemRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
  },
  itemMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: { fontSize: '16px', fontWeight: '700', textTransform: 'uppercase' },
  itemVariant: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
  itemPriceGroup: { textAlign: 'right' },
  itemQty: { fontSize: '14px', color: 'var(--text-muted)', marginRight: '10px' },
  itemPrice: { fontWeight: '700', color: 'var(--primary)' },
  reviewAction: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid var(--border)',
    paddingTop: '12px',
  },
  reviewBtn: {
    backgroundColor: '#fff',
    border: '1px solid var(--primary)',
    color: 'var(--primary)',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  reviewedLabel: {
    color: 'var(--success)',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  divider: { height: '1px', backgroundColor: 'var(--border)', margin: '30px 0' },
  totalSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '15px' },
  infoSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
  infoTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' },
  infoName: { fontWeight: '600' },
  infoDetail: { color: 'var(--text-muted)', fontSize: '14px' },
  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: '500px',
    borderRadius: '24px',
    padding: '30px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  modalBody: { textAlign: 'center' },
  reviewTarget: { fontWeight: '700', fontSize: '18px', marginBottom: '20px' },
  starRating: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' },
  starBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  reviewArea: {
    width: '100%',
    height: '120px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    padding: '15px',
    fontSize: '15px',
    outline: 'none',
    resize: 'none',
    marginBottom: '20px',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '14px',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: '700',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
};

export default OrderDetail;
