import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Minus, Plus, ChevronLeft, Crown, Heart } from 'lucide-react';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

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
    return <div className="pd-center-container">Đang tải...</div>;
  }

  if (error || !product) {
    return (
      <div className="pd-center-container">
        <p className="pd-error-text">{error || 'Sản phẩm không tồn tại'}</p>
        <button onClick={() => navigate('/')} className="pd-back-btn-error">
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
    } else if (se  return (
    <div className="pd-container">
      <button onClick={() => navigate(-1)} className="pd-back-link">
        <ChevronLeft size={20} /> Quay lại
      </button>

      <div className="pd-product-wrapper">
        {/* Left: Image Gallery */}
        <div className="pd-image-section">
          <div className="pd-main-image-container">
            <img
              src={displayImage}
              alt={product.name}
              className="pd-main-image"
            />
          </div>
          {galleryImages.length > 1 && (
            <div className="pd-thumbnail-gallery">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  className="pd-thumbnail-btn"
                  style={{
                    borderColor: displayImage === img ? 'var(--primary)' : 'transparent'
                  }}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="pd-thumbnail-img" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="pd-info-section">

          <h1 className="pd-title">{product.name}</h1>

          <div className="pd-rating-row">
            <div className="pd-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.floor(product.rating || 0) ? "#f59e0b" : "transparent"}
                  color={i < Math.floor(product.rating || 0) ? "#f59e0b" : "#d1d5db"}
                />
              ))}
            </div>
            <span className="pd-rating-text">
              {product.rating?.toFixed(1)} ({product.rating_count} đánh giá)
            </span>
          </div>

          <div className="pd-price-container">
            <p className="pd-price" style={{
              textDecoration: user?.membership_type === 'vip' && product.vip_price ? 'line-through' : 'none',
              fontSize: user?.membership_type === 'vip' && product.vip_price ? '18px' : '32px',
              color: user?.membership_type === 'vip' && product.vip_price ? 'var(--text-muted)' : 'var(--primary)'
            }}>
              {(selectedVariant?.price || product.price)?.toLocaleString()}₫
            </p>
            {product.vip_price && (
              <div className="pd-vip-price-badge" style={{
                backgroundColor: user?.membership_type === 'vip' ? '#F2FDF5' : '#f8fafc',
                border: user?.membership_type === 'vip' ? '1.5px solid var(--primary, #00B04B)' : '1px dashed var(--border)',
                boxShadow: user?.membership_type === 'vip' ? '0 4px 12px rgba(0, 176, 75, 0.12)' : 'none'
              }}>
                <Crown size={user?.membership_type === 'vip' ? 18 : 14} color="var(--primary, #00B04B)" fill="var(--primary, #00B04B)" />
                <span className="pd-vip-price-text" style={{
                  fontSize: user?.membership_type === 'vip' ? '32px' : '16px'
                }}>
                  {product.vip_price.toLocaleString()}₫
                </span>
                <span className="pd-vip-label" style={{
                  backgroundColor: user?.membership_type === 'vip' ? 'var(--primary, #00B04B)' : 'var(--text-muted)'
                }}>
                  {user?.membership_type === 'vip' ? 'Giá VIP của bạn' : 'Giá VIP'}
                </span>
              </div>
            )}
          </div>

          <p className="pd-description">{product.description}</p>

          {/* Thông tin chi tiết sách */}
          {(product.author || product.publisher || product.isbn || product.pages) && (
            <div className="pd-book-info-box">
              <h3 className="pd-book-info-title">Thông tin sách</h3>
              <table className="pd-book-info-table">
                <tbody>
                  {product.author && (
                    <tr>
                      <td className="pd-book-info-label">Tác giả</td>
                      <td className="pd-book-info-value" style={{ textTransform: 'uppercase' }}>{product.author}</td>
                    </tr>
                  )}
                  {product.publisher && (
                    <tr>
                      <td className="pd-book-info-label">Nhà xuất bản</td>
                      <td className="pd-book-info-value">{product.publisher}</td>
                    </tr>
                  )}
                  {product.published_year && (
                    <tr>
                      <td className="pd-book-info-label">Năm xuất bản</td>
                      <td className="pd-book-info-value">{product.published_year}</td>
                    </tr>
                  )}
                  {product.pages && (
                    <tr>
                      <td className="pd-book-info-label">Số trang</td>
                      <td className="pd-book-info-value">{product.pages} trang</td>
                    </tr>
                  )}
                  {product.language && (
                    <tr>
                      <td className="pd-book-info-label">Ngôn ngữ</td>
                      <td className="pd-book-info-value">{product.language}</td>
                    </tr>
                  )}
                  {product.isbn && (
                    <tr>
                      <td className="pd-book-info-label">Mã ISBN</td>
                      <td className="pd-book-info-value">{product.isbn}</td>
                    </tr>
                  )}
                  {product.cover_type && (
                    <tr>
                      <td className="pd-book-info-label">Loại bìa</td>
                      <td className="pd-book-info-value">{product.cover_type}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="pd-divider"></div>

          {/* Variants Selection */}
          {/* Chọn biến thể: Loại bìa */}
          {sizes.length > 0 && (
            <div className="pd-variant-section">
              <h3 className="pd-variant-title">Loại bìa</h3>
              <div className="pd-variant-options">
                {sizes.map(size => (
                  <button
                    key={size}
                    className={`pd-variant-btn ${selectedSize === size ? 'pd-variant-btn-active' : ''}`}
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
            <div className="pd-variant-section">
              <h3 className="pd-variant-title">Phiên bản</h3>
              <div className="pd-variant-options">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`pd-variant-btn ${selectedColor === color ? 'pd-variant-btn-active' : ''}`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="pd-action-section">
            <div className="pd-quantity-control">
              <button
                className="pd-qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} />
              </button>
              <span className="pd-qty-text">{quantity}</span>
              <button
                className="pd-qty-btn"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={18} />
              </button>
            </div>

            <button className="pd-add-cart-btn" onClick={handleAddToCart}>
              <ShoppingBag size={20} />
              <span>Thêm vào giỏ hàng</span>
            </button>
            <button
              className="pd-fav-btn"
              style={{
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
      <div className="pd-reviews-section">
        <h2 className="pd-reviews-title">Đánh giá từ khách hàng ({reviews.length})</h2>

        {reviews.length === 0 ? (
          <p className="pd-no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <div className="pd-reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="pd-review-card">
                <div className="pd-review-header">
                  <div className="pd-reviewer-info">
                    <div className="pd-reviewer-avatar">
                      {review.users?.avatar ? (
                        <img src={review.users.avatar} alt={review.users.name} className="pd-avatar-img" />
                      ) : (
                        review.users?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <h4 className="pd-reviewer-name">{review.users?.name}</h4>
                      <div className="pd-review-stars">
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
                <p className="pd-review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
