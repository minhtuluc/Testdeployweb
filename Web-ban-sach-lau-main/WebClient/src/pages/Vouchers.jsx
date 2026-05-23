import React, { useState, useEffect } from 'react';
import { Ticket, Copy, Check, Calendar, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');
  const { success, error: showError } = useToast();

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/vouchers/list');
      setVouchers(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách mã giảm giá:', err);
      showError('Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Đã sao chép mã: ${code}`);
    setTimeout(() => {
      setCopiedCode('');
    }, 2000);
  };

  return (
    <div style={styles.pageWrapper} className="animate-fade-in">
      {/* Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <div style={styles.bannerContent}>
          <div style={styles.badgeContainer}>
            <Sparkles size={16} color="#fff" />
            <span style={styles.badgeText}>Độc quyền BookHaven</span>
          </div>
          <h1 style={styles.bannerTitle}>BookHaven Vouchers</h1>
          <p style={styles.bannerSubtitle}>
            Săn mã giảm giá độc quyền, tiết kiệm tối đa cho mọi đơn hàng của bạn!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div style={styles.container}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Ticket size={24} color="var(--primary)" />
            <h2 style={styles.sectionTitle}>Mã giảm giá đang hoạt động</h2>
          </div>
          <span style={styles.voucherCount}>{vouchers.length} mã khả dụng</span>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Đang tìm kiếm ưu đãi tốt nhất...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div style={styles.emptyContainer}>
            <Ticket size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>Chưa có mã giảm giá nào</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              Hãy quay lại sau để săn những voucher giảm giá siêu hấp dẫn từ hệ thống nhé!
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {vouchers.map((voucher) => {
              const minOrderText = voucher.min_order 
                ? `Đơn tối thiểu ${voucher.min_order.toLocaleString()}₫` 
                : 'Mọi đơn hàng';
              const maxDiscountText = voucher.max_discount 
                ? `Giảm tối đa ${voucher.max_discount.toLocaleString()}₫` 
                : 'Không giới hạn';
              const isCopied = copiedCode === voucher.code;

              return (
                <div key={voucher.id} style={styles.couponCard} className="coupon-hover-effect">
                  {/* Left Side (Discount Badge) */}
                  <div style={styles.cardLeft}>
                    <div style={styles.cutoutTop}></div>
                    <div style={styles.cutoutBottom}></div>
                    <span style={styles.discountValue}>{voucher.discount_percent}%</span>
                    <span style={styles.discountLabel}>GIẢM</span>
                  </div>

                  {/* Vertical dotted border */}
                  <div style={styles.divider}></div>

                  {/* Right Side (Content) */}
                  <div style={styles.cardRight}>
                    <div style={styles.codeRow}>
                      <span style={styles.codeTag}>{voucher.code}</span>
                      <button 
                        style={{
                          ...styles.copyBtn,
                          border: isCopied ? '1px solid var(--success, #10b981)' : '1px solid var(--primary, #00B04B)',
                          backgroundColor: isCopied ? 'var(--success, #10b981)' : 'transparent',
                          color: isCopied ? '#fff' : 'var(--primary, #00B04B)'
                        }}
                        onClick={() => handleCopy(voucher.code)}
                      >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        <span style={{ fontWeight: '700', fontSize: '13px' }}>
                          {isCopied ? 'Đã lưu' : 'Sao chép'}
                        </span>
                      </button>
                    </div>

                    <h3 style={styles.cardTitle}>Mã giảm {voucher.discount_percent}% toàn sàn</h3>
                    
                    <div style={styles.infoMeta}>
                      <span style={styles.metaText}>{minOrderText}</span>
                      <span style={styles.metaSeparator}>•</span>
                      <span style={styles.metaText}>{maxDiscountText}</span>
                    </div>

                    <div style={styles.expiryRow}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span style={styles.expiryText}>
                        Hết hạn: {new Date(voucher.expired_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        <section style={styles.instructionsCard}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={styles.infoIconBox}>
              <ShieldAlert size={24} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Hướng dẫn sử dụng mã giảm giá</h3>
              <ul style={styles.instructionsList}>
                <li>1. Chọn mã phù hợp với giá trị đơn hàng của bạn ở trên và nhấn <strong>"Sao chép"</strong>.</li>
                <li>2. Thêm các sản phẩm yêu thích của bạn vào giỏ hàng và tiến hành thanh toán.</li>
                <li>3. Tại trang <strong>Thanh toán</strong>, dán mã vừa sao chép vào ô <strong>"Nhập mã giảm giá"</strong> và ấn áp dụng để nhận chiết khấu tức thì!</li>
                <li>4. Thành viên VIP sẽ được tự động giảm thêm 10% nữa trước khi áp dụng voucher!</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    paddingBottom: '60px',
  },
  banner: {
    position: 'relative',
    height: '240px',
    backgroundImage: 'linear-gradient(135deg, var(--primary-dark, #00873d) 0%, var(--primary, #00B04B) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    textAlign: 'center',
    overflow: 'hidden',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  bannerContent: {
    position: 'relative',
    zIndex: 1,
    padding: '0 20px',
  },
  badgeContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '6px 14px',
    borderRadius: '30px',
    backdropFilter: 'blur(4px)',
    marginBottom: '16px',
  },
  badgeText: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  bannerTitle: {
    fontSize: '40px',
    fontWeight: '900',
    fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
    letterSpacing: '-1px',
    marginBottom: '8px',
  },
  bannerSubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  container: {
    maxWidth: '1200px',
    margin: '40px auto 0 auto',
    padding: '0 20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: 'Outfit, sans-serif',
  },
  voucherCount: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    backgroundColor: '#fff',
    padding: '6px 12px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '24px',
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    overflow: 'visible', // Cho phép các lỗ khoét hình tròn nổi ra ngoài không bị cắt cụt
    position: 'relative',
    height: '165px', // Tăng chiều cao lên 165px để hiển thị thoải mái
    transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
  },
  cardLeft: {
    width: '100px',
    backgroundColor: 'var(--primary, #00B04B)', // Đồng bộ chuẩn tông màu xanh signature của shop!
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    position: 'relative',
    flexShrink: 0,
    borderTopLeftRadius: '15px',
    borderBottomLeftRadius: '15px',
  },
  cutoutTop: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border)',
    zIndex: 1,
  },
  cutoutBottom: {
    position: 'absolute',
    bottom: '-8px',
    right: '-8px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border)',
    zIndex: 1,
  },
  discountValue: {
    fontSize: '28px',
    fontWeight: '900',
    lineHeight: '1',
    fontFamily: 'Outfit, sans-serif',
    color: '#fff', // Chuyển sang màu trắng tinh tế
  },
  discountLabel: {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '1.5px',
    marginTop: '4px',
    opacity: 0.9,
    color: '#fff', // Chuyển sang màu trắng tương phản cao
  },
  divider: {
    width: '1px',
    borderLeft: '2px dashed var(--border)',
    height: '100%',
    margin: '0 -1px',
    position: 'relative',
    zIndex: 2,
  },
  cardRight: {
    flex: 1,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderTopRightRadius: '15px',
    borderBottomRightRadius: '15px',
  },
  codeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeTag: {
    backgroundColor: '#f1f5f9',
    color: 'var(--text)',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
    border: '1px solid var(--border)',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--text)',
    marginTop: '8px',
    fontFamily: 'Outfit, sans-serif',
  },
  infoMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  metaText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  metaSeparator: {
    color: 'var(--border)',
    fontSize: '12px',
  },
  expiryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '8px',
  },
  expiryText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '28px',
    marginTop: '48px',
  },
  infoIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    backgroundColor: 'rgba(0, 176, 75, 0.1)', // Đồng bộ sang tông xanh signature nhạt của shop
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  instructionsList: {
    listStyleType: 'none',
    padding: 0,
    margin: '12px 0 0 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    color: 'var(--text-muted)',
    fontSize: '14px',
    lineHeight: '1.6',
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
    border: '3px solid rgba(59, 130, 246, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s infinite linear',
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '20px',
    border: '1px solid var(--border)',
  }
};

export default Vouchers;
