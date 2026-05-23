import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') navigate('/admin');
      else if (loggedUser.role === 'seller') navigate('/admin/products');
      else if (loggedUser.role === 'cskh') navigate('/admin/orders');
      else if (loggedUser.role === 'shipper') navigate('/admin/shipper');
      else navigate('/login');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Background with subtle animation */}
      <div style={styles.background}>
        <div style={styles.circle1}></div>
        <div style={styles.circle2}></div>
        <img src="/auth_bg.png" alt="Admin Background" style={styles.bgImage} />
        <div style={styles.bgOverlay}></div>
      </div>

      <div style={styles.loginCard} className="animate-fade-in">
        <div style={styles.header}>
          <div style={styles.adminBadge}>
             <ShieldCheck size={20} color="#00B04B" />
             <span>Hệ thống Quản trị</span>
          </div>
          <h1 style={styles.brandTitle}>BookHaven</h1>
          <h2 style={styles.title}>Đăng nhập Quản trị</h2>
          <p style={styles.subtitle}>Hệ thống quản lý cửa hàng sách</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email quản trị</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input 
                type="email" 
                placeholder="admin@bookhaven.com" 
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Mật khẩu</label>
            </div>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? <Loader2 className="spinner" size={20} /> : 'Vào hệ thống quản trị'}
          </button>
        </form>

        <div style={styles.footer}>
          <p>© 2024 BookHaven Management System. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    fontFamily: '"Outfit", sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.4',
    filter: 'blur(5px)',
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.7) 0%, #0f172a 100%)',
  },
  circle1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'rgba(0, 176, 75, 0.15)',
    filter: 'blur(80px)',
    top: '-100px',
    right: '-100px',
  },
  circle2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(56, 189, 248, 0.1)',
    filter: 'blur(60px)',
    bottom: '-50px',
    left: '-50px',
  },
  loginCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '50px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(24px)',
    borderRadius: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  adminBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    borderRadius: '20px',
    backgroundColor: 'rgba(0, 176, 75, 0.1)',
    color: '#00B04B',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '25px',
    border: '1px solid rgba(0, 176, 75, 0.2)',
  },
  brandTitle: {
    fontSize: '36px',
    fontWeight: '900',
    color: 'var(--primary, #00B04B)',
    marginBottom: '15px',
    letterSpacing: '-1px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '15px',
  },
  errorBox: {
    padding: '12px 16px',
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    color: '#fb7185',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '25px',
    border: '1px solid rgba(225, 29, 72, 0.2)',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748b',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: '#00B04B',
    color: '#fff',
    padding: '16px',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 10px 20px rgba(0, 176, 75, 0.3)',
    marginTop: '10px',
  },
  footer: {
    marginTop: '40px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#475569',
  }
};

export default Login;
