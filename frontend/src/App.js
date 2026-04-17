import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import RecipesPage from './pages/RecipesPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import ContactPage from './pages/ContactPage';
import CareersPage from './pages/CareersPage';
import LegalPage from './pages/LegalPage';
import DeliveryZonePage from './pages/DeliveryZonePage';
import OrderTrackingPage from './pages/OrderTrackingPage';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  return children;
};

// App Router with OAuth callback handling
const AppRouter = () => {
  const location = useLocation();

  // CRITICAL: Handle OAuth callback synchronously during render
  // to prevent race conditions with ProtectedRoute
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/catalogue" element={<Layout><CataloguePage /></Layout>} />
      <Route path="/recettes" element={<Layout><RecipesPage /></Layout>} />
      <Route path="/recettes/:recipeId" element={<Layout><RecipesPage /></Layout>} />
      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/carrieres" element={<Layout><CareersPage /></Layout>} />
      <Route path="/carrieres/:jobId" element={<Layout><CareersPage /></Layout>} />
      <Route path="/zones-livraison" element={<Layout><DeliveryZonePage /></Layout>} />
      <Route path="/cgv" element={<Layout><LegalPage type="cgv" /></Layout>} />
      <Route path="/confidentialite" element={<Layout><LegalPage type="confidentialite" /></Layout>} />
      <Route path="/mentions-legales" element={<Layout><LegalPage type="mentions-legales" /></Layout>} />

      {/* Auth Routes */}
      <Route path="/connexion" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected Routes */}
      <Route path="/panier" element={<Layout><CartPage /></Layout>} />
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
            <Layout><CheckoutPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/compte" 
        element={
          <ProtectedRoute>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/compte/commandes" 
        element={
          <ProtectedRoute>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/compte/fidelite" 
        element={
          <ProtectedRoute>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/compte/adresses" 
        element={
          <ProtectedRoute>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/compte/parrainage" 
        element={
          <ProtectedRoute>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/compte/securite" 
        element={
          <ProtectedRoute>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/commande/:orderId" 
        element={
          <ProtectedRoute>
            <Layout><OrderTrackingPage /></Layout>
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
