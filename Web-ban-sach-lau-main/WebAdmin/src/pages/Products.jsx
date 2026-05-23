import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  MoreVertical,
  Package,
  Store,
  DollarSign,
  Calendar,
  Edit
} from 'lucide-react';
import client from '../api/client';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Khai báo state lưu danh mục thực tế từ DB
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/admin/products');
      setProducts(data || []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await client.get('/admin/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Fetch danh mục khi load trang
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories]);

  // Sinh các lựa chọn danh mục cha - con trực quan
  const getCategoryOptions = () => {
    const parents = categories.filter(c => c.parent_id === null);
    const children = categories.filter(c => c.parent_id !== null);
    
    const parentMap = {};
    parents.forEach(p => { parentMap[p.id] = p.name; });

    const options = [];
    
    // Thêm danh mục con có định dạng Cha ➔ Con
    children.forEach(c => {
      const parentName = parentMap[c.parent_id] || 'Khác';
      options.push({ id: c.id, displayName: `${parentName} ➔ ${c.name}` });
    });

    // Thêm cả danh mục cha để dự phòng nếu admin muốn chọn
    parents.forEach(p => {
      options.push({ id: p.id, displayName: `[Chung] ${p.name}` });
    });

    return options.sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  const [confirmingId, setConfirmingId] = useState(null);

  const handleDelete = async (id) => {
    console.log('Admin: Delete step triggered for ID:', id);
    
    if (confirmingId !== id) {
      // Step 1: Set confirming state
      setConfirmingId(id);
      // Auto-reset confirming state after 3 seconds
      setTimeout(() => setConfirmingId(null), 3000);
      return;
    }

    // Step 2: Execute actual delete
    try {
      setDeletingId(id);
      console.log('Admin: Sending DELETE request to backend...');
      const response = await client.delete(`/admin/products/${id}`);
      console.log('Admin: Delete successful:', response.data);
      
      setProducts(prev => prev.filter(p => p.id !== id));
      // Reset states
      setConfirmingId(null);
    } catch (err) {
      console.error('Admin: Delete failed:', err);
      const errMsg = err.response?.data?.message || err.message;
      alert(`Lỗi: ${errMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    vip_price: '',
    description: '',
    image: '',
    category_id: 1,
    author: '',
    publisher: '',
    published_year: '',
    isbn: '',
    pages: '',
    language: 'Tiếng Việt',
    cover_type: ''
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      const { data } = await client.post('/admin/products', formData);
      setProducts(prev => [data, ...prev]);
      setShowModal(false);
      setFormData({
        name: '',
        price: '',
        vip_price: '',
        description: '',
        image: '',
        category_id: categories[0]?.id || 1,
        author: '',
        publisher: '',
        published_year: '',
        isbn: '',
        pages: '',
        language: 'Tiếng Việt',
        cover_type: ''
      });
      alert('Thêm sách thành công!');
    } catch (err) {
      console.error('Lỗi thêm sách:', err);
      alert('Không thể thêm sách');
    } finally {
      setAdding(false);
    }
  };

  // --- EDIT & VARIANTS LOGIC ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editTab, setEditTab] = useState('info'); // 'info' | 'variants'
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [newVariant, setNewVariant] = useState({ size: '', color: '', price: '', stock: '', image: '' });
  const [addingVariant, setAddingVariant] = useState(false);

  const openEditModal = (product) => {
    setEditingProduct({ ...product });
    setEditTab('info');
    setEditModalOpen(true);
    fetchVariants(product.id);
  };

  const fetchVariants = async (productId) => {
    setLoadingVariants(true);
    try {
      const { data } = await client.get(`/admin/products/${productId}/variants`);
      setVariants(data || []);
    } catch (err) {
      console.error('Lỗi tải biến thể:', err);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleUpdateProductInfo = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      const { data } = await client.put(`/admin/products/${editingProduct.id}`, editingProduct);
      setProducts(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
      alert('Cập nhật thành công!');
    } catch (err) {
      alert('Lỗi cập nhật sản phẩm');
    } finally {
      setAdding(false);
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    try {
      setAddingVariant(true);
      const { data } = await client.post(`/admin/products/${editingProduct.id}/variants`, newVariant);
      setVariants(prev => [...prev, data]);
      setNewVariant({ size: '', color: '', price: '', stock: '', image: '' });
    } catch (err) {
      alert('Lỗi thêm biến thể');
    } finally {
      setAddingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Bạn có chắc muốn xóa biến thể này?')) return;
    try {
      await client.delete(`/admin/variants/${variantId}`);
      setVariants(prev => prev.filter(v => v.id !== variantId));
    } catch (err) {
      alert('Lỗi xóa biến thể');
    }
  };
  // -----------------------------

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.author?.toLowerCase().includes(search.toLowerCase()) ||
    p.publisher?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Quản lý sách</h1>
          <p style={styles.subtitle}>Duyệt và quản lý toàn bộ sách trên hệ thống.</p>
        </div>
        
        <div style={styles.headerActions}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Tìm tên sách, tác giả, NXB..." 
              style={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <button style={styles.addBtn} onClick={() => setShowModal(true)}>
            + Thêm sách mới
          </button>
        </div>
      </header>

      <div style={styles.grid}>
        {loading ? (
          <div style={styles.loadingFull}>Đang tải danh sách sản phẩm...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyFull}>Không tìm thấy sản phẩm nào</div>
        ) : filteredProducts.map((product) => (
          <div key={product.id} style={styles.productCard}>
            <div style={styles.imageWrapper}>
              <img 
                src={product.image || 'https://via.placeholder.com/200'} 
                alt={product.name} 
                style={styles.image}
              />
              <div style={styles.priceTag}>
                {product.price?.toLocaleString()}₫
              </div>
            </div>
            
            <div style={styles.cardContent}>
              <h3 style={styles.productName} title={product.name}>{product.name}</h3>
              
              {product.author && (
                <div style={styles.infoRow}>
                  <span style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    ✍️ Tác giả: <strong>{product.author}</strong>
                  </span>
                </div>
              )}
              
              {product.publisher && (
                <div style={styles.infoRow}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    🏢 NXB: {product.publisher}
                  </span>
                </div>
              )}
              
              <div style={styles.infoRow}>
                <Calendar size={14} color="var(--text-muted)" />
                <span style={styles.dateText}>
                  Đăng ngày: {new Date(product.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div style={styles.actions}>
                <button 
                  style={{
                    ...styles.deleteBtn,
                    backgroundColor: confirmingId === product.id ? '#ef4444' : (deletingId === product.id ? '#fee2e2' : '#fee2e2'),
                    color: confirmingId === product.id ? '#fff' : '#ef4444',
                    opacity: deletingId === product.id ? 0.7 : 1,
                    cursor: deletingId === product.id ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  title="Xóa sách"
                >
                  <Trash2 size={18} />
                  <span>
                    {deletingId === product.id ? 'Đang xóa...' : (confirmingId === product.id ? 'Xác nhận xóa?' : 'Gỡ sách')}
                  </span>
                </button>
                
                <button 
                  style={styles.viewBtn}
                  onClick={() => openEditModal(product)}
                  title="Chỉnh sửa thông tin & Biến thể"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && ReactDOM.createPortal(
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ ...styles.modalContent, width: '680px', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            {/* Header cố định */}
            <div style={{ ...styles.modalHeader, marginBottom: '16px' }}>
              <h2 style={styles.modalTitle}>📖 Đăng sách mới</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Vùng cuộn chứa các nhóm trường */}
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* NHÓM 1: THÔNG TIN CƠ BẢN & GIÁ BÁN */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🛍️ Thông tin bán hàng
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Tên sách <span style={{ color: '#ef4444' }}>*</span></label>
                      <input 
                        type="text" 
                        required 
                        style={styles.input} 
                        placeholder="Ví dụ: Đắc Nhân Tâm, Nhà Giả Kim..."
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Giá bìa (₫) <span style={{ color: '#ef4444' }}>*</span></label>
                        <input 
                          type="number" 
                          required 
                          style={styles.input} 
                          placeholder="100000"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Giá VIP (₫ - nếu có)</label>
                        <input 
                          type="number" 
                          style={styles.input} 
                          placeholder="80000"
                          value={formData.vip_price}
                          onChange={(e) => setFormData({...formData, vip_price: e.target.value})}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Danh mục sách <span style={{ color: '#ef4444' }}>*</span></label>
                        <select 
                          style={styles.input}
                          value={formData.category_id}
                          onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})}
                        >
                          {getCategoryOptions().map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.displayName}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Link ảnh bìa sách</label>
                        <input 
                          type="url" 
                          style={styles.input} 
                          placeholder="https://images.unsplash.com/..."
                          value={formData.image}
                          onChange={(e) => setFormData({...formData, image: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* NHÓM 2: THÔNG TIN XUẤT BẢN & CHI TIẾT SÁCH */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📚 Chi tiết xuất bản & Quy cách
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Tác giả <span style={{ color: '#ef4444' }}>*</span></label>
                        <input 
                          type="text" 
                          required
                          style={styles.input} 
                          placeholder="Ví dụ: Paulo Coelho"
                          value={formData.author}
                          onChange={(e) => setFormData({...formData, author: e.target.value})}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Nhà xuất bản</label>
                        <input 
                          type="text" 
                          style={styles.input} 
                          placeholder="Ví dụ: NXB Trẻ"
                          value={formData.publisher}
                          onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Loại bìa chính</label>
                        <select 
                          style={styles.input}
                          value={formData.cover_type}
                          onChange={(e) => setFormData({...formData, cover_type: e.target.value})}
                        >
                          <option value="">-- Chọn loại bìa --</option>
                          <option value="Bìa mềm">Bìa mềm</option>
                          <option value="Bìa cứng">Bìa cứng</option>
                          <option value="Bìa gập">Bìa gập</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Mã ISBN</label>
                        <input 
                          type="text" 
                          style={styles.input} 
                          placeholder="Ví dụ: 9786041123456"
                          value={formData.isbn}
                          onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Số trang</label>
                        <input 
                          type="number" 
                          style={styles.input} 
                          placeholder="350"
                          value={formData.pages}
                          onChange={(e) => setFormData({...formData, pages: e.target.value})}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Năm xuất bản</label>
                        <input 
                          type="number" 
                          style={styles.input} 
                          placeholder="2024"
                          value={formData.published_year}
                          onChange={(e) => setFormData({...formData, published_year: e.target.value})}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Ngôn ngữ</label>
                        <input 
                          type="text" 
                          style={styles.input} 
                          value={formData.language}
                          onChange={(e) => setFormData({...formData, language: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* NHÓM 3: TÓM TẮT NỘI DUNG */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📝 Giới thiệu tác phẩm
                  </h3>
                  <div style={styles.formGroup}>
                    <textarea 
                      style={{...styles.input, height: '90px', resize: 'none'}} 
                      placeholder="Giới thiệu sơ lược về nội dung sách..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

              </div>

              {/* Nút Submit cố định ở chân modal */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#475569',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(227,102,49,0.2)'
                  }} 
                  disabled={adding}
                >
                  {adding ? 'Đang xử lý...' : 'Đăng sách mới'}
                </button>
              </div>

            </form>
          </div>
        </div>
      , document.body)}

      {/* EDIT PRODUCT & VARIANTS MODAL */}
      {editModalOpen && editingProduct && ReactDOM.createPortal(
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setEditModalOpen(false); }}>
          <div style={{ ...styles.modalContent, width: '700px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Quản lý: {editingProduct.name}</h2>
              <button style={styles.closeBtn} onClick={() => setEditModalOpen(false)}>&times;</button>
            </div>

            {/* TABS */}
            <div style={styles.tabContainer}>
              <button 
                style={{ ...styles.tabBtn, borderBottom: editTab === 'info' ? '2px solid var(--primary)' : 'none', color: editTab === 'info' ? 'var(--primary)' : 'var(--text-muted)' }}
                onClick={() => setEditTab('info')}
              >
                Thông tin cơ bản
              </button>
              <button 
                style={{ ...styles.tabBtn, borderBottom: editTab === 'variants' ? '2px solid var(--primary)' : 'none', color: editTab === 'variants' ? 'var(--primary)' : 'var(--text-muted)' }}
                onClick={() => setEditTab('variants')}
              >
                Biến thể & Tồn kho
              </button>
            </div>

            {/* TAB: INFO */}
            {editTab === 'info' && (
              <form onSubmit={handleUpdateProductInfo} style={{ ...styles.form, maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tên sách</label>
                  <input 
                    type="text" 
                    required 
                    style={styles.input} 
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  />
                </div>
                
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tác giả</label>
                    <input 
                      type="text" 
                      required 
                      style={styles.input} 
                      value={editingProduct.author || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, author: e.target.value})}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nhà xuất bản</label>
                    <input 
                      type="text" 
                      style={styles.input} 
                      value={editingProduct.publisher || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, publisher: e.target.value})}
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Giá bìa (₫)</label>
                    <input 
                      type="number" 
                      required 
                      style={styles.input} 
                      value={editingProduct.price || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Giá VIP (₫ - nếu có)</label>
                    <input 
                      type="number" 
                      style={styles.input} 
                      value={editingProduct.vip_price || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, vip_price: e.target.value})}
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Danh mục sách</label>
                    <select 
                      style={styles.input}
                      value={editingProduct.category_id || (categories[0]?.id || 1)}
                      onChange={(e) => setEditingProduct({...editingProduct, category_id: parseInt(e.target.value)})}
                    >
                      {getCategoryOptions().map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Loại bìa chính</label>
                    <select 
                      style={styles.input}
                      value={editingProduct.cover_type || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, cover_type: e.target.value})}
                    >
                      <option value="">-- Chọn loại bìa --</option>
                      <option value="Bìa mềm">Bìa mềm</option>
                      <option value="Bìa cứng">Bìa cứng</option>
                      <option value="Bìa gập">Bìa gập</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mã ISBN</label>
                    <input 
                      type="text" 
                      style={styles.input} 
                      value={editingProduct.isbn || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, isbn: e.target.value})}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Số trang</label>
                    <input 
                      type="number" 
                      style={styles.input} 
                      value={editingProduct.pages || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, pages: e.target.value})}
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Năm xuất bản</label>
                    <input 
                      type="number" 
                      style={styles.input} 
                      value={editingProduct.published_year || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, published_year: e.target.value})}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Ngôn ngữ</label>
                    <input 
                      type="text" 
                      style={styles.input} 
                      value={editingProduct.language || 'Tiếng Việt'}
                      onChange={(e) => setEditingProduct({...editingProduct, language: e.target.value})}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Link ảnh bìa sách</label>
                  <input 
                    type="url" 
                    style={styles.input} 
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Tóm tắt / Mô tả sách</label>
                  <textarea 
                    style={{...styles.input, height: '80px', resize: 'none'}} 
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  />
                </div>

                <button type="submit" style={styles.submitBtn} disabled={adding}>
                  {adding ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            )}

            {/* TAB: VARIANTS */}
            {editTab === 'variants' && (
              <div>
                {/* List variants */}
                <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                  {loadingVariants ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</p>
                  ) : variants.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phiên bản nào.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Loại bìa</th>
                          <th style={{ padding: '8px' }}>Phiên bản</th>
                          <th style={{ padding: '8px' }}>Giá bìa</th>
                          <th style={{ padding: '8px' }}>Tồn kho</th>
                          <th style={{ padding: '8px' }}>Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map(v => (
                          <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px' }}>{v.size || '-'}</td>
                            <td style={{ padding: '8px' }}>{v.color || '-'}</td>
                            <td style={{ padding: '8px' }}>{v.price ? `${v.price.toLocaleString()}₫` : '-'}</td>
                            <td style={{ padding: '8px' }}>{v.stock || 0}</td>
                            <td style={{ padding: '8px' }}>
                              <button onClick={() => handleDeleteVariant(v.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Add new variant form */}
                <h3 style={{ fontSize: '16px', marginBottom: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>Thêm phiên bản / Loại bìa mới</h3>
                <form onSubmit={handleAddVariant} style={styles.formRow}>
                  <input type="text" placeholder="Loại bìa (vd: Bìa cứng)" style={styles.input} value={newVariant.size} onChange={e => setNewVariant({...newVariant, size: e.target.value})} />
                  <input type="text" placeholder="Phiên bản (vd: Tái bản 2026)" style={styles.input} value={newVariant.color} onChange={e => setNewVariant({...newVariant, color: e.target.value})} />
                  <input type="number" placeholder="Giá lẻ (nếu khác)" style={styles.input} value={newVariant.price} onChange={e => setNewVariant({...newVariant, price: e.target.value})} />
                  <input type="number" required placeholder="Số lượng tồn kho" style={styles.input} value={newVariant.stock} onChange={e => setNewVariant({...newVariant, stock: e.target.value})} />
                  <button type="submit" style={{ ...styles.submitBtn, marginTop: 0 }} disabled={addingVariant}>
                    {addingVariant ? '...' : 'Thêm'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      , document.body)}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  title: { fontSize: '28px', fontWeight: '700' },
  subtitle: { color: 'var(--text-muted)', marginTop: '4px' },
  searchWrapper: {
    position: 'relative',
    width: '350px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    outline: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
    paddingBottom: '40px',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
  },
  imageWrapper: {
    position: 'relative',
    height: '180px',
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  priceTag: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  cardContent: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  productName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '44px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  shopName: {
    fontSize: '13px',
    color: 'var(--primary)',
    fontWeight: '500',
  },
  dateText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '16px',
  },
  deleteBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    padding: '8px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
  },
  viewBtn: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    color: 'var(--text-muted)',
    borderRadius: '10px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
  },
  loadingFull: { gridColumn: '1/-1', padding: '100px', textAlign: 'center', color: 'var(--text-muted)' },
  emptyFull: { gridColumn: '1/-1', padding: '100px', textAlign: 'center', color: 'var(--text-muted)' },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '500px',
    maxHeight: '90vh',
    borderRadius: '24px',
    padding: '30px',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
  },
  input: {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    outline: 'none',
    fontSize: '14px',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: '700',
    marginTop: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border)',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '10px 0',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};

export default Products;
