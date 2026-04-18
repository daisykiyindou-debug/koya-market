import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const GUEST_KEY = 'koya_guest_cart';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

const readGuestItems = () => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(i => i.product_id && i.quantity > 0) : [];
  } catch {
    return [];
  }
};

const writeGuestItems = (items) => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  } catch { /* quota */ }
};

export const CartProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, minimum_reached: false, amount_to_minimum: 50 });
  const [loading, setLoading] = useState(false);
  const mergedRef = useRef(false); // prevents double-merge on re-renders

  // Compute guest cart view from localStorage
  const refreshGuestCart = useCallback(async () => {
    const items = readGuestItems();
    if (items.length === 0) {
      setCart({ items: [], subtotal: 0, minimum_reached: false, amount_to_minimum: 50 });
      return;
    }
    try {
      const res = await axios.post(`${API}/cart/compute`, { items });
      setCart(res.data);
    } catch (e) {
      console.error('Failed to compute guest cart:', e);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // On auth change: merge guest cart OR load guest cart
  useEffect(() => {
    const sync = async () => {
      if (isAuthenticated && token) {
        const guestItems = readGuestItems();
        if (guestItems.length > 0 && !mergedRef.current) {
          mergedRef.current = true;
          try {
            const res = await axios.post(`${API}/cart/merge`,
              { items: guestItems },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setCart(res.data);
            localStorage.removeItem(GUEST_KEY);
          } catch (e) {
            console.error('Cart merge failed:', e);
            await fetchCart();
          }
        } else {
          await fetchCart();
        }
      } else {
        mergedRef.current = false;
        await refreshGuestCart();
      }
    };
    sync();
  }, [isAuthenticated, token, fetchCart, refreshGuestCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (isAuthenticated && token) {
      const response = await axios.post(`${API}/cart/add`,
        { product_id: productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data);
      return response.data;
    }
    // Guest mode
    const items = readGuestItems();
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ product_id: productId, quantity });
    }
    writeGuestItems(items);
    await refreshGuestCart();
  };

  const updateCartItem = async (productId, quantity) => {
    if (isAuthenticated && token) {
      const response = await axios.put(`${API}/cart/update`,
        { product_id: productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data);
      return response.data;
    }
    let items = readGuestItems();
    if (quantity <= 0) {
      items = items.filter(i => i.product_id !== productId);
    } else {
      const existing = items.find(i => i.product_id === productId);
      if (existing) existing.quantity = quantity;
      else items.push({ product_id: productId, quantity });
    }
    writeGuestItems(items);
    await refreshGuestCart();
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated && token) {
      const response = await axios.delete(`${API}/cart/item/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
      return response.data;
    }
    const items = readGuestItems().filter(i => i.product_id !== productId);
    writeGuestItems(items);
    await refreshGuestCart();
  };

  const clearCart = async () => {
    if (isAuthenticated && token) {
      await axios.delete(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart({ items: [], subtotal: 0, minimum_reached: false, amount_to_minimum: 50 });
      return;
    }
    localStorage.removeItem(GUEST_KEY);
    setCart({ items: [], subtotal: 0, minimum_reached: false, amount_to_minimum: 50 });
  };

  const addRecipeIngredients = async (recipeId, servings) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }
    const response = await axios.post(`${API}/cart/add-recipe-ingredients`,
      { recipe_id: recipeId, servings },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setCart(response.data);
    return response.data;
  };

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.subtotal || 0;

  const value = {
    cart,
    loading,
    cartItemCount,
    cartSubtotal,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    addRecipeIngredients,
    fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
