import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Star, Search, Filter, Crown, Heart } from 'lucide-react';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';

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
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>BookHaven</h1>
          <p style={styles.heroSubtitle}>Nơi mỗi trang sách mở ra một thế giới mới.</p>
          <div style={styles.heroTags}>
            <span style={styles.heroTag}>✓ Hơn 10 đầu sách</span>
            <span style={styles.heroTag}>✓ Giao hàng toàn trường</span>
            <span style={styles.heroTag}>✓ Đổi trả trong 30 giây</span>
          </div>
        </div>
        <div style={styles.heroImageContainer}>
          <img
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80"
            alt="BookHaven - Kho sách tri thức"
            style={styles.heroImage}
          />
        </div>
      </div>

      <div style={styles.storeSection}>
        <h2 style={styles.sectionTitle}>Sách hay dành cho bạn</h2>

        {/* Categories & Search */}
        <div style={styles.filterBar}>
          <div style={styles.categories}>
            {categoryNames.map(category => (
              <button
                key={category}
                style={{
                  ...styles.categoryBtn,
                  ...(activeCategory === category ? styles.categoryBtnActive : {})
                }}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div style={styles.searchBox}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm tên sách, tác giả..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.grid}>
          {loading ? (
            // Skeleton load state
            [...Array(8)].map((_, i) => (
              <div key={`skel-${i}`} style={styles.card}>
                <Skeleton height="250px" borderRadius="0" />
                <div style={styles.cardContent}>
                  <Skeleton height="20px" width="80%" style={{ marginBottom: '8px' }} />
                  <Skeleton height="24px" width="40%" />
                </div>
              </div>
            ))
          ) : (
            filteredProducts.slice(0, visibleCount).map(product => (
              <div key={product.id} style={styles.card} className="book-card animate-fade-in">
                <div style={styles.imageBox}>
                  <Link to={`/product/${product.id}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                    <img src={product.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80'} alt={product.name} style={styles.productImage} />
                  </Link>
                  <button
                    onClick={(e) => handleToggleFavorite(e, product.id)}
                    style={{ ...styles.favIconBadge, color: favoriteIds.includes(product.id) ? '#ef4444' : '#94a3b8' }}
                    title={favoriteIds.includes(product.id) ? "Bỏ yêu thích" : "Thêm vào danh sách yêu thích"}
                  >
                    <Heart size={20} fill={favoriteIds.includes(product.id) ? '#ef4444' : 'rgba(255,255,255,0.8)'} />
                  </button>
                </div>
                <div style={styles.cardContent}>
                  <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={styles.productName}>{product.name}</h3>
                  </Link>
                  <p style={styles.productAuthor}>
                    {product.author || '\u00A0'}
                  </p>
                  <div style={styles.priceRow}>
                    <div style={styles.priceContainer}>
                      <p style={{
                        ...styles.productPrice,
                        textDecoration: user?.membership_type === 'vip' && product.vip_price ? 'line-through' : 'none',
                        fontSize: user?.membership_type === 'vip' && product.vip_price ? '12px' : '18px',
                        color: user?.membership_type === 'vip' && product.vip_price ? 'var(--text-muted)' : 'var(--primary)'
                      }}>
                        {product.price?.toLocaleString()}₫
                      </p>
                      {product.vip_price && (
                        <div style={styles.vipPriceSmall}>
                          <Crown size={12} color="#00B04B" fill="#00B04B" />
                          <span style={{
                            color: '#00B04B',
                            fontWeight: '800',
                            fontSize: user?.membership_type === 'vip' ? '18px' : '14px'
                          }}>
                            {product.vip_price?.toLocaleString()}₫
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      style={styles.addToCartBtn}
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
          <div style={styles.seeMoreContainer}>
            <button
              style={styles.seeMoreBtn}
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

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  hero: {
    backgroundColor: 'var(--bg-dark)',
    borderRadius: '24px',
    display: 'flex',
    overflow: 'hidden',
    height: '400px',
    marginBottom: '40px',
    color: '#fff',
  },
  heroContent: {
    flex: 1,
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--primary)',
    backgroundColor: 'rgba(227,102,49,0.15)',
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: '20px',
    marginBottom: '14px',
    letterSpacing: '0.5px',
  },
  heroTitle: {
    fontSize: '64px',
    fontWeight: '800',
    marginBottom: '10px',
    lineHeight: 1.1,
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#cbd5e1',
    marginBottom: '30px',
    lineHeight: 1.6,
  },
  heroTags: {
    display: 'flex',
    gap: '20px',
    marginTop: 'auto',
  },
  heroTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    backdropFilter: 'blur(5px)',
  },
  heroImageContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  storeSection: {
    marginTop: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '20px',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  categories: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '5px',
  },
  categoryBtn: {
    padding: '10px 20px',
    borderRadius: '25px',
    backgroundColor: '#f1f5f9',
    color: 'var(--text-muted)',
    fontWeight: '600',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  categoryBtnActive: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '15px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    padding: '10px 15px 10px 40px',
    borderRadius: '25px',
    border: '1px solid var(--border)',
    outline: 'none',
    width: '250px',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
  },
  imageBox: {
    height: '280px',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
  },
  favIconBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
    zIndex: 2,
  },
  productImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    borderRadius: '4px',
    transition: 'transform 0.3s',
  },
  cardContent: {
    padding: '20px',
    backgroundColor: '#fff',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  productName: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-main)',
    marginBottom: '8px',
    lineHeight: '20px',
    height: '40px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  productAuthor: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '12px',
    marginTop: 0,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    height: '18px',
    lineHeight: '18px',
  },
  productPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--primary)',
    margin: 0,
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  vipPriceSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  addToCartBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  seeMoreContainer: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    marginTop: '32px',
    marginBottom: '40px',
  },
  seeMoreBtn: {
    backgroundColor: 'var(--bg-light)',
    border: '1px solid var(--primary)',
    color: 'var(--primary)',
    padding: '12px 36px',
    borderRadius: '30px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(227, 102, 49, 0.08)',
    outline: 'none',
  }
};

export default StoreHome;
