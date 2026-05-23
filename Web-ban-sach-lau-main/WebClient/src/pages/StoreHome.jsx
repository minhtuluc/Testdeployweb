import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Star, Search, Filter, Crown, Heart } from 'lucide-react';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';
import './StoreHome.css';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
  'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80'
];

const StoreHome = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category') || 'All'; // Đọc danh mục từ URL
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl); // Khởi tạo active category từ URL
  const { addToCart } = useCart() || { addToCart: () => alert('Giỏ hàng chưa được khởi tạo!') };
  const [visibleCount, setVisibleCount] = useState(20); // Khai báo state số lượng hiển thị ban đầu là 20
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'All'); // Cập nhật active category khi URL thay đổi
  }, [searchParams]);

  // Reset phân trang Xem thêm khi thay đổi bộ lọc danh mục hoặc tìm kiếm
  useEffect(() => {
    setVisibleCount(20);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const { data } = await client.get('/home');

        // Store the raw categories so we can filter by ID
        setCategories(data.categories || []);

        setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    const fetchFavs = async () => {
      if (!user) {
        setFavoriteIds([]);
        return;
      }
      try {
        const { data } = await client.get('/favorites');
        setFavoriteIds(data.map(p => p.id));
      } catch (err) {
        console.error('Lỗi tải danh sách yêu thích:', err);
      }
    };
    fetchFavs();
  }, [user]);

  const handleToggleFavorite = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng tính năng yêu thích!");
      return;
    }
    try {
      const { data } = await client.post('/favorites/toggle', { product_id: productId });
      if (data.favorite) {
        setFavoriteIds(prev => [...prev, productId]);
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== productId));
      }
    } catch (err) {
      console.error('Lỗi toggle yêu thích:', err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCategory === 'All') return matchesSearch;

    const categoryObjs = categories.filter(c => c.name === activeCategory);
    if (categoryObjs.length === 0) return matchesSearch;

    let validIds = [];
    categoryObjs.forEach(cat => {
      validIds.push(cat.id);
      if (cat.children) {
        cat.children.forEach(child => validIds.push(child.id));
      }
    });

    return matchesSearch && validIds.includes(p.category_id);
  });

  const categoryNames = ['All', ...new Set(categories.map(c => c.name))];

  return (
    <div className="store-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">BookHaven</h1>
          <p className="hero-subtitle">Nơi mỗi trang sách mở ra một thế giới mới.</p>
          <div className="hero-tags">
            <span className="hero-tag">✓ Hơn 10 đầu sách</span>
            <span className="hero-tag">✓ Giao hàng toàn trường</span>
            <span className="hero-tag">✓ Đổi trả trong 30 giây</span>
          </div>
        </div>
        <div className="hero-image-container">
          {HERO_IMAGES.map((imgUrl, idx) => (
            <img
              key={idx}
              src={imgUrl}
              alt="BookHaven - Kho sách tri thức"
              className={`hero-image ${heroImageIndex === idx ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="store-section">
        <h2 className="section-title">Sách hay dành cho bạn</h2>

        {/* Categories & Search */}
        <div className="filter-bar">
          <div className="categories-container">
            {categoryNames.map(category => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'category-btn-active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="products-grid">
          {loading ? (
            // Skeleton load state
            [...Array(8)].map((_, i) => (
              <div key={`skel-${i}`} className="skeleton-card">
                <Skeleton height="250px" borderRadius="20px 20px 0 0" />
                <div className="card-details">
                  <Skeleton height="20px" width="80%" style={{ marginBottom: '8px' }} />
                  <Skeleton height="24px" width="40%" />
                </div>
              </div>
            ))
          ) : (
            filteredProducts.slice(0, visibleCount).map(product => (
              <div key={product.id} className="product-card animate-fade-in">
                <div className="product-image-box">
                  <Link to={`/product/${product.id}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                    <img src={product.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'} alt={product.name} className="product-image" />
                  </Link>
                  <button
                    onClick={(e) => handleToggleFavorite(e, product.id)}
                    className="fav-btn"
                    style={{ color: favoriteIds.includes(product.id) ? '#ef4444' : '#94a3b8' }}
                    title={favoriteIds.includes(product.id) ? "Bỏ yêu thích" : "Thêm vào danh sách yêu thích"}
                  >
                    <Heart size={20} fill={favoriteIds.includes(product.id) ? '#ef4444' : 'rgba(255,255,255,0.8)'} />
                  </button>
                </div>
                <div className="card-details">
                  <Link to={`/product/${product.id}`} className="product-name-link">
                    <h3 className="product-card-name">{product.name}</h3>
                  </Link>
                  <p className="product-card-author">
                    {product.author || '\u00A0'}
                  </p>
                  <div className="product-price-row">
                    <div className="product-price-container">
                      <p className={`original-price ${user?.membership_type === 'vip' && product.vip_price ? 'vip-strike' : ''}`}>
                        {product.price?.toLocaleString()}₫
                      </p>
                      {product.vip_price && (
                        <div className="vip-badge-container">
                          <Crown size={12} color="#00B04B" fill="#00B04B" />
                          <span className={`vip-price-label ${user?.membership_type === 'vip' ? 'vip-active' : ''}`}>
                            {product.vip_price?.toLocaleString()}₫
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product);
                      }}
                      title="Thêm vào giỏ hàng"
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Nút Xem thêm sản phẩm */}
        {filteredProducts.length > visibleCount && (
          <div className="see-more-container">
            <button
              className="see-more-btn"
              onClick={() => setVisibleCount(prev => prev + 20)}
            >
              Xem thêm sách
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreHome;
