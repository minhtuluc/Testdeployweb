import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  Lock, 
  LogOut, 
  Crown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import client from '../api/client';

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    avatar: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
      fetchAddresses();
      fetchOrders();
      fetchFavorites();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data } = await client.get('/addresses');
      setAddresses(data);
    } catch (err) {
      console.error('Lỗi tải địa chỉ:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await client.get('/orders');
      setOrders(data);
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await client.get('/favorites');
      setFavorites(data);
    } catch (err) {
      console.error('Lỗi tải yêu thích:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await client.put('/user/profile', {
        name: profileData.name,
        phone: profileData.phone
      });
      
      const updatedUser = { ...user, name: profileData.name, phone: profileData.phone };
      localStorage.setItem('omnimart_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      success('Cập nhật hồ sơ thành công!');
    } catch (err) {
      showError('Cập nhật thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    try {
      setLoadingPassword(true);
      const { data } = await client.put('/user/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      success(data.message || 'Đổi mật khẩu thành công!');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      showError(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const { data } = await client.post('/user/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileData({ ...profileData, avatar: data.avatarUrl });
      
      const updatedUser = { ...user, avatar: data.avatarUrl };
      localStorage.setItem('omnimart_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      success('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      showError('Upload ảnh thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeVIP = async () => {
    try {
      setLoading(true);
      const { data } = await client.post('/user/upgrade-vip', { plan: 'Gói 1 tháng' });
      
      // Cập nhật context và localStorage
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('omnimart_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      success('Chúc mừng! Bạn đã trở thành thành viên VIP.');
    } catch (err) {
      showError('Nâng cấp thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'security':
        return (
          <div className="animate-fade-in" style={styles.tabPane}>
            <h2 style={styles.tabTitle}>Bảo mật & Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mật khẩu hiện tại <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="password" 
                  style={styles.input}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  placeholder="Nhập mật khẩu hiện tại"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mật khẩu mới <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="password" 
                  style={styles.input}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Xác nhận mật khẩu mới <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="password" 
                  style={styles.input}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div style={{marginTop: '30px'}}>
                 <button type="submit" style={styles.submitBtn} disabled={loadingPassword}>
                    {loadingPassword ? <Loader2 className="spinner" size={18} /> : <Lock size={18} />}
                    {loadingPassword ? 'Đang lưu...' : 'Lưu mật khẩu'}
                 </button>
              </div>
            </form>
          </div>
        );
      case 'profile':
        return (
          <div className="animate-fade-in" style={styles.tabPane}>
            <h2 style={styles.tabTitle}>Hồ sơ cá nhân</h2>
            <form onSubmit={handleUpdateProfile} style={styles.form}>
              <div style={styles.avatarSection}>
                <div style={styles.avatarWrapper}>
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Avatar" style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>{profileData.name?.charAt(0)}</div>
                  )}
                  <label style={styles.uploadBtn}>
                    <Camera size={16} />
                    <input type="file" hidden onChange={handleAvatarUpload} accept="image/*" />
                  </label>
                </div>
                <div style={styles.avatarInfo}>
                  <p style={styles.avatarHint}>Chạm vào biểu tượng máy ảnh để thay đổi ảnh đại diện</p>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Họ và tên</label>
                <input 
                  style={styles.input} 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email (Không thể thay đổi)</label>
                <input 
                  style={{...styles.input, backgroundColor: '#f1f5f9'}} 
                  type="email" 
                  value={profileData.email}
                  disabled
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Số điện thoại</label>
                <input 
                  style={styles.input} 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
              </div>

              <button style={styles.submitBtn} disabled={loading}>
                {loading ? <Loader2 className="spinner" size={20} /> : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        );

      case 'vip':
        const isVIP = user?.membership_type === 'vip';
        const expireDate = user?.vip_expire_at ? new Date(user.vip_expire_at).toLocaleDateString('vi-VN') : null;

        return (
          <div className="animate-fade-in" style={styles.tabPane}>
            <h2 style={styles.tabTitle}>Gói thành viên VIP</h2>
            <div style={{
              ...styles.vipHero, 
              background: isVIP ? 'linear-gradient(135deg, #F0FFF4 0%, #E2FBE9 100%)' : '#f8fafc',
              borderColor: isVIP ? '#00B04B' : 'var(--border)'
            }}>
              <div style={styles.vipInfo}>
                <Crown size={40} color={isVIP ? "#00B04B" : "#94a3b8"} />
                <div>
                  <h3 style={styles.vipTier}>{isVIP ? 'Thành viên VIP' : 'Gói Standard'}</h3>
                  <p style={styles.vipStatus}>
                    {isVIP 
                      ? `Hạn sử dụng đến: ${expireDate}` 
                      : 'Bạn đang sử dụng tài khoản miễn phí'}
                  </p>
                </div>
              </div>
              {!isVIP && (
                <button 
                  style={styles.vipActionBtn} 
                  onClick={handleUpgradeVIP}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spinner" size={16} /> : 'Nâng cấp ngay'}
                </button>
              )}
            </div>

            <h4 style={styles.subTitle}>Đặc quyền VIP</h4>
            <div style={styles.benefitsGrid}>
              <div style={styles.benefitCard}>
                <CheckCircle2 size={24} color="#10b981" />
                <p>Giảm giá 10% cho mọi đơn hàng</p>
              </div>
              <div style={styles.benefitCard}>
                <CheckCircle2 size={24} color="#10b981" />
                <p>Miễn phí vận chuyển toàn quốc</p>
              </div>
              <div style={styles.benefitCard}>
                <CheckCircle2 size={24} color="#10b981" />
                <p>Xử lý đơn hàng ưu tiên</p>
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="animate-fade-in" style={styles.tabPane}>
            <div style={styles.tabHeader}>
              <h2 style={styles.tabTitle}>Sổ địa chỉ</h2>
              <button style={styles.addBtn}><Plus size={18} /> Thêm mới</button>
            </div>
            <div style={styles.addressList}>
              {addresses.length === 0 ? (
                <p style={styles.emptyMsg}>Bạn chưa có địa chỉ nào</p>
              ) : (
                addresses.map(addr => (
                  <div key={addr.id} style={styles.addressCard}>
                    <div style={styles.addressInfo}>
                      <div style={styles.addressNameRow}>
                        <span style={styles.addrName}>{addr.full_name}</span>
                        {addr.is_default && <span style={styles.defaultBadge}>Mặc định</span>}
                      </div>
                      <p style={styles.addrText}>{addr.address}</p>
                      <p style={styles.addrPhone}>{addr.phone}</p>
                    </div>
                    <div style={styles.addressActions}>
                      <button style={styles.iconBtn}><Edit2 size={16} /></button>
                      <button style={{...styles.iconBtn, color: 'var(--danger)'}}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="animate-fade-in" style={styles.tabPane}>
            <h2 style={styles.tabTitle}>Lịch sử đơn hàng</h2>
            <div style={styles.orderList}>
              {orders.length === 0 ? (
                <p style={styles.emptyMsg}>Bạn chưa có đơn hàng nào</p>
              ) : (
                orders.map(order => (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <span style={styles.orderId}>Đơn hàng #{order.id.toString().slice(-6)}</span>
                      <span style={{...styles.orderStatus, ...getStatusStyle(order.status)}}>
                        {translateStatus(order.status)}
                      </span>
                    </div>
                    <div style={styles.orderBody}>
                      <p>Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                      <p style={styles.orderTotal}>Tổng tiền: {order.total_price?.toLocaleString()}₫</p>
                    </div>
                    <button style={styles.orderLink}>Chi tiết đơn hàng <ChevronRight size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'wishlist':
        return (
          <div className="animate-fade-in" style={styles.tabPane}>
            <h2 style={styles.tabTitle}>Danh sách yêu thích</h2>
            <div style={styles.wishlistGrid}>
              {favorites.length === 0 ? (
                <p style={styles.emptyMsg}>Chưa có sản phẩm yêu thích</p>
              ) : (
                favorites.map(fav => (
                  <Link to={`/product/${fav.id}`} key={fav.id} style={{textDecoration: 'none'}}>
                    <div style={styles.wishCard}>
                       <img src={fav.image} alt={fav.name} style={styles.wishImg} />
                       <div style={styles.wishContent}>
                          <h4 style={{...styles.wishName, color: 'var(--text-main)'}}>{fav.name}</h4>
                          <p style={styles.wishPrice}>{fav.price?.toLocaleString()}₫</p>
                       </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.userCard}>
             <div style={styles.sidebarAvatar}>
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" style={styles.avatarImg} />
                ) : (
                  profileData.name?.charAt(0)
                )}
             </div>
             <h3 style={styles.userName}>{profileData.name}</h3>
             <p style={styles.userEmail}>{profileData.email}</p>
          </div>
          
          <nav style={styles.nav}>
            <button 
              style={{...styles.navBtn, ...(activeTab === 'profile' ? styles.navBtnActive : {})}}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> Hồ sơ cá nhân
            </button>
            <button 
              style={{...styles.navBtn, ...(activeTab === 'vip' ? styles.navBtnActive : {})}}
              onClick={() => setActiveTab('vip')}
            >
              <Crown size={18} /> Thành viên VIP
            </button>
            <button 
              style={{...styles.navBtn, ...(activeTab === 'address' ? styles.navBtnActive : {})}}
              onClick={() => setActiveTab('address')}
            >
              <MapPin size={18} /> Sổ địa chỉ
            </button>
            <button 
              style={{...styles.navBtn, ...(activeTab === 'orders' ? styles.navBtnActive : {})}}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} /> Đơn hàng của tôi
            </button>
            <button 
              style={{...styles.navBtn, ...(activeTab === 'wishlist' ? styles.navBtnActive : {})}}
              onClick={() => setActiveTab('wishlist')}
            >
              <Heart size={18} /> Danh sách yêu thích
            </button>
            <button 
              style={{...styles.navBtn, ...(activeTab === 'security' ? styles.navBtnActive : {})}}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} /> Bảo mật
            </button>
            
            <hr style={styles.hr} />
            
            <button style={{...styles.navBtn, color: 'var(--danger)'}} onClick={logout}>
              <LogOut size={18} /> Đăng xuất
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div style={styles.mainContent}>
          <div className="glass" style={styles.contentWrapper}>
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'pending': return { backgroundColor: '#fef3c7', color: '#92400e' };
    case 'shipped': return { backgroundColor: '#e0f2fe', color: '#0369a1' };
    case 'completed': return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'cancelled': return { backgroundColor: '#fee2e2', color: '#991b1b' };
    default: return {};
  }
};

const translateStatus = (status) => {
  const map = {
    pending: 'Chờ xử lý',
    shipped: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };
  return map[status] || status;
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  layout: {
    display: 'flex',
    gap: '30px',
    alignItems: 'flex-start',
  },
  sidebar: {
    width: '300px',
    flexShrink: 0,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '30px 20px',
    textAlign: 'center',
    marginBottom: '20px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  },
  sidebarAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    margin: '0 auto 15px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  userName: { fontSize: '18px', fontWeight: '700', marginBottom: '4px' },
  userEmail: { fontSize: '14px', color: 'var(--text-muted)' },
  nav: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '10px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'transparent',
    color: 'var(--text-main)',
    fontWeight: '500',
    fontSize: '15px',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  navBtnActive: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
  },
  hr: {
    margin: '10px 15px',
    border: 'none',
    borderTop: '1px solid var(--border)',
  },
  mainContent: {
    flex: 1,
  },
  contentWrapper: {
    borderRadius: '24px',
    padding: '40px',
    minHeight: '600px',
    boxShadow: 'var(--shadow)',
  },
  tabTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '30px',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '500px',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '10px',
  },
  avatarWrapper: {
    position: 'relative',
    width: '100px',
    height: '100px',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    fontWeight: 'bold',
  },
  uploadBtn: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow)',
    cursor: 'pointer',
    border: '1px solid var(--border)',
  },
  avatarInfo: {
    flex: 1,
  },
  avatarHint: { fontSize: '13px', color: 'var(--text-muted)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' },
  input: {
    padding: '12px 16px',
    borderRadius: '15px',
    border: '1px solid var(--border)',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '14px',
    borderRadius: '15px',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-primary)',
  },
  vipHero: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    border: '1px solid var(--border)',
  },
  vipInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
  vipTier: { fontSize: '20px', fontWeight: '700', marginBottom: '4px' },
  vipStatus: { fontSize: '14px', color: 'var(--text-muted)' },
  vipActionBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '25px',
    fontWeight: '600',
    fontSize: '14px',
  },
  subTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '20px' },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  benefitCard: {
    padding: '20px',
    borderRadius: '20px',
    backgroundColor: '#fff',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  },
  addBtn: {
    backgroundColor: '#f1f5f9',
    padding: '8px 16px',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  addressList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  addressCard: {
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressNameRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  addrName: { fontWeight: '700', fontSize: '16px' },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
  },
  addrText: { fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' },
  addrPhone: { fontSize: '14px', color: 'var(--text-muted)' },
  addressActions: { display: 'flex', gap: '10px' },
  iconBtn: {
    padding: '8px',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    color: 'var(--text-muted)',
    transition: 'all 0.2s',
  },
  emptyMsg: { color: 'var(--text-muted)', textAlign: 'center', padding: '40px' },
  orderList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  orderCard: {
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    backgroundColor: '#fff',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  orderId: { fontWeight: '700', fontSize: '15px' },
  orderStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  orderBody: { marginBottom: '15px', fontSize: '14px', color: 'var(--text-muted)' },
  orderTotal: { marginTop: '4px', fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' },
  orderLink: {
    width: '100%',
    padding: '10px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  wishlistGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '20px',
  },
  wishCard: {
    backgroundColor: '#fff',
    borderRadius: '15px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  wishImg: { width: '100%', height: '180px', objectFit: 'cover' },
  wishContent: { padding: '12px' },
  wishName: { fontSize: '14px', fontWeight: '600', marginBottom: '4px' },
  wishPrice: { fontSize: '15px', fontWeight: '700', color: 'var(--primary)' }
};

export default Profile;
