import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

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
    <nav className="navbar-wrapper">
      <div className="navbar-container">
        <div className="navbar-logo-section">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <span className="navbar-logo-text">
              BookHaven
            </span>
          </Link>
        </div>

        <div className="navbar-links-section">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/vouchers" className="navbar-link">Mã Giảm Giá</Link>
          <Link to="/categories" className="navbar-link">Categories</Link>
          <Link to="/orders" className="navbar-link">Track Order</Link>
        </div>

        <div className="navbar-actions-section">
          <div className="navbar-search-box">
            <Search size={18} className="navbar-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm sách..."
              className="navbar-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <Link to="/cart" className="navbar-icon-btn">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="navbar-cart-badge">{cartCount}</span>
            )}
          </Link>

          {user ? (
            <div className="navbar-user-menu">
              <Link to="/profile" className="navbar-icon-btn">
                <User size={24} />
              </Link>
              <button onClick={logout} className="navbar-logout-btn">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="navbar-login-btn">Login / Signup</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
