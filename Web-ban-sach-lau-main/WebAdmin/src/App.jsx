import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Vouchers from './pages/Vouchers';
import Categories from './pages/Categories';
import ChatSupport from './pages/ChatSupport';
import ShipperPortal from './pages/ShipperPortal';
import './styles/index.css';

const ProtectedLayout = ({ children, requiredRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  // Cho phép các vai trò quản trị nội bộ truy cập WebAdmin
  const allowedRoles = ['admin', 'cskh', 'shipper', 'seller'];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  // Kiểm tra quyền truy cập route cụ thể
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    // Nếu không có quyền, đẩy về trang mặc định theo role
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'seller') return <Navigate to="/admin/products" />;
    if (user.role === 'cskh') return <Navigate to="/admin/orders" />;
    if (user.role === 'shipper') return <Navigate to="/admin/shipper" />;
    return <Navigate to="/login" />;
  }

  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.container}>
          {children}
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin / Operations Routes */}
          <Route path="/admin" element={
            <ProtectedLayout requiredRoles={['admin']}>
              <Dashboard />
            </ProtectedLayout>
          } />

          <Route path="/admin/users" element={
            <ProtectedLayout requiredRoles={['admin']}>
              <Users />
            </ProtectedLayout>
          } />
          
          <Route path="/admin/products" element={
            <ProtectedLayout requiredRoles={['admin', 'seller']}>
              <Products />
            </ProtectedLayout>
          } />

          <Route path="/admin/orders" element={
            <ProtectedLayout requiredRoles={['admin', 'seller', 'cskh']}>
              <Orders />
            </ProtectedLayout>
          } />

          <Route path="/admin/vouchers" element={
            <ProtectedLayout requiredRoles={['admin']}>
              <Vouchers />
            </ProtectedLayout>
          } />

          <Route path="/admin/categories" element={
            <ProtectedLayout requiredRoles={['admin', 'seller']}>
              <Categories />
            </ProtectedLayout>
          } />

          <Route path="/admin/chat" element={
            <ProtectedLayout requiredRoles={['admin', 'cskh']}>
              <ChatSupport />
            </ProtectedLayout>
          } />

          <Route path="/admin/shipper" element={
            <ProtectedLayout requiredRoles={['admin', 'shipper']}>
              <ShipperPortal />
            </ProtectedLayout>
          } />

          {/* Mặc định chuyển hướng vào admin hoặc login */}
          <Route path="/" element={<Navigate to="/admin" />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    backgroundColor: 'var(--bg)',
    minHeight: '100vh',
  },
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  }
};

export default App;
