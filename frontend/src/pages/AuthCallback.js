import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { processOAuthSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        toast.error('Erreur d\'authentification', { description: 'Session invalide.' });
        navigate('/connexion');
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        await processOAuthSession(sessionId);
        toast.success('Connexion réussie !', { description: 'Bienvenue sur KÔYA Market.' });
        // Clear hash and navigate to dashboard
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Erreur de connexion', { description: 'Impossible de terminer la connexion.' });
        navigate('/connexion');
      }
    };

    processAuth();
  }, [navigate, processOAuthSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
