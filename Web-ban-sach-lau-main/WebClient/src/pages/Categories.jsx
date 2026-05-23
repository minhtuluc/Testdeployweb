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
import './Categories.css';

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
    <div className="cat-container animate-fade-in">
      <div className="cat-layout">
        {/* Sidebar */}
        <aside className="cat-sidebar">
          <h2 className="cat-sidebar-title">Danh mục</h2>
          <div className="cat-nav">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Skeleton key={i} height="50px" style={{ marginBottom: '10px', borderRadius: '12px' }} />
              ))
            ) : (
              categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-nav-item ${activeCategory?.id === cat.id ? 'cat-nav-item-active' : ''}`}
                  onClick={() => handleParentClick(cat)}
                >
                  <span className="cat-icon-wrapper">{getIcon(cat.name)}</span>
                  <span className="cat-name">{cat.name}</span>
                  <ChevronRight size={16} className="cat-chevron" />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="cat-main-content">
          {loading ? (
            <div className="cat-skeleton-content">
              <Skeleton height="200px" style={{ borderRadius: '24px', marginBottom: '30px' }} />
              <div className="cat-grid">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height="150px" style={{ borderRadius: '20px' }} />
                ))}
              </div>
            </div>
          ) : activeCategory ? (
            <div className="animate-fade-in">
              {/* Category Banner */}
              <div className="cat-banner">
                <div className="cat-banner-overlay">
                  <h1 className="cat-banner-title">{activeCategory.name}</h1>
                  <p className="cat-banner-subtitle">
                    Khám phá hàng ngàn tựa sách {activeCategory.name.toLowerCase()} chất lượng nhất tại BookHaven.
                  </p>
                  <Link to={`/?category=${activeCategory.name}`} className="cat-shop-now-btn">
                    Xem tại trang chủ
                  </Link>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80" 
                  alt="Banner" 
                  className="cat-banner-img" 
                />
              </div>

              {/* Products List Grid inside tab */}
              <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 className="cat-section-title" style={{ marginBottom: 0 }}>
                    Tất cả sản phẩm của "{activeCategory.name}"
                  </h3>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {getFilteredProducts().length} sản phẩm
                  </span>
                </div>
                
                {getFilteredProducts().length > 0 ? (
                  <>
                    <div className="cat-products-grid">
                      {getFilteredProducts().slice(0, visibleCount).map(product => (
                        <div key={product.id} className="cat-card animate-fade-in">
                          <div className="cat-image-box">
                            <Link to={`/product/${product.id}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                              <img src={product.image || 'https://via.placeholder.com/250'} alt={product.name} className="cat-product-image" />
                            </Link>
                            <button 
                              onClick={(e) => handleToggleFavorite(e, product.id)}
                              className="cat-fav-icon-badge"
                              style={{ color: favoriteIds.includes(product.id) ? '#ef4444' : '#94a3b8' }}
                              title={favoriteIds.includes(product.id) ? "Bỏ yêu thích" : "Thêm vào danh sách yêu thích"}
                            >
                              <Heart size={20} fill={favoriteIds.includes(product.id) ? '#ef4444' : 'rgba(255,255,255,0.8)'} />
                            </button>
                          </div>
                          <div className="cat-card-content">
                            <Link to={`/product/${product.id}`} style={{textDecoration: 'none'}}>
                              <h3 className="cat-product-name" title={product.name}>{product.name}</h3>
                            </Link>
                            <p className="cat-product-author">
                              {product.author || '\u00A0'}
                            </p>
                            <div className="cat-price-row">
                              <div className="cat-price-container">
                                <p className="cat-product-price" style={{
                                  textDecoration: user?.membership_type === 'vip' && product.vip_price ? 'line-through' : 'none',
                                  fontSize: user?.membership_type === 'vip' && product.vip_price ? '12px' : '18px',
                                  color: user?.membership_type === 'vip' && product.vip_price ? 'var(--text-muted)' : 'var(--primary)'
                                }}>
                                  {product.price?.toLocaleString()}₫
                                </p>
                                {product.vip_price && (
                                  <div className="cat-vip-price-small">
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
                                className="cat-add-to-cart-btn" 
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
                      <div className="cat-see-more-container">
                        <button 
                          className="cat-see-more-btn" 
                          onClick={() => setVisibleCount(prev => prev + 20)}
                        >
                          Xem thêm sản phẩm
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cat-empty-sub">
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

export default Categories;
