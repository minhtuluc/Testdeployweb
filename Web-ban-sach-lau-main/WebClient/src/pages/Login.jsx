import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
      const user = await login(email, password);
      if (user.role === 'admin' || user.role === 'seller') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
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
          <h1 style={styles.heroTitle}>Chào mừng trở lại!</h1>
          <p style={styles.heroSubtitle}>Khám phá thế giới tri thức rộng mở tại BookHaven.</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div style={styles.formSection}>
        <div style={styles.loginCard} className="animate-fade-in">
          <div style={styles.header}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif", display: 'block', marginBottom: '20px' }}>
                BookHaven
              </span>
            </Link>
            <h2 style={styles.title}>Đăng nhập</h2>
            <p style={styles.subtitle}>Vui lòng nhập thông tin tài khoản của bạn</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
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
                <button type="button" style={styles.forgotPass}>Quên mật khẩu?</button>
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
              {loading ? <Loader2 className="spinner" size={20} /> : (
                <>
                  Đăng nhập <ArrowRight size={18} style={{marginLeft: '8px'}} />
                </>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <span>Chưa có tài khoản? </span>
            <Link to="/signup" style={styles.signupLink}>Đăng ký ngay</Link>
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
    display: 'none', // Hidden on mobile
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
    bottom: '80px',
    left: '60px',
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
  },
  formSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  loginCard: {
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
    marginBottom: '40px',
  },
  logo: {
    width: '180px',
    marginBottom: '30px',
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
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fff1f2',
    color: '#e11d48',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '25px',
    border: '1px solid #fda4af',
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
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  forgotPass: {
    background: 'none',
    border: 'none',
    color: '#00B04B',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
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
    padding: '14px 16px 14px 48px',
    borderRadius: '15px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
    '&:focus': {
      borderColor: '#00B04B',
      boxShadow: '0 0 0 4px rgba(0, 176, 75, 0.1)',
    }
  },
  eyeBtn: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
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
    marginTop: '30px',
    textAlign: 'center',
    fontSize: '15px',
    color: '#64748b',
  },
  signupLink: {
    color: '#00B04B',
    fontWeight: '700',
    textDecoration: 'none',
  }
};

export default Login;
