import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Layers, 
  Plus, 
  Tag, 
  Image as ImageIcon, 
  Type,
  X,
  Trash2
} from 'lucide-react';
import client from '../api/client';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: '', description: '' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/admin/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await client.post('/admin/categories', formData);
      setCategories([...categories, data]);
      setShowModal(false);
      setFormData({ name: '', icon: '', description: '' });
      alert('Thêm danh mục thành công!');
    } catch (err) {
      alert('Không thể thêm danh mục');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Tất cả sản phẩm thuộc danh mục cũng sẽ bị xóa.')) return;
    try {
      await client.delete(`/admin/categories/${id}`);
      setCategories(categories.filter(cat => cat.id !== id));
      alert('Xóa danh mục thành công!');
    } catch (err) {
      console.error('Lỗi xóa danh mục:', err);
      alert('Không thể xóa danh mục');
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Quản lý Danh mục</h1>
          <p style={styles.subtitle}>Phân loại sách để khách hàng dễ dàng tìm kiếm.</p>
        </div>
        
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Thêm danh mục</span>
        </button>
      </header>

      <div style={styles.grid}>
        {loading ? (
          <div style={styles.loadingTd}>Đang tải danh mục...</div>
        ) : categories.length === 0 ? (
          <div style={styles.emptyTd}>Chưa có danh mục nào</div>
        ) : categories.map((cat) => (
          <div key={cat.id} style={styles.card}>
            <div style={styles.catIcon}>
              <Layers size={24} color="#fff" />
            </div>
            <div style={styles.catInfo}>
              <h3 style={styles.catName}>{cat.name}</h3>
              <p style={styles.catDesc}>{cat.description || 'Chưa có mô tả'}</p>
            </div>
            <div style={styles.catBadge}>#{cat.id}</div>
            <button 
              onClick={() => handleDelete(cat.id)}
              style={styles.deleteBtn}
              title="Xóa danh mục"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showModal && ReactDOM.createPortal(
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{fontSize: '20px'}}>Thêm danh mục mới</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Tên danh mục</label>
                <div style={styles.inputWrapper}>
                  <Type size={18} style={styles.icon} />
                  <input 
                    type="text" 
                    placeholder="VD: Văn học, Khoa học, Ngoại ngữ..." 
                    style={styles.input}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Link Icon (Image URL)</label>
                <div style={styles.inputWrapper}>
                  <ImageIcon size={18} style={styles.icon} />
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    style={styles.input}
                    value={formData.icon}
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Mô tả</label>
                <textarea 
                  style={{...styles.input, height: '100px', paddingLeft: '12px', resize: 'none'}}
                  placeholder="Mô tả ngắn gọn về danh mục..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" style={styles.submitBtn}>Tạo danh mục</button>
            </form>
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
    alignItems: 'flex-end',
    marginBottom: '30px',
  },
  title: { fontSize: '28px', fontWeight: '700' },
  subtitle: { color: 'var(--text-muted)', marginTop: '4px' },
  addBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '12px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    position: 'relative',
  },
  catIcon: {
    width: '56px',
    height: '56px',
    backgroundColor: 'var(--primary)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
  },
  catInfo: { flex: 1 },
  catName: { fontSize: '18px', fontWeight: '700', color: 'var(--text)' },
  catDesc: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
  catBadge: { position: 'absolute', top: '12px', right: '12px', fontSize: '12px', fontWeight: '700', color: '#e2e8f0' },
  deleteBtn: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    borderRadius: '24px',
    padding: '32px',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-lg)',
    overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: 'var(--text)' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '12px', color: 'var(--text-muted)' },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    fontSize: '15px',
    outline: 'none',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
  },
  loadingTd: { gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' },
  emptyTd: { gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }
};

export default Categories;
