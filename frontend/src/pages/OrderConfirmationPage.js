import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Clock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/connexion'); return; }
    fetchOrder();
  }, [orderId, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrder(res.data);
    } catch (e) {
      console.error('Failed to fetch order:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Commande non trouvée</p></div>;

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container-custom max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-green-800 mb-2" data-testid="confirmation-title">
            Commande validée !
          </h1>
          <p className="text-muted-foreground">
            Merci pour votre commande. Vous recevrez un email de confirmation à <strong>{user?.email}</strong>
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl border p-6 md:p-8 mb-6">
          {/* Order Number */}
          <div className="flex items-center justify-between pb-4 border-b mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Numéro de commande</p>
              <p className="font-heading text-xl font-semibold text-primary" data-testid="order-number">{order.order_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Contenu de la commande
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm py-2 border-b border-dashed last:border-0">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-muted/30 rounded-xl p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{order.subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{order.delivery_fee === 0 ? 'Gratuit' : `${order.delivery_fee.toFixed(2)}€`}</span>
              </div>
              {order.loyalty_discount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Réduction fidélité</span>
                  <span>-{order.loyalty_discount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total payé</span>
                <span className="text-primary">{order.total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Livraison prévue</span>
              </div>
              <p className="text-sm">{order.delivery_date}</p>
              <p className="text-sm text-muted-foreground">{order.delivery_slot}</p>
            </div>
            {order.address && (
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Adresse</span>
                </div>
                <p className="text-sm">{order.address.street}</p>
                <p className="text-sm text-muted-foreground">{order.address.postal_code} {order.address.city}</p>
              </div>
            )}
          </div>
        </div>

        {/* Email Notification */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6 flex items-start gap-4">
          <Mail className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Email de confirmation envoyé</p>
            <p className="text-sm text-muted-foreground">
              Un récapitulatif de votre commande a été envoyé à <strong>{user?.email}</strong>. 
              Pensez à vérifier vos spams.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to={`/commande/${order.order_id}`} className="flex-1">
            <Button className="w-full btn-primary py-6" data-testid="track-order-btn">
              Suivre ma commande
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to="/compte/commandes" className="flex-1">
            <Button variant="outline" className="w-full py-6" data-testid="my-orders-btn">
              Mes commandes
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/catalogue" className="text-primary hover:underline">Continuer mes achats</Link>
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
