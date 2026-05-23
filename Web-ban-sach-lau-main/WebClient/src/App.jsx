import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import CustomerLayout from './components/CustomerLayout';
import StoreHome from './pages/StoreHome';
import SignUp from './pages/SignUp';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import Checkout from './pages/Checkout';
import Vouchers from './pages/Vouchers';
import ScrollToTop from './components/ScrollToTop';
import './styles/index.css';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<CustomerLayout><StoreHome /></CustomerLayout>} />
            <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
            <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
            <Route path="/product/:id" element={<CustomerLayout><ProductDetail /></CustomerLayout>} />
            <Route path="/orders" element={<CustomerLayout><OrderHistory /></CustomerLayout>} />
            <Route path="/orders/:id" element={<CustomerLayout><OrderDetail /></CustomerLayout>} />
            <Route path="/profile" element={<CustomerLayout><Profile /></CustomerLayout>} />
            <Route path="/categories" element={<CustomerLayout><Categories /></CustomerLayout>} />
            <Route path="/vouchers" element={<CustomerLayout><Vouchers /></CustomerLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
