import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  CreditCard, 
  Tag, 
  Truck, 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Check, 
  Crown,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import client from '../api/client';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  const navigate = useNavigate();

  // State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  
  // New Address Form State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const isVIP = user?.membership_type === 'vip';

  useEffect(() => {
    if (!user) {
      info('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      info('Giỏ hàng của bạn đang trống');
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data } = await client.get('/addresses');
      setAddresses(data);
      if (data && data.length > 0) {
        // Ưu tiên chọn địa chỉ mặc định
        const defaultAddr = data.find(addr => addr.is_default);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : data[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách địa chỉ:', err);
    }
  };

  // Tính toán VIP Discount
  const vipDiscount = cartItems.reduce((total, item) => {
    if (!isVIP) return 0;
    const itemVipPrice = item.vip_price || Math.round(item.price * 0.9);
    const savingPerItem = item.price - itemVipPrice;
    return total + (savingPerItem * item.quantity);
  }, 0);

  const subtotalAfterVip = cartTotal - vipDiscount;
  const shippingFee = subtotalAfterVip >= 500000 ? 0 : 30000; // Miễn phí vận chuyển cho đơn hàng từ 500k

  // Áp dụng Voucher
  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    try {
      setIsApplyingVoucher(true);
      const { data } = await client.post('/vouchers/apply', {
        code: voucherCode.trim(),
        subtotal: subtotalAfterVip
      });

      setAppliedVoucher(data.voucher);
      setVoucherDiscount(data.discount_amount);
      success('Áp dụng mã giảm giá thành công!');
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể áp dụng mã giảm giá');
      setAppliedVoucher(null);
      setVoucherDiscount(0);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherCode('');
    info('Đã hủy áp dụng mã giảm giá');
  };

  // Thêm địa chỉ mới
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.full_name || !newAddress.phone || !newAddress.address) {
      showError('Vui lòng nhập đầy đủ thông tin địa chỉ');
      return;
    }

    try {
      setIsSavingAddress(true);
      const { data } = await client.post('/addresses', {
        ...newAddress,
        is_default: addresses.length === 0 // Nếu là địa chỉ đầu tiên thì đặt làm mặc định
      });
      success('Thêm địa chỉ giao hàng thành công!');
      setNewAddress({ full_name: '', phone: '', address: '' });
      setShowAddAddress(false);
      
      // Refresh list
      const updatedList = [data, ...addresses];
      setAddresses(updatedList);
      setSelectedAddressId(data.id);
    } catch (err) {
      showError('Không thể thêm địa chỉ mới. Vui lòng thử lại.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Thực hiện đặt hàng
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showError('Vui lòng chọn hoặc thêm địa chỉ nhận hàng');
      return;
    }

    try {
      setIsSubmitting(true);
      await client.post('/checkout', {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        voucher_code: appliedVoucher?.code || null,
        discount_amount: voucherDiscount,
        shipping_fee: shippingFee,
        items: cartItems
      });

      success('Đặt hàng thành công! Cảm ơn bạn đã ủng hộ BookHaven.');
      clearCart();
      navigate('/orders');
    } catch (err) {
      showError('Đã có lỗi xảy ra trong quá trình đặt hàng: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalTotal = Math.max(0, subtotalAfterVip + shippingFee - voucherDiscount);

  return (
    <div style={styles.container}>
      {/* Back button */}
      <Link to="/cart" style={styles.backLink}>
        <ArrowLeft size={16} /> Quay lại giỏ hàng
      </Link>

      <h1 style={styles.pageTitle}>Xác nhận thanh toán</h1>

      <div style={styles.layout}>
        {/* Left Column: Form & Options */}
        <div style={styles.leftColumn}>
          
          {/* Section 1: Address selection */}
          <div className="glass" style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleRow}>
                <MapPin size={22} color="var(--primary)" />
                <h2 style={styles.sectionTitle}>Địa chỉ giao hàng</h2>
              </div>
              <button 
                style={styles.addAddressBtn} 
                onClick={() => setShowAddAddress(!showAddAddress)}
              >
                <Plus size={16} /> {showAddAddress ? 'Hủy bỏ' : 'Thêm địa chỉ mới'}
              </button>
            </div>

            {showAddAddress ? (
              <form onSubmit={handleSaveAddress} style={styles.addressForm}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Họ và tên người nhận</label>
                    <input 
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      style={styles.input}
                      value={newAddress.full_name}
                      onChange={(e) => setNewAddress({...newAddress, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Số điện thoại</label>
                    <input 
                      type="tel" 
                      placeholder="09xxxxxxxx" 
                      style={styles.input}
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Địa chỉ cụ thể (Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP)</label>
                  <input 
                    type="text" 
                    placeholder="123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh" 
                    style={styles.input}
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" style={styles.saveAddressBtn} disabled={isSavingAddress}>
                  {isSavingAddress ? <Loader2 className="spinner" size={16} /> : 'Lưu địa chỉ'}
                </button>
              </form>
            ) : (
              <div style={styles.addressList}>
                {addresses.length === 0 ? (
                  <p style={styles.emptyText}>Bạn chưa có địa chỉ giao hàng nào. Vui lòng thêm địa chỉ mới để tiếp tục.</p>
                ) : (
                  addresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      style={{
                        ...styles.addressCard,
                        borderColor: selectedAddressId === addr.id ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: selectedAddressId === addr.id ? '#F2FDF5' : '#fff'
                      }}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div style={styles.addressSelectIndicator}>
                        {selectedAddressId === addr.id ? (
                          <div style={styles.radioSelected}><Check size={12} color="#fff" /></div>
                        ) : (
                          <div style={styles.radioUnselected}></div>
                        )}
                      </div>
                      <div style={styles.addressDetails}>
                        <div style={styles.addressNameRow}>
                          <span style={styles.addressName}>{addr.full_name}</span>
                          <span style={styles.addressPhone}>{addr.phone}</span>
                          {addr.is_default && <span style={styles.defaultBadge}>Mặc định</span>}
                        </div>
                        <p style={styles.addressText}>{addr.address}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="glass" style={styles.sectionCard}>
            <div style={styles.sectionTitleRow}>
              <CreditCard size={22} color="var(--primary)" />
              <h2 style={styles.sectionTitle}>Phương thức thanh toán</h2>
            </div>
            
            <div style={styles.paymentMethods}>
              <div 
                style={{
                  ...styles.paymentCard,
                  borderColor: paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: paymentMethod === 'cod' ? '#F2FDF5' : '#fff'
                }}
                onClick={() => setPaymentMethod('cod')}
              >
                <div style={styles.paymentIcon}>
                  <Truck size={24} color={paymentMethod === 'cod' ? 'var(--primary)' : '#64748b'} />
                </div>
                <div style={styles.paymentText}>
                  <span style={styles.paymentName}>COD (Thanh toán khi nhận hàng)</span>
                  <span style={styles.paymentDesc}>Thanh toán bằng tiền mặt khi shipper giao hàng đến nơi.</span>
                </div>
                {paymentMethod === 'cod' && <div style={styles.paymentCheck}><Check size={16} color="#fff" /></div>}
              </div>

              <div 
                style={{
                  ...styles.paymentCard,
                  borderColor: paymentMethod === 'bank' ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: paymentMethod === 'bank' ? '#F2FDF5' : '#fff'
                }}
                onClick={() => setPaymentMethod('bank')}
              >
                <div style={styles.paymentIcon}>
                  <DollarSign size={24} color={paymentMethod === 'bank' ? 'var(--primary)' : '#64748b'} />
                </div>
                <div style={styles.paymentText}>
                  <span style={styles.paymentName}>Chuyển khoản Ngân hàng</span>
                  <span style={styles.paymentDesc}>Quét mã QR hoặc chuyển khoản nhanh bằng ứng dụng ngân hàng.</span>
                </div>
                {paymentMethod === 'bank' && <div style={styles.paymentCheck}><Check size={16} color="#fff" /></div>}
              </div>
            </div>

            {paymentMethod === 'bank' && (
              <div style={styles.bankDetails}>
                <h4 style={styles.bankTitle}>Thông tin tài khoản ngân hàng thụ hưởng</h4>
                <div style={styles.bankGrid}>
                  <div style={styles.bankItem}><strong>Ngân hàng:</strong> Techcombank (TCB)</div>
                  <div style={styles.bankItem}><strong>Số tài khoản:</strong> 1903567890102</div>
                  <div style={styles.bankItem}><strong>Chủ tài khoản:</strong> CÔNG TY TNHH SACH BOOKHAVEN VIET NAM</div>
                  <div style={styles.bankItem}><strong>Nội dung CK:</strong> <span style={styles.bankNote}>BH{user?.id.slice(-6).toUpperCase()}</span></div>
                </div>
                <p style={styles.bankWarning}>* Hệ thống sẽ tự động đối soát giao dịch và chuyển đơn hàng sang trạng thái "Đang giao" ngay khi nhận được tiền.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cart items & Breakdown */}
        <div style={styles.rightColumn}>
          <div className="glass" style={styles.summaryCard}>
            <h2 style={styles.summaryTitle}>Đơn hàng của bạn</h2>
            
            {/* Cart Items List */}
            <div style={styles.itemsList}>
              {cartItems.map((item) => {
                const finalItemPrice = isVIP && item.vip_price ? item.vip_price : item.price;
                return (
                  <div key={item.id} style={styles.summaryItem}>
                    <div style={styles.itemImageWrapper}>
                      <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} style={styles.itemImg} />
                    </div>
                    <div style={styles.itemInfo}>
                      <h4 style={styles.itemName}>{item.name}</h4>
                      <p style={styles.itemQtyPrice}>Số lượng: {item.quantity} x {finalItemPrice.toLocaleString()}₫</p>
                    </div>
                    <div style={styles.itemSubtotal}>
                      {(finalItemPrice * item.quantity).toLocaleString()}₫
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Voucher input form */}
            <form onSubmit={handleApplyVoucher} style={styles.voucherForm}>
              <div style={styles.voucherInputWrapper}>
                <Tag size={18} style={styles.voucherIcon} />
                <input 
                  type="text" 
                  placeholder="Nhập mã voucher giảm giá" 
                  style={styles.voucherInput}
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  disabled={!!appliedVoucher || isApplyingVoucher}
                />
              </div>
              {appliedVoucher ? (
                <button type="button" onClick={handleRemoveVoucher} style={styles.voucherRemoveBtn}>
                  Hủy
                </button>
              ) : (
                <button type="submit" style={styles.voucherApplyBtn} disabled={isApplyingVoucher || !voucherCode}>
                  {isApplyingVoucher ? <Loader2 className="spinner" size={16} /> : 'Áp dụng'}
                </button>
              )}
            </form>

            {appliedVoucher && (
              <div style={styles.appliedVoucherBadge}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Đã áp dụng mã <strong>{appliedVoucher.code}</strong> (Giảm {appliedVoucher.discount_percent}%)</span>
              </div>
            )}

            <div style={styles.divider}></div>

            {/* Calculations breakdowns */}
            <div style={styles.breakdown}>
              <div style={styles.breakdownRow}>
                <span>Tổng giá gốc ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)</span>
                <span>{cartTotal.toLocaleString()}₫</span>
              </div>
              
              {isVIP && (
                <div style={{...styles.breakdownRow, color: '#00B04B'}}>
                  <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <Crown size={16} color="#00B04B" fill="#00B04B" /> Đặc quyền VIP (Giảm giá sản phẩm)
                  </span>
                  <span>-{vipDiscount.toLocaleString()}₫</span>
                </div>
              )}

              {appliedVoucher && (
                <div style={{...styles.breakdownRow, color: '#10b981'}}>
                  <span>Mã giảm giá ({appliedVoucher.code})</span>
                  <span>-{voucherDiscount.toLocaleString()}₫</span>
                </div>
              )}

              <div style={styles.breakdownRow}>
                <span>Phí vận chuyển</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()}₫`}</span>
              </div>

              {shippingFee > 0 && (
                <p style={styles.shippingNotice}>* Đơn hàng từ 500,000đ trở lên (sau giảm VIP) được miễn phí vận chuyển.</p>
              )}
            </div>

            <div style={styles.divider}></div>

            {/* Final Total */}
            <div style={styles.totalRow}>
              <span>Tổng thanh toán</span>
              <span style={styles.totalPrice}>{finalTotal.toLocaleString()}₫</span>
            </div>

            <button 
              style={{
                ...styles.placeOrderBtn,
                opacity: isSubmitting ? 0.7 : 1
              }}
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner" size={20} style={{marginRight: '8px'}} /> Đang tạo đơn hàng...
                </>
              ) : 'Xác nhận Đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
    fontFamily: '"Outfit", sans-serif',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '20px',
    transition: 'color 0.2s',
    '&:hover': {
      color: 'var(--primary)'
    }
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '30px',
  },
  layout: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: '1 1 60%',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  rightColumn: {
    flex: '1 1 35%',
    position: 'sticky',
    top: '100px',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '30px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  addAddressBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    color: 'var(--text-main)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  addressForm: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '15px',
  },
  formRow: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  formGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '200px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s',
  },
  saveAddressBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '120px',
  },
  addressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  addressCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    padding: '20px',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  addressSelectIndicator: {
    marginTop: '3px',
  },
  radioSelected: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUnselected: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid var(--border)',
    backgroundColor: '#fff',
  },
  addressDetails: {
    flex: 1,
  },
  addressNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '6px',
  },
  addressName: {
    fontWeight: '700',
    fontSize: '16px',
    color: '#1e293b',
  },
  addressPhone: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
  },
  addressText: {
    fontSize: '14px',
    color: 'var(--text-main)',
    margin: 0,
    lineHeight: '1.5',
  },
  paymentMethods: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  paymentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
  },
  paymentIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  paymentName: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#1e293b',
  },
  paymentDesc: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  paymentCheck: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'var(--primary)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankDetails: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px dashed var(--primary)',
  },
  bankTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
    textTransform: 'uppercase',
  },
  bankGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
  },
  bankItem: {
    color: 'var(--text-main)',
  },
  bankNote: {
    backgroundColor: '#E2FBE9',
    color: 'var(--primary)',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  bankWarning: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '15px',
    marginStyle: 'italic',
    margin: 0,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '30px',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--border)',
  },
  summaryTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '25px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: '280px',
    overflowY: 'auto',
    marginBottom: '25px',
    paddingRight: '5px',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  itemImageWrapper: {
    width: '60px',
    height: '60px',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    flexShrink: 0,
  },
  itemImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textTransform: 'uppercase',
  },
  itemQtyPrice: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  itemSubtotal: {
    fontWeight: '700',
    fontSize: '14px',
    color: '#1e293b',
  },
  voucherForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  voucherInputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  voucherIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
  },
  voucherInput: {
    width: '100%',
    padding: '12px 12px 12px 38px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    fontSize: '14px',
    outline: 'none',
  },
  voucherApplyBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '0 20px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherRemoveBtn: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    padding: '0 20px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  appliedVoucherBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 15px',
    borderRadius: '12px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '20px 0',
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  shippingNotice: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginStyle: 'italic',
    margin: '4px 0 0 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '16px',
    marginBottom: '25px',
    color: '#1e293b',
  },
  totalPrice: {
    color: 'var(--primary)',
    fontSize: '24px',
    fontWeight: '800',
  },
  placeOrderBtn: {
    width: '100%',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '16px',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-primary)',
    transition: 'all 0.2s',
  },
  emptyText: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    margin: 0,
    fontSize: '14px',
  }
};

export default Checkout;
