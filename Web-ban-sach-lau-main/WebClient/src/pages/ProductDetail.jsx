import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Minus, Plus, ChevronLeft, Crown, Heart } from 'lucide-react';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(`/products/${id}`);
        setProduct(data);

        // Auto-select first variant options if available
        if (data.product_variants && data.product_variants.length > 0) {
          const firstVariant = data.product_variants[0];
          if (firstVariant.size) setSelectedSize(firstVariant.size);
          if (firstVariant.color) setSelectedColor(firstVariant.color);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const { data } = await client.get(`/reviews/${id}`);
        setReviews(data || []);
      } catch (err) {
        console.error('Lỗi tải đánh giá:', err);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchFavorite = async () => {
      if (!user) {
        setIsFavorite(false);
        return;
      }
      try {
        const { data } = await client.get(`/favorites/${id}`);
        setIsFavorite(data.isFavorite);
      } catch (err) {
        console.error('Lỗi tải trạng thái yêu thích:', err);
      }
    };
    fetchFavorite();
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng tính năng yêu thích!");
      return;
    }
    try {
      const { data } = await client.post('/favorites/toggle', { product_id: product.id });
      setIsFavorite(data.favorite);
    } catch (err) {
      console.error('Lỗi toggle yêu thích:', err);
    }
  };

  const handleAddToCart = () => {
    // If product has variants, require selection
    const hasSizes = product.product_variants?.some(v => v.size);
    const hasColors = product.product_variants?.some(v => v.color);

    if (hasSizes && !selectedSize) {
      alert('Vui lòng chọn loại bìa');
      return;
    }
    if (hasColors && !selectedColor) {
      alert('Vui lòng chọn phiên bản');
      return;
    }

    // Find the selected variant to get accurate price/stock if needed
    let variantId = null;
    let finalPrice = product.price;

    if (product.product_variants?.length > 0) {
      const selectedVariant = product.product_variants.find(
        v => (v.size === selectedSize || !hasSizes) && (v.color === selectedColor || !hasColors)
      );
      if (selectedVariant) {
        variantId = selectedVariant.id;
        if (selectedVariant.price) finalPrice = selectedVariant.price;
      }
    }

    // Create a unique cart item ID based on variant choices
    const cartItemId = variantId ? `${product.id}-${variantId}` : product.id;

    // Add multiple quantities
    for (let i = 0; i < quantity; i++) {
      addToCart({
        ...product,
        id: cartItemId, // overriding ID for cart distinctness
        original_id: product.id,
        price: finalPrice,
        selectedSize,
        selectedColor,
        variantId
      });
    }

    // Reset quantity after adding
    setQuantity(1);
  };

  if (loading) {
    return <div style={styles.centerContainer}>Đang tải...</div>;
  }

  if (error || !product) {
    return (
      <div style={styles.centerContainer}>
        <p style={styles.errorText}>{error || 'Sản phẩm không tồn tại'}</p>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <ChevronLeft size={20} />
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  // Extract unique sizes and colors
  const sizes = [...new Set(product.product_variants?.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(product.product_variants?.map(v => v.color).filter(Boolean))];

  // Image Gallery Logic
  const galleryImages = [
    product.image,
    ...(product.product_variants?.map(v => v.image).filter(Boolean) || [])
  ].filter((v, i, a) => v && a.indexOf(v) === i); // Deduplicate and remove nulls

  // Determine current variant based on selections
  const hasSizes = product.product_variants?.some(v => v.size);
  const hasColors = product.product_variants?.some(v => v.color);
  const selectedVariant = product.product_variants?.find(
    v => (v.size === selectedSize || !hasSizes) && (v.color === selectedColor || !hasColors)
  );

  // Determine display image: prioritize user clicked image, then selected color, then variant, then default
  let displayImage = activeImage || product.image || 'https://via.placeholder.com/600';
  if (!activeImage) {
    if (selectedColor) {
      const colorVariant = product.product_variants?.find(v => v.color === selectedColor && v.image);
      if (colorVariant) {
        displayImage = colorVariant.image;
      }
    } else if (selectedVariant?.image) {
      displayImage = selectedVariant.image;
    }
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backLink}>
        <ChevronLeft size={20} /> Quay lại
      </button>

      <div style={styles.productWrapper}>
        {/* Left: Image Gallery */}
        <div style={styles.imageSection}>
          <div style={styles.mainImageContainer}>
            <img
              src={displayImage}
              alt={product.name}
              style={styles.mainImage}
            />
          </div>
          {galleryImages.length > 1 && (
            <div style={styles.thumbnailGallery}>
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  style={{
                    ...styles.thumbnailBtn,
                    borderColor: displayImage === img ? 'var(--primary)' : 'transparent'
                  }}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} style={styles.thumbnailImg} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div style={styles.infoSection}>

          <h1 style={styles.title}>{product.name}</h1>

          <div style={styles.ratingRow}>
            <div style={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.floor(product.rating || 0) ? "#f59e0b" : "transparent"}
                  color={i < Math.floor(product.rating || 0) ? "#f59e0b" : "#d1d5db"}
                />
              ))}
            </div>
            <span style={styles.ratingText}>
              {product.rating?.toFixed(1)} ({product.rating_count} đánh giá)
            </span>
          </div>

          <div style={styles.priceContainer}>
            <p style={{
              ...styles.price,
              textDecoration: user?.membership_type === 'vip' && product.vip_price ? 'line-through' : 'none',
              fontSize: user?.membership_type === 'vip' && product.vip_price ? '18px' : '32px', // Tăng cỡ chữ giá thường cho nổi bật
              color: user?.membership_type === 'vip' && product.vip_price ? 'var(--text-muted)' : 'var(--primary)',
              marginBottom: 0 // Xóa margin bottom để căn chỉnh trục dọc hoàn hảo với badge
            }}>
              {(selectedVariant?.price || product.price)?.toLocaleString()}₫
            </p>
            {product.vip_price && (
              <div style={{
                ...styles.vipPriceBadge,
                backgroundColor: user?.membership_type === 'vip' ? '#F2FDF5' : '#f8fafc',
                border: user?.membership_type === 'vip' ? '1.5px solid var(--primary, #00B04B)' : '1px dashed var(--border)',
                boxShadow: user?.membership_type === 'vip' ? '0 4px 12px rgba(0, 176, 75, 0.12)' : 'none'
              }}>
                <Crown size={user?.membership_type === 'vip' ? 18 : 14} color="var(--primary, #00B04B)" fill="var(--primary, #00B04B)" />
                <span style={{
                  ...styles.vipPriceText,
                  fontSize: user?.membership_type === 'vip' ? '32px' : '16px', // Tăng cỡ chữ giá VIP khi là VIP thực thụ
                  fontWeight: '800'
                }}>
                  {product.vip_price.toLocaleString()}₫
                </span>
                <span style={{
                  ...styles.vipLabel,
                  backgroundColor: user?.membership_type === 'vip' ? 'var(--primary, #00B04B)' : 'var(--text-muted)'
                }}>
                  {user?.membership_type === 'vip' ? 'Giá VIP của bạn' : 'Giá VIP'}
                </span>
              </div>
            )}
          </div>

          <p style={styles.description}>{product.description}</p>

          {/* Thông tin chi tiết sách */}
          {(product.author || product.publisher || product.isbn || product.pages) && (
            <div style={styles.bookInfoBox}>
              <h3 style={styles.bookInfoTitle}>Thông tin sách</h3>
              <table style={styles.bookInfoTable}>
                <tbody>
                  {product.author && (
                    <tr>
                      <td style={styles.bookInfoLabel}>Tác giả</td>
                      <td style={{ ...styles.bookInfoValue, textTransform: 'uppercase' }}>{product.author}</td>
                    </tr>
                  )}
                  {product.publisher && (
                    <tr>
                      <td style={styles.bookInfoLabel}>Nhà xuất bản</td>
                      <td style={styles.bookInfoValue}>{product.publisher}</td>
                    </tr>
                  )}
                  {product.published_year && (
                    <tr>
                      <td style={styles.bookInfoLabel}>Năm xuất bản</td>
                      <td style={styles.bookInfoValue}>{product.published_year}</td>
                    </tr>
                  )}
                  {product.pages && (
                    <tr>
                      <td style={styles.bookInfoLabel}>Số trang</td>
                      <td style={styles.bookInfoValue}>{product.pages} trang</td>
                    </tr>
                  )}
                  {product.language && (
                    <tr>
                      <td style={styles.bookInfoLabel}>Ngôn ngữ</td>
                      <td style={styles.bookInfoValue}>{product.language}</td>
                    </tr>
                  )}
                  {product.isbn && (
                    <tr>
                      <td style={styles.bookInfoLabel}>Mã ISBN</td>
                      <td style={styles.bookInfoValue}>{product.isbn}</td>
                    </tr>
                  )}
                  {product.cover_type && (
                    <tr>
                      <td style={styles.bookInfoLabel}>Loại bìa</td>
                      <td style={styles.bookInfoValue}>{product.cover_type}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={styles.divider}></div>

          {/* Variants Selection */}
          {/* Chọn biến thể: Loại bìa */}
          {sizes.length > 0 && (
            <div style={styles.variantSection}>
              <h3 style={styles.variantTitle}>Loại bìa</h3>
              <div style={styles.variantOptions}>
                {sizes.map(size => (
                  <button
                    key={size}
                    style={{
                      ...styles.variantBtn,
                      ...(selectedSize === size ? styles.variantBtnActive : {})
                    }}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chọn biến thể: Phiên bản */}
          {colors.length > 0 && (
            <div style={styles.variantSection}>
              <h3 style={styles.variantTitle}>Phiên bản</h3>
              <div style={styles.variantOptions}>
                {colors.map(color => (
                  <button
                    key={color}
                    style={{
                      ...styles.variantBtn,
                      ...(selectedColor === color ? styles.variantBtnActive : {})
                    }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div style={styles.actionSection}>
            <div style={styles.quantityControl}>
              <button
                style={styles.qtyBtn}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} />
              </button>
              <span style={styles.qtyText}>{quantity}</span>
              <button
                style={styles.qtyBtn}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={18} />
              </button>
            </div>

            <button style={styles.addToCartBtn} onClick={handleAddToCart}>
              <ShoppingBag size={20} />
              <span>Thêm vào giỏ hàng</span>
            </button>
            <button
              style={{
                ...styles.favBtn,
                color: isFavorite ? '#ef4444' : '#94a3b8',
                borderColor: isFavorite ? '#ef4444' : 'var(--border, #e2e8f0)'
              }}
              onClick={handleToggleFavorite}
              title={isFavorite ? "Bỏ yêu thích" : "Thêm vào danh sách yêu thích"}
            >
              <Heart size={24} fill={isFavorite ? '#ef4444' : 'transparent'} />
            </button>
          </div>

        </div>
      </div>

      {/* Reviews Section */}
      <div style={styles.reviewsSection}>
        <h2 style={styles.reviewsTitle}>Đánh giá từ khách hàng ({reviews.length})</h2>

        {reviews.length === 0 ? (
          <p style={styles.noReviews}>Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <div style={styles.reviewsList}>
            {reviews.map((review) => (
              <div key={review.id} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewerInfo}>
                    <div style={styles.reviewerAvatar}>
                      {review.users?.avatar ? (
                        <img src={review.users.avatar} alt={review.users.name} style={styles.avatarImg} />
                      ) : (
                        review.users?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <h4 style={styles.reviewerName}>{review.users?.name}</h4>
                      <div style={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.rating ? "#f59e0b" : "transparent"}
                            color={i < review.rating ? "#f59e0b" : "#d1d5db"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p style={styles.reviewComment}>{review.comment}</p>
              </div>
            ))}
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
  centerContainer: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'var(--danger)',
    fontSize: '18px',
    marginBottom: '20px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: 'var(--text-muted)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '15px',
    marginBottom: '20px',
    padding: 0,
  },
  productWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '40px',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: 'var(--shadow)',
  },
  imageSection: {
    flex: '1 1 40%',
    minWidth: '300px',
  },
  mainImageContainer: {
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: '20px',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  mainImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: '8px',
  },
  thumbnailGallery: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    overflowX: 'auto',
    paddingBottom: '5px',
  },
  thumbnailBtn: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    border: '2px solid transparent',
    padding: '2px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'border-color 0.2s',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  infoSection: {
    flex: '1 1 50%',
    display: 'flex',
    flexDirection: 'column',
  },
  shopInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginBottom: '12px',
    fontSize: '14px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--text-main)',
    marginBottom: '10px',
    lineHeight: '1.2',
    textTransform: 'uppercase',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  stars: {
    display: 'flex',
    gap: '2px',
  },
  ratingText: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: '500',
  },
  price: {
    fontSize: '36px',
    fontWeight: '800',
    color: 'var(--primary)',
    marginBottom: '24px',
  },
  description: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  bookInfoBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '24px',
  },
  bookInfoTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-main)',
    marginBottom: '14px',
    marginTop: 0,
  },
  bookInfoTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  bookInfoLabel: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    padding: '5px 0',
    width: '40%',
    verticalAlign: 'top',
  },
  bookInfoValue: {
    fontSize: '14px',
    color: 'var(--text-main)',
    padding: '5px 0',
    fontWeight: '500',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border)',
    margin: '0 0 30px 0',
  },
  variantSection: {
    marginBottom: '24px',
  },
  variantTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  variantOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  variantBtn: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '2px solid var(--border)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  variantBtnActive: {
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
    backgroundColor: 'rgba(227, 102, 49, 0.05)',
  },
  actionSection: {
    display: 'flex',
    gap: '20px',
    marginTop: 'auto',
    paddingTop: '30px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#f1f5f9',
    borderRadius: '30px',
    padding: '5px 15px',
    border: '1px solid var(--border)',
  },
  qtyBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-main)',
    padding: '5px',
  },
  qtyText: {
    fontWeight: '700',
    fontSize: '18px',
    minWidth: '24px',
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '16px',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    boxShadow: 'var(--shadow-primary)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  favBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    height: '56px', // match with addToCartBtn
    backgroundColor: '#fff',
    border: '2px solid',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  reviewsSection: {
    marginTop: '60px',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '24px',
    boxShadow: 'var(--shadow)',
  },
  reviewsTitle: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '30px',
    borderLeft: '5px solid var(--primary)',
    paddingLeft: '15px',
  },
  noReviews: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '40px 0',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  reviewCard: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid var(--border)',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  reviewerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  reviewerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  reviewerName: {
    fontSize: '15px',
    fontWeight: '700',
    marginBottom: '2px',
  },
  reviewStars: {
    display: 'flex',
    gap: '2px',
  },
  reviewComment: {
    fontSize: '15px',
    color: 'var(--text-main)',
    lineHeight: '1.5',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    padding: '12px 20px',
    backgroundColor: 'rgba(0, 176, 75, 0.02)', // 2% xanh signature
    borderRadius: '16px',
    border: '1px solid rgba(0, 176, 75, 0.08)',
  },
  vipPriceBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '30px', // Hình dạng viên thuốc (pill shape) cực đẹp
    transition: 'all 0.3s ease',
  },
  vipPriceText: {
    fontFamily: 'Outfit, sans-serif',
    color: 'var(--primary, #00B04B)',
  },
  vipLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#fff',
    padding: '3px 8px',
    borderRadius: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }
};

export default ProductDetail;
