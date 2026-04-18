import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertCircle, Tag, Gift, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, loading } = useCart();
  const { isAuthenticated, token } = useAuth();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const [loyaltyCode, setLoyaltyCode] = useState('');
  const [loyaltyApplied, setLoyaltyApplied] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const [loyaltyInfo, setLoyaltyInfo] = useState(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      axios.get(`${API}/loyalty`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setLoyaltyInfo(res.data))
        .catch(() => {});
    }
  }, [isAuthenticated, token]);

  const handleQuantityChange = async (productId, quantity) => {
    try {
      await updateCartItem(productId, quantity);
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible de mettre à jour la quantité.' });
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Produit retiré du panier');
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible de retirer le produit.' });
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const response = await axios.post(`${API}/promo/validate`, 
        { code: promoCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPromoApplied(response.data);
      toast.success('Code promo appliqué !', { description: response.data.description });
    } catch (error) {
      const message = error.response?.data?.detail || 'Code promo invalide';
      toast.error('Code invalide', { description: message });
      setPromoApplied(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
  };

  const handleApplyLoyalty = async () => {
    if (!loyaltyCode.trim()) return;
    setLoyaltyLoading(true);
    try {
      const response = await axios.post(`${API}/loyalty/redeem`,
        { code: loyaltyCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoyaltyApplied(response.data);
      toast.success('Code fidélité appliqué !', { description: response.data.message });
    } catch (error) {
      const message = error.response?.data?.detail || 'Code fidélité invalide';
      toast.error('Code invalide', { description: message });
      setLoyaltyApplied(null);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleRemoveLoyalty = () => {
    setLoyaltyApplied(null);
    setLoyaltyCode('');
  };

  // Compute discounts
  const promoDiscount = promoApplied
    ? promoApplied.discount_percent
      ? (cart.subtotal * promoApplied.discount_percent / 100)
      : (promoApplied.discount_amount || 0)
    : 0;
  const loyaltyDiscount = loyaltyApplied ? (loyaltyApplied.discount_amount || 0) : 0;
  const deliveryFee = cart.subtotal >= 80 ? 0 : 4.99;
  const totalBeforeDiscounts = cart.subtotal + deliveryFee;
  const totalAfterDiscounts = Math.max(0, totalBeforeDiscounts - promoDiscount - loyaltyDiscount);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="text-center max-w-md px-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl font-semibold mb-2">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour ajouter des produits et passer commande.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/connexion')} className="btn-primary" data-testid="login-to-cart-btn">
              Se connecter
            </Button>
            <Button onClick={() => navigate('/catalogue')} variant="outline">
              Parcourir le catalogue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="text-center max-w-md px-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl font-semibold mb-2">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-6">
            Découvrez nos produits afro-caribéens et commencez vos achats.
          </p>
          <Button onClick={() => navigate('/catalogue')} className="btn-primary" data-testid="browse-products-btn">
            Parcourir le catalogue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8 md:py-12">
        <h1 className="font-heading text-3xl font-semibold mb-8">Votre panier</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div 
                key={item.product_id}
                className="bg-white rounded-2xl border border-border p-4 md:p-6 flex gap-4"
                data-testid={`cart-item-${item.product_id}`}
              >
                {/* Image */}
                <img 
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover"
                />

                {/* Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-heading font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.product.origin_country}</p>
                    </div>
                    <button 
                      onClick={() => handleRemove(item.product_id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      data-testid={`remove-item-${item.product_id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        data-testid={`decrease-qty-${item.product_id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        data-testid={`increase-qty-${item.product_id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {item.total.toFixed(2)}€
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.product.price.toFixed(2)}€/{item.product.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="font-heading text-xl font-semibold mb-4">Récapitulatif</h2>

              {/* Minimum Warning */}
              {!cart.minimum_reached && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3" data-testid="minimum-warning">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Minimum de commande : 50€</p>
                    <p className="text-sm text-amber-700">
                      Ajoutez encore <span className="font-semibold">{cart.amount_to_minimum.toFixed(2)}€</span> pour atteindre le minimum.
                    </p>
                  </div>
                </div>
              )}

              {/* Promo Code */}
              <div className="mb-4 pb-4 border-b">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Tag className="w-4 h-4 text-secondary" />
                  Code promo
                </label>
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">{promoApplied.code}</span>
                      <span className="text-xs">({promoApplied.description})</span>
                    </div>
                    <button onClick={handleRemovePromo} className="text-xs text-red-500 hover:underline" data-testid="remove-promo-btn">
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Entrez votre code"
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
                      data-testid="promo-code-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      data-testid="apply-promo-btn"
                    >
                      {promoLoading ? '...' : 'Appliquer'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Loyalty Code */}
              <div className="mb-4 pb-4 border-b">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Gift className="w-4 h-4 text-primary" />
                  Code fidélité
                </label>
                
                {/* Loyalty Points Info Banner */}
                {loyaltyInfo && loyaltyInfo.points >= 100 && !loyaltyApplied && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-3" data-testid="loyalty-points-info">
                    <p className="text-sm text-primary font-medium">
                      Vous avez {loyaltyInfo.points} points de fidélité !
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vous pouvez bénéficier de -5€ de réduction en{' '}
                      <button onClick={() => navigate('/compte/fidelite')} className="text-primary underline font-medium">
                        générant votre code dans Fidélité
                      </button>
                    </p>
                  </div>
                )}
                {loyaltyInfo && loyaltyInfo.points > 0 && loyaltyInfo.points < 100 && !loyaltyApplied && (
                  <div className="bg-muted/50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-muted-foreground">
                      Vous avez {loyaltyInfo.points} points. Encore {100 - loyaltyInfo.points} points pour obtenir 5€ de réduction !
                    </p>
                  </div>
                )}

                {loyaltyApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">-{loyaltyApplied.discount_amount.toFixed(2)}€</span>
                    </div>
                    <button onClick={handleRemoveLoyalty} className="text-xs text-red-500 hover:underline" data-testid="remove-loyalty-btn">
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={loyaltyCode}
                      onChange={(e) => setLoyaltyCode(e.target.value)}
                      placeholder="Code FIDELITE-XXXXXXXX"
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
                      data-testid="loyalty-code-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyLoyalty}
                      disabled={loyaltyLoading || !loyaltyCode.trim()}
                      data-testid="apply-loyalty-btn"
                    >
                      {loyaltyLoading ? '...' : 'Appliquer'}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Générez votre code dans Mon Compte &gt; Fidélité
                </p>
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{cart.subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-medium">
                    {cart.subtotal >= 80 ? (
                      <span className="text-primary">Gratuite</span>
                    ) : (
                      '4,99€'
                    )}
                  </span>
                </div>
                {cart.subtotal < 80 && (
                  <p className="text-xs text-muted-foreground">
                    Livraison gratuite à partir de 80€
                  </p>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>Réduction promo</span>
                    <span>-{promoDiscount.toFixed(2)}€</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Réduction fidélité</span>
                    <span>-{loyaltyDiscount.toFixed(2)}€</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-heading text-xl font-semibold text-primary">
                      {totalAfterDiscounts.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                className="w-full btn-primary py-6"
                disabled={!cart.minimum_reached}
                onClick={() => navigate('/checkout')}
                data-testid="checkout-btn"
              >
                Passer la commande
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Continue Shopping */}
              <Link 
                to="/catalogue"
                className="block text-center text-sm text-muted-foreground hover:text-primary mt-4"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
