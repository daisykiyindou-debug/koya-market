import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemCount, cartSubtotal } = useCart();

  const navLinks = [
    { name: 'Catalogue', path: '/catalogue' },
    { name: 'Recettes', path: '/recettes' },
    { name: 'Qui sommes-nous', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-heading text-2xl md:text-3xl font-semibold text-primary">
              KÔYA
            </span>
            <span className="font-heading text-lg md:text-xl text-secondary font-medium">
              Market
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              to="/koya-pro"
              className="nav-link text-secondary font-semibold"
            >
              KÔYA Pro
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              data-testid="search-toggle-btn"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link
              to="/panier"
              className="relative p-2 rounded-full hover:bg-muted transition-colors flex items-center gap-1"
              data-testid="cart-btn"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartSubtotal > 0 && (
                <span className="text-sm font-semibold text-primary" data-testid="cart-price">
                  {cartSubtotal.toFixed(2)}€
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted transition-colors" data-testid="user-menu-btn">
                    {user?.picture ? (
                      <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/compte" data-testid="my-account-link">Mon compte</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/compte/commandes" data-testid="my-orders-link">Mes commandes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/compte/fidelite" data-testid="loyalty-link">Programme fidélité</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/compte/parrainage" data-testid="referral-link">Parrainage</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/connexion">
                <Button variant="outline" size="sm" className="hidden md:flex" data-testid="login-btn">
                  Connexion
                </Button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors md:hidden">
                  <User className="w-5 h-5" />
                </button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-muted transition-colors lg:hidden"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="pb-4 animate-fade-in">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="form-input pr-12"
                autoFocus
                data-testid="search-input"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary"
                data-testid="search-submit-btn"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : 'closed'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <span className="font-heading text-2xl font-semibold text-primary">KÔYA</span>
              <span className="font-heading text-lg text-secondary ml-1">Market</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-lg py-2 ${location.pathname === link.path ? 'text-primary font-semibold' : ''}`}
              >
                {link.name}
              </Link>
            ))}
            <Link 
              to="/koya-pro"
              className="text-lg py-2 text-secondary font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              KÔYA Market Pro
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
