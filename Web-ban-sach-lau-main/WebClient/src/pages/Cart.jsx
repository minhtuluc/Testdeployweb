import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import client from '../api/client';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      toast.info('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      toast.info('Giỏ hàng trống!');
      return;
    }

    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <ShoppingBag size={64} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
        <h2 style={styles.emptyTitle}>Giỏ hàng của bạn trống</h2>
        <p style={styles.emptySubtitle}>Hãy khám phá thêm các tựa sách hay trên BookHaven nhé.</p>
        <Link to="/" style={styles.continueBtn}>Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Giỏ hàng của bạn</h1>
      
      <div style={styles.layout}>
        <div style={styles.cartList}>
          {cartItems.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              <div style={styles.itemImageWrapper}>
                <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} style={styles.itemImage} />
              </div>
              
              <div style={styles.itemDetails}>
                <h3 style={styles.itemName}>{item.name}</h3>
                <p style={styles.itemPrice}>{item.price?.toLocaleString()}₫</p>
                
                <div style={styles.itemActions}>
                  <div style={styles.quantityControl}>
                    <button 
                      style={styles.qtyBtn} 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={styles.qtyText}>{item.quantity}</span>
                    <button 
                      style={styles.qtyBtn} 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <button 
                    style={styles.removeBtn}
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={styles.summary}>
          <h2 style={styles.summaryTitle}>Tổng đơn hàng</h2>
          
          <div style={styles.summaryRow}>
            <span>Tạm tính</span>
            <span>{cartTotal.toLocaleString()}₫</span>
          </div>
          
          <div style={styles.summaryRow}>
            <span>Phí vận chuyển</span>
            <span>Miễn phí</span>
          </div>
          
          <div style={styles.divider}></div>
          
          <div style={styles.summaryTotalRow}>
            <span>Tổng cộng</span>
            <span style={styles.summaryTotal}>{cartTotal.toLocaleString()}₫</span>
          </div>
          
          <button 
            style={styles.checkoutBtn} 
            onClick={handleCheckout}
          >
            <span>Thanh toán ngay</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '30px',
  },
  layout: {
    display: 'flex',
    gap: '40px',
    flexWrap: 'wrap',
  },
  cartList: {
    flex: '1 1 60%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cartItem: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  },
  itemImageWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  itemName: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-main)',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--primary)',
    marginBottom: 'auto',
  },
  itemActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#f1f5f9',
    borderRadius: '25px',
    padding: '5px 10px',
  },
  qtyBtn: {
    backgroundColor: '#fff',
    border: 'none',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-main)',
    boxShadow: 'var(--shadow-sm)',
  },
  qtyText: {
    fontWeight: '600',
    fontSize: '16px',
    minWidth: '20px',
    textAlign: 'center',
  },
  removeBtn: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  summary: {
    flex: '1 1 30%',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border)',
    height: 'fit-content',
    position: 'sticky',
    top: '100px',
  },
  summaryTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    color: 'var(--text-muted)',
    fontSize: '15px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '20px 0',
  },
  summaryTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    fontWeight: '700',
    fontSize: '18px',
  },
  summaryTotal: {
    color: 'var(--primary)',
    fontSize: '24px',
  },
  checkoutBtn: {
    width: '100%',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '16px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    boxShadow: 'var(--shadow-primary)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '10px',
  },
  emptySubtitle: {
    color: 'var(--text-muted)',
    marginBottom: '30px',
  },
  continueBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '12px 30px',
    borderRadius: '25px',
    fontWeight: '600',
    textDecoration: 'none',
  }
};

export default Cart;
