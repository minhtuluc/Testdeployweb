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
import './Profile.css';

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
      localStorage.setItem('bookhaven_user', JSON.stringify(updatedUser));
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
      localStorage.setItem('bookhaven_user', JSON.stringify(updatedUser));
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
      localStorage.setItem('bookhaven_user', JSON.stringify(updatedUser));
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
          <div className="animate-fade-in">
            <h2 className="prof-tab-title">Bảo mật & Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="prof-form">
              <div className="prof-input-group">
                <label className="prof-label">Mật khẩu hiện tại <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="password" 
                  className="prof-input"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  placeholder="Nhập mật khẩu hiện tại"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="prof-input-group">
                <label className="prof-label">Mật khẩu mới <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="password" 
                  className="prof-input"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div className="prof-input-group">
                <label className="prof-label">Xác nhận mật khẩu mới <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="password" 
                  className="prof-input"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div style={{marginTop: '30px'}}>
                 <button type="submit" className="prof-submit-btn" disabled={loadingPassword}>
                    {loadingPassword ? <Loader2 className="spinner" size={18} /> : <Lock size={18} />}
                    {loadingPassword ? 'Đang lưu...' : 'Lưu mật khẩu'}
                 </button>
              </div>
            </form>
          </div>
        );
      case 'profile':
        return (
          <div className="animate-fade-in">
            <h2 className="prof-tab-title">Hồ sơ cá nhân</h2>
            <form onSubmit={handleUpdateProfile} className="prof-form">
              <div className="prof-avatar-section">
                <div className="prof-avatar-wrapper">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Avatar" className="prof-avatar-img" />
                  ) : (
                    <div className="prof-avatar-placeholder">{profileData.name?.charAt(0)}</div>
                  )}
                  <label className="prof-upload-btn">
                    <Camera size={16} />
                    <input type="file" hidden onChange={handleAvatarUpload} accept="image/*" />
                  </label>
                </div>
                <div className="prof-avatar-info">
                  <p className="prof-avatar-hint">Chạm vào biểu tượng máy ảnh để thay đổi ảnh đại diện</p>
                </div>
              </div>

              <div className="prof-input-group">
                <label className="prof-label">Họ và tên</label>
                <input 
                  className="prof-input" 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  required
                />
              </div>

              <div className="prof-input-group">
                <label className="prof-label">Email (Không thể thay đổi)</label>
                <input 
                  className="prof-input"
                  style={{backgroundColor: '#f1f5f9'}} 
                  type="email" 
                  value={profileData.email}
                  disabled
                />
              </div>

              <div className="prof-input-group">
                <label className="prof-label">Số điện thoại</label>
                <input 
                  className="prof-input" 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
              </div>

              <button className="prof-submit-btn" disabled={loading}>
                {loading ? <Loader2 className="spinner" size={20} /> : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        );

      case 'vip':
        const isVIP = user?.membership_type === 'vip';
        const expireDate = user?.vip_expire_at ? new Date(user.vip_expire_at).toLocaleDateString('vi-VN') : null;

        return (
          <div className="animate-fade-in">
            <h2 className="prof-tab-title">Gói thành viên VIP</h2>
            <div className="prof-vip-hero" style={{
              background: isVIP ? 'linear-gradient(135deg, #F0FFF4 0%, #E2FBE9 100%)' : '#f8fafc',
              borderColor: isVIP ? '#00B04B' : 'var(--border)'
            }}>
              <div className="prof-vip-info">
                <Crown size={40} color={isVIP ? "#00B04B" : "#94a3b8"} />
                <div>
                  <h3 className="prof-vip-tier">{isVIP ? 'Thành viên VIP' : 'Gói Standard'}</h3>
                  <p className="prof-vip-status">
                    {isVIP 
                      ? `Hạn sử dụng đến: ${expireDate}` 
                      : 'Bạn đang sử dụng tài khoản miễn phí'}
                  </p>
                </div>
              </div>
              {!isVIP && (
                <button 
                  className="prof-vip-action-btn" 
                  onClick={handleUpgradeVIP}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spinner" size={16} /> : 'Nâng cấp ngay'}
                </button>
              )}
            </div>

            <h4 className="prof-sub-title">Đặc quyền VIP</h4>
            <div className="prof-benefits-grid">
              <div className="prof-benefit-card">
                <CheckCircle2 size={24} color="#10b981" />
                <p>Giảm giá 10% cho mọi đơn hàng</p>
              </div>
              <div className="prof-benefit-card">
                <CheckCircle2 size={24} color="#10b981" />
                <p>Miễn phí vận chuyển toàn quốc</p>
              </div>
              <div className="prof-benefit-card">
                <CheckCircle2 size={24} color="#10b981" />
                <p>Xử lý đơn hàng ưu tiên</p>
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="animate-fade-in">
            <div className="prof-tab-header">
              <h2 className="prof-tab-title" style={{marginBottom: 0}}>Sổ địa chỉ</h2>
              <button className="prof-add-btn"><Plus size={18} /> Thêm mới</button>
            </div>
            <div className="prof-address-list">
              {addresses.length === 0 ? (
                <p className="prof-empty-msg">Bạn chưa có địa chỉ nào</p>
              ) : (
                addresses.map(addr => (
                  <div key={addr.id} className="prof-address-card">
                    <div className="prof-address-info">
                      <div className="prof-address-name-row">
                        <span className="prof-addr-name">{addr.full_name}</span>
                        {addr.is_default && <span className="prof-default-badge">Mặc định</span>}
                      </div>
                      <p className="prof-addr-text">{addr.address}</p>
                      <p className="prof-addr-phone">{addr.phone}</p>
                    </div>
                    <div className="prof-address-actions">
                      <button className="prof-icon-btn"><Edit2 size={16} /></button>
                      <button className="prof-icon-btn" style={{color: 'var(--danger)'}}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="animate-fade-in">
            <h2 className="prof-tab-title">Lịch sử đơn hàng</h2>
            <div className="prof-order-list">
              {orders.length === 0 ? (
                <p className="prof-empty-msg">Bạn chưa có đơn hàng nào</p>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="prof-order-card">
                    <div className="prof-order-header">
                      <span className="prof-order-id">Đơn hàng #{order.id.toString().slice(-6)}</span>
                      <span className="prof-order-status" style={getStatusStyle(order.status)}>
                        {translateStatus(order.status)}
                      </span>
                    </div>
                    <div className="prof-order-body">
                      <p>Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                      <p className="prof-order-total">Tổng tiền: {order.total_price?.toLocaleString()}₫</p>
                    </div>
                    <button className="prof-order-link">Chi tiết đơn hàng <ChevronRight size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'wishlist':
        return (
          <div className="animate-fade-in">
            <h2 className="prof-tab-title">Danh sách yêu thích</h2>
            <div className="prof-wishlist-grid">
              {favorites.length === 0 ? (
                <p className="prof-empty-msg">Chưa có sản phẩm yêu thích</p>
              ) : (
                favorites.map(fav => (
                  <Link to={`/product/${fav.id}`} key={fav.id} style={{textDecoration: 'none'}}>
                    <div className="prof-wish-card">
                       <img src={fav.image} alt={fav.name} className="prof-wish-img" />
                       <div className="prof-wish-content">
                          <h4 className="prof-wish-name" style={{color: 'var(--text-main)'}}>{fav.name}</h4>
                          <p className="prof-wish-price">{fav.price?.toLocaleString()}₫</p>
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
    <div className="prof-container">
      <div className="prof-layout">
        {/* Sidebar */}
        <aside className="prof-sidebar">
          <div className="prof-user-card">
             <div className="prof-sidebar-avatar">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" className="prof-avatar-img" />
                ) : (
                  profileData.name?.charAt(0)
                )}
             </div>
             <h3 className="prof-user-name">{profileData.name}</h3>
             <p className="prof-user-email">{profileData.email}</p>
          </div>
          
          <nav className="prof-nav">
            <button 
              className={`prof-nav-btn ${activeTab === 'profile' ? 'prof-nav-btn-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> Hồ sơ cá nhân
            </button>
            <button 
              className={`prof-nav-btn ${activeTab === 'vip' ? 'prof-nav-btn-active' : ''}`}
              onClick={() => setActiveTab('vip')}
            >
              <Crown size={18} /> Thành viên VIP
            </button>
            <button 
              className={`prof-nav-btn ${activeTab === 'address' ? 'prof-nav-btn-active' : ''}`}
              onClick={() => setActiveTab('address')}
            >
              <MapPin size={18} /> Sổ địa chỉ
            </button>
            <button 
              className={`prof-nav-btn ${activeTab === 'orders' ? 'prof-nav-btn-active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} /> Đơn hàng của tôi
            </button>
            <button 
              className={`prof-nav-btn ${activeTab === 'wishlist' ? 'prof-nav-btn-active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
            >
              <Heart size={18} /> Danh sách yêu thích
            </button>
            <button 
              className={`prof-nav-btn ${activeTab === 'security' ? 'prof-nav-btn-active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} /> Bảo mật
            </button>
            
            <hr className="prof-hr" />
            
            <button className="prof-nav-btn" style={{color: 'var(--danger)'}} onClick={logout}>
              <LogOut size={18} /> Đăng xuất
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="prof-main-content">
          <div className="glass prof-content-wrapper">
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

export default Profile;
