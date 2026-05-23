import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const toast = useToast();
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState([]);
  const [loadedUser, setLoadedUser] = useState(null);

  // Load cart when user changes
  useEffect(() => {
    const userId = user && user.id ? user.id : 'guest';
    const key = `omnimart_cart_${userId}`;
    const saved = localStorage.getItem(key);
    setCartItems(saved ? JSON.parse(saved) : []);
    setLoadedUser(userId);
  }, [user]);

  // Save cart when cartItems changes, but only if the current user matches loadedUser
  useEffect(() => {
    const userId = user && user.id ? user.id : 'guest';
    if (loadedUser === userId) {
      const key = `omnimart_cart_${userId}`;
      localStorage.setItem(key, JSON.stringify(cartItems));
    }
  }, [cartItems, user, loadedUser]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    if (toast) toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => 
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
