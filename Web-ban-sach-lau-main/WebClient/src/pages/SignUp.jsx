import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);
      await client.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      showError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Left Side: Visual Hero */}
      <div style={styles.heroSection}>
        <div style={styles.heroOverlay}></div>
        <img src="/auth_bg.png" alt="Auth Background" style={styles.heroImage} />
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Trở thành thành viên BookHaven</h1>
          <p style={styles.heroSubtitle}>Nhận ngay ưu đãi độc quyền và trải nghiệm đọc sách không giới hạn.</p>
          
          <div style={styles.benefits}>
            <div style={styles.benefitItem}>
              <CheckCircle2 size={20} color="#00B04B" />
              <span>Theo dõi đơn hàng dễ dàng</span>
            </div>
            <div style={styles.benefitItem}>
              <CheckCircle2 size={20} color="#00B04B" />
              <span>Tích điểm đổi quà VIP</span>
            </div>
            <div style={styles.benefitItem}>
              <CheckCircle2 size={20} color="#00B04B" />
              <span>Hỗ trợ khách hàng 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Sign Up Form */}
      <div style={styles.formSection}>
        <div style={styles.authCard} className="animate-fade-in">
          <div style={styles.header}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif", display: 'block', marginBottom: '20px' }}>
                BookHaven
              </span>
            </Link>
            <h2 style={styles.title}>Đăng ký</h2>
            <p style={styles.subtitle}>Bắt đầu hành trình tri thức của bạn ngay hôm nay</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Họ và tên</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  style={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mật khẩu</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  style={styles.input}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Xác nhận mật khẩu</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              style={styles.submitBtn} 
              disabled={loading}
            >
              {loading ? <Loader2 className="spinner" size={20} /> : (
                <>
                  Tạo tài khoản <ArrowRight size={18} style={{marginLeft: '8px'}} />
                </>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <span>Đã có tài khoản? </span>
            <Link to="/login" style={styles.loginLink}>Đăng nhập</Link>
          </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    backgroundColor: '#f8fafc',
    fontFamily: '"Outfit", sans-serif',
  },
  heroSection: {
    flex: 1,
    position: 'relative',
    display: 'none',
    '@media (min-width: 1024px)': {
      display: 'block',
    },
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.8',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(0, 176, 75, 0.4) 0%, rgba(0,0,0,0.4) 100%)',
    zIndex: 1,
  },
  heroContent: {
    position: 'absolute',
    top: '50%',
    left: '60px',
    transform: 'translateY(-50%)',
    zIndex: 2,
    color: '#fff',
    maxWidth: '500px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    marginBottom: '20px',
    lineHeight: '1.1',
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: '0.9',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  benefits: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  authCard: {
    width: '100%',
    maxWidth: '450px',
    padding: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '35px',
  },
  logo: {
    width: '180px',
    marginBottom: '25px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 48px',
    borderRadius: '15px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  submitBtn: {
    backgroundColor: '#00B04B',
    color: '#fff',
    padding: '16px',
    borderRadius: '15px',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, background-color 0.2s',
    boxShadow: '0 10px 20px rgba(0, 176, 75, 0.2)',
    marginTop: '10px',
  },
  footer: {
    marginTop: '25px',
    textAlign: 'center',
    fontSize: '15px',
    color: '#64748b',
  },
  loginLink: {
    color: '#00B04B',
    fontWeight: '700',
    textDecoration: 'none',
  }
};

export default SignUp;
