import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Connexion réussie !', { description: 'Bienvenue sur KÔYA Market.' });
      } else {
        await register(formData.name, formData.email, formData.password, formData.phone);
        toast.success('Compte créé !', { description: 'Bienvenue sur KÔYA Market.' });
      }
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.detail || 'Une erreur est survenue.';
      toast.error('Erreur', { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <span className="font-heading text-3xl font-semibold text-primary">KÔYA</span>
            <span className="font-heading text-xl text-secondary ml-1">Market</span>
          </Link>
          <p className="text-muted-foreground mt-2">Les saveurs afro-caribéennes livrées chez vous</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="font-heading text-2xl font-semibold text-center mb-2">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            {isLogin ? 'Accédez à votre compte KÔYA Market' : 'Rejoignez KÔYA Market'}
          </p>

          {/* Google Login */}
          <Button 
            variant="outline" 
            className="w-full mb-6 py-6"
            onClick={handleGoogleLogin}
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="form-label">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jean Dupont"
                      className="form-input pl-10"
                      required={!isLogin}
                      data-testid="register-name-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Téléphone (optionnel)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      className="form-input pl-10"
                      data-testid="register-phone-input"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemple.com"
                  className="form-input pl-10"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input pl-10 pr-10"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full btn-primary py-6"
              disabled={loading}
              data-testid="submit-btn"
            >
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer mon compte')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? (
              <>
                Pas encore de compte ?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="text-primary font-medium hover:underline"
                  data-testid="toggle-to-register"
                >
                  S'inscrire
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button 
                  onClick={() => setIsLogin(true)}
                  className="text-primary font-medium hover:underline"
                  data-testid="toggle-to-login"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
