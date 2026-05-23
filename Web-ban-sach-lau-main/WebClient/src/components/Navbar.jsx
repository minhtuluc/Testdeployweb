import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart() || { cartCount: 0 };
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.logoSection}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              display: 'inline-block',
              letterSpacing: '-0.5px',
              fontFamily: "'Outfit', sans-serif"
            }}>
              BookHaven
            </span>
          </Link>
        </div>

        <div style={styles.linksSection}>
          <Link to="/" style={styles.navLink}>Home</Link>
          <Link to="/vouchers" style={styles.navLink}>Mã Giảm Giá</Link>
          <Link to="/categories" style={styles.navLink}>Categories</Link>
          <Link to="/orders" style={styles.navLink}>Track Order</Link>
        </div>

        <div style={styles.actionsSection}>
          <div style={styles.searchBox}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm sách, tác giả, NXB..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <Link to="/cart" style={{ ...styles.iconBtn, position: 'relative' }}>
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span style={styles.cartBadge}>{cartCount}</span>
            )}
          </Link>

          {user ? (
            <div style={styles.userMenu}>
              <Link to="/profile" style={styles.iconBtn}>
                <User size={24} />
              </Link>
              <button onClick={logout} style={styles.logoutBtn}>Logout</button>
            </div>
          ) : (
            <Link to="/login" style={styles.loginBtn}>Login / Signup</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow-sm)',
    padding: '15px 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    height: '40px',
    width: 'auto',
  },
  linksSection: {
    display: 'flex',
    gap: '30px',
  },
  navLink: {
    fontWeight: '500',
    color: 'var(--text-main)',
    transition: 'color 0.2s',
  },
  actionsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    padding: '10px 15px 10px 40px',
    borderRadius: '25px',
    border: '1px solid var(--border)',
    outline: 'none',
    width: '250px',
    fontSize: '14px',
    backgroundColor: 'var(--bg)',
  },
  iconBtn: {
    color: 'var(--text-main)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  loginBtn: {
    backgroundColor: 'var(--bg-dark)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '25px',
    fontWeight: '600',
    fontSize: '14px',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: 'var(--danger)',
    fontWeight: '600',
    fontSize: '14px',
  },
  cartBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default Navbar;
