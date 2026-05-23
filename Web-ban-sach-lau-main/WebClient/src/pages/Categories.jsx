import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Shirt, 
  Dumbbell, 
  LayoutGrid,
  Footprints, 
  Backpack,   
  Sparkles,
  Crown,
  ShoppingBag,
  Heart
} from 'lucide-react';
import client from '../api/client';
import Skeleton from '../components/Skeleton';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Categories = () => {
  const { user } = useAuth();
  const { addToCart } = useCart() || { addToCart: () => alert('Giỏ hàng chưa được khởi tạo!') };
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20); // Khai báo state số lượng hiển thị ban đầu là 20
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data } = await client.get('/home');
        const cats = data.categories || [];
        setCategories(cats);
        setProducts(data.products || []);
        if (cats.length > 0) {
          setActiveCategory(cats[0]);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
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

  // Reset số lượng sản phẩm hiển thị khi chuyển danh mục cha
  useEffect(() => {
    setVisibleCount(20);
  }, [activeCategory]);

  const handleParentClick = (cat) => {
    setActiveCategory(cat);
  };

  const getFilteredProducts = () => {
    if (!activeCategory) return [];

    const targetCategoryIds = [activeCategory.id];
    if (activeCategory.children) {
      activeCategory.children.forEach(child => {
        targetCategoryIds.push(child.id);
      });
    }

    return products.filter(p => targetCategoryIds.includes(p.category_id));
  };

  const getIcon = (name) => {
    const iconMap = {
      'Giày': <Footprints size={20} />,
      'Quần áo': <Shirt size={20} />,
      'Phụ kiện': <Backpack size={20} />,
      'Thời trang': <Shirt size={20} />,
      'Thể thao': <Dumbbell size={20} />,
      'Khác': <Sparkles size={20} />
    };
    return iconMap[name] || <LayoutGrid size={20} />;
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>Danh mục</h2>
          <div style={styles.nav}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Skeleton key={i} height="50px" style={{ marginBottom: '10px', borderRadius: '12px' }} />
              ))
            ) : (
              categories.map(cat => (
                <button
                  key={cat.id}
                  style={{
                    ...styles.navItem,
                    ...(activeCategory?.id === cat.id ? styles.navItemActive : {})
                  }}
                  onClick={() => handleParentClick(cat)}
                >
                  <span style={styles.iconWrapper}>{getIcon(cat.name)}</span>
                  <span style={styles.catName}>{cat.name}</span>
                  <ChevronRight size={16} style={styles.chevron} />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main style={styles.mainContent}>
          {loading ? (
            <div style={styles.skeletonContent}>
              <Skeleton height="200px" style={{ borderRadius: '24px', marginBottom: '30px' }} />
              <div style={styles.grid}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height="150px" style={{ borderRadius: '20px' }} />
                ))}
              </div>
            </div>
          ) : activeCategory ? (
            <div className="animate-fade-in">
              {/* Category Banner */}
              <div style={styles.banner}>
                <div style={styles.bannerOverlay}>
                  <h1 style={styles.bannerTitle}>{activeCategory.name}</h1>
                  <p style={styles.bannerSubtitle}>
                    Khám phá hàng ngàn tựa sách {activeCategory.name.toLowerCase()} chất lượng nhất tại BookHaven.
                  </p>
                  <Link to={`/?category=${activeCategory.name}`} style={styles.shopNowBtn}>
                    Xem tại trang chủ
                  </Link>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80" 
                  alt="Banner" 
                  style={styles.bannerImg} 
                />
              </div>

              {/* Products List Grid inside tab */}
              <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={styles.sectionTitle}>
                    Tất cả sản phẩm của "{activeCategory.name}"
                  </h3>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {getFilteredProducts().length} sản phẩm
                  </span>
                </div>
                
                {getFilteredProducts().length > 0 ? (
                  <>
                    <div style={styles.productsGrid}>
                      {getFilteredProducts().slice(0, visibleCount).map(product => (
                        <div key={product.id} style={styles.card} className="book-card animate-fade-in">
                          <div style={styles.imageBox}>
                            <Link to={`/product/${product.id}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                              <img src={product.image || 'https://via.placeholder.com/250'} alt={product.name} style={styles.productImage} />
                            </Link>
                            <button 
                              onClick={(e) => handleToggleFavorite(e, product.id)}
                              style={{...styles.favIconBadge, color: favoriteIds.includes(product.id) ? '#ef4444' : '#94a3b8'}}
                              title={favoriteIds.includes(product.id) ? "Bỏ yêu thích" : "Thêm vào danh sách yêu thích"}
                            >
                              <Heart size={20} fill={favoriteIds.includes(product.id) ? '#ef4444' : 'rgba(255,255,255,0.8)'} />
                            </button>
                          </div>
                          <div style={styles.cardContent}>
                            <Link to={`/product/${product.id}`} style={{textDecoration: 'none'}}>
                              <h3 style={styles.productName} title={product.name}>{product.name}</h3>
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
                      ))}
                    </div>

                    {/* Nút Xem thêm sản phẩm */}
                    {getFilteredProducts().length > visibleCount && (
                      <div style={styles.seeMoreContainer}>
                        <button 
                          style={styles.seeMoreBtn} 
                          onClick={() => setVisibleCount(prev => prev + 20)}
                        >
                          Xem thêm sản phẩm
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.emptySub}>
                    <ShoppingBag size={40} color="var(--text-muted)" />
                    <p>Hiện chưa có sản phẩm nào thuộc mục này</p>
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
    minHeight: '80vh',
  },
  layout: {
    display: 'flex',
    gap: '40px',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '24px',
    color: 'var(--text-main)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '16px',
    borderRadius: '16px',
    backgroundColor: '#fff',
    border: '1px solid transparent',
    color: 'var(--text-main)',
    fontWeight: '500',
    transition: 'all 0.2s',
    textAlign: 'left',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
  },
  navItemActive: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    boxShadow: 'var(--shadow-primary)',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    flex: 1,
    fontSize: '15px',
  },
  chevron: {
    opacity: 0.5,
  },
  mainContent: {
    flex: 1,
  },
  banner: {
    height: '240px',
    borderRadius: '24px',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: '40px',
    backgroundColor: 'var(--bg-dark)',
  },
  bannerOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 100%)',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    color: '#fff',
  },
  bannerTitle: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '10px',
  },
  bannerSubtitle: {
    fontSize: '16px',
    color: '#cbd5e1',
    maxWidth: '400px',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.8,
  },
  shopNowBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '25px',
    fontWeight: '600',
    fontSize: '14px',
    textDecoration: 'none',
    boxShadow: 'var(--shadow-primary)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '24px',
    color: 'var(--text-main)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '24px',
  },
  subCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
    border: '2px solid var(--border)',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'block',
  },
  subImgWrapper: {
    width: '100%',
    aspectRatio: '1/1',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '15px',
    backgroundColor: '#f1f5f9',
  },
  subImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s',
  },
  subName: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  emptySub: {
    gridColumn: '1 / -1',
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '24px',
    color: 'var(--text-muted)',
    border: '2px dashed var(--border)',
  },
  skeletonContent: {
    width: '100%',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  imageBox: {
    height: '250px',
    backgroundColor: '#f8fafc',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px'
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
    transition: 'transform 0.3s ease',
  },
  cardContent: {
    padding: '16px',
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
  productPrice: {
    margin: 0,
    fontWeight: '700',
  },
  vipPriceSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  addToCartBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(227,102,49,0.2)',
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

export default Categories;
