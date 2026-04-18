import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, minimum_reached: false, amount_to_minimum: 50 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({ items: [], subtotal: 0, minimum_reached: false, amount_to_minimum: 50 });
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }

    try {
      const response = await axios.post(`${API}/cart/add`, 
        { product_id: productId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.put(`${API}/cart/update`,
        { product_id: productId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.delete(`${API}/cart/item/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      await axios.delete(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setCart({ items: [], subtotal: 0, minimum_reached: false, amount_to_minimum: 50 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const addRecipeIngredients = async (recipeId, servings) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }

    try {
      const response = await axios.post(`${API}/cart/add-recipe-ingredients`,
        { recipe_id: recipeId, servings },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to add recipe ingredients:', error);
      throw error;
    }
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
