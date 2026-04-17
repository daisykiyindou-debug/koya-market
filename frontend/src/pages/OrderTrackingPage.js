import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Clock, CheckCircle, Package, Truck, MapPin, Star, Camera, Send, X, Gift } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [tracking, setTracking] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [driverInfoOpen, setDriverInfoOpen] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [productReviews, setProductReviews] = useState({});
  const [driverReview, setDriverReview] = useState({ rating: 5, comment: '' });
  const [submittingReviews, setSubmittingReviews] = useState(false);
  const [reviewsSubmitted, setReviewsSubmitted] = useState(false);
  const [existingReviews, setExistingReviews] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/connexion'); return; }
    fetchData();
    fetchExistingReviews();
    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
  }, [orderId, isAuthenticated]);

  useEffect(() => {
    if (tracking && !mapInitialized) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const timer = setTimeout(() => {
        if (typeof window.L !== 'undefined') initMap();
        else {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => initMap();
          document.head.appendChild(script);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [tracking, mapInitialized]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orderRes, trackingRes] = await Promise.all([
        axios.get(`${API}/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders/${orderId}/tracking`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setOrder(orderRes.data);
      setTracking(trackingRes.data);
    } catch (error) {
      console.error('Failed to fetch tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}/tracking`, { headers: { Authorization: `Bearer ${token}` } });
      setTracking(res.data);
    } catch (e) { /* silent */ }
  };

  const fetchExistingReviews = async () => {
    try {
      const res = await axios.get(`${API}/reviews/order/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      setExistingReviews(res.data);
      if (res.data.has_reviews) {
        setReviewsSubmitted(true);
      }
    } catch (e) { /* silent */ }
  };

  const fetchDriverInfo = async (driverName) => {
    try {
      const res = await axios.get(`${API}/driver/${encodeURIComponent(driverName)}/info`);
      setDriverInfo(res.data);
      setDriverInfoOpen(true);
    } catch (e) {
      toast.error('Erreur lors du chargement des infos livreur');
    }
  };

  const initMap = () => {
    const L = window.L;
    if (!L || !tracking) return;
    const mapEl = document.getElementById('tracking-map');
    if (!mapEl || mapEl._leaflet_id) return;

    const map = L.map('tracking-map').setView([tracking.driver_lat, tracking.driver_lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

    const driverIcon = L.divIcon({
      className: '',
      html: '<div style="width:44px;height:44px;background:#EA580C;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">🚗</div>',
      iconSize: [44, 44], iconAnchor: [22, 22]
    });
    L.marker([tracking.driver_lat, tracking.driver_lng], { icon: driverIcon }).addTo(map).bindPopup(`<strong>${tracking.driver_name}</strong>`);
    setMapInitialized(true);
  };

  const getProgressPercent = () => {
    if (!tracking) return 0;
    const done = tracking.steps.filter(s => s.done).length;
    return (done / tracking.steps.length) * 100;
  };

  const handleSubmitReviews = async () => {
    // Validate minimum characters
    for (const [productId, review] of Object.entries(productReviews)) {
      if (review.rating > 0 && (!review.comment || review.comment.trim().length < 20)) {
        toast.error('Avis trop court', { description: `L'avis pour chaque produit doit contenir au moins 20 caractères.` });
        return;
      }
    }
    if (driverReview.rating > 0 && (!driverReview.comment || driverReview.comment.trim().length < 20)) {
      toast.error('Avis trop court', { description: "L'avis sur le livreur doit contenir au moins 20 caractères." });
      return;
    }

    setSubmittingReviews(true);
    let totalPoints = 0;
    try {
      for (const [productId, review] of Object.entries(productReviews)) {
        if (review.rating > 0 && review.comment.trim().length >= 20) {
          try {
            const res = await axios.post(`${API}/reviews`, {
              product_id: productId, rating: review.rating, comment: review.comment, image_urls: review.image_urls || [], order_id: orderId
            }, { headers: { Authorization: `Bearer ${token}` } });
            totalPoints += res.data.points_earned || 0;
          } catch (e) {
            // Skip if already reviewed
          }
        }
      }
      if (driverReview.rating > 0 && driverReview.comment.trim().length >= 20) {
        try {
          const res = await axios.post(`${API}/reviews/driver`, {
            order_id: orderId, rating: driverReview.rating, comment: driverReview.comment
          }, { headers: { Authorization: `Bearer ${token}` } });
          totalPoints += res.data.points_earned || 0;
        } catch (e) {
          // Skip if already reviewed
        }
      }
      toast.success(`Merci pour vos avis !`, { description: `Vous avez gagné ${totalPoints} points de fidélité.` });
      setReviewMode(false);
      setReviewsSubmitted(true);
      fetchExistingReviews();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi des avis');
    } finally {
      setSubmittingReviews(false);
    }
  };

  const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange(i)} className="focus:outline-none">
          <Star className={`w-6 h-6 transition-colors ${i <= value ? 'fill-secondary text-secondary' : 'text-muted'}`} />
        </button>
      ))}
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!tracking || !order) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-muted-foreground mb-4">Commande non trouvée</p><Button onClick={() => navigate('/compte/commandes')}>Retour</Button></div></div>;

  const isDelivered = tracking.status === 'delivered';
  const isCancelled = tracking.status === 'cancelled';
  const showDriver = tracking.status === 'delivering' || tracking.status === 'delivered';

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8">
        <Button variant="ghost" onClick={() => navigate('/compte/commandes')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Mes commandes
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Suivi de commande</h1>
            <p className="text-muted-foreground">{orderId}</p>
          </div>
          <span className={`order-status ${tracking.status}`} data-testid="tracking-status">
            {tracking.status === 'pending' && 'En attente'}
            {tracking.status === 'preparing' && 'En préparation'}
            {tracking.status === 'delivering' && 'En livraison'}
            {tracking.status === 'delivered' && 'Livrée'}
            {tracking.status === 'cancelled' && 'Annulée'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-6 border mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-primary font-medium">{isDelivered ? 'Livrée' : tracking.estimated_arrival}</span>
          </div>
          <Progress value={getProgressPercent()} className="h-3 mb-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {tracking.steps.map((step, i) => (
              <span key={i} className={step.done ? 'text-primary font-medium' : ''}>{step.label}</span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map + Driver */}
          <div className="lg:col-span-2 space-y-6">
            {!isDelivered && !isCancelled && showDriver && <div id="tracking-map" className="w-full h-[350px] rounded-2xl overflow-hidden border shadow-lg" data-testid="tracking-map" />}

            {/* Cancelled State */}
            {isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <X className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="font-heading text-xl font-semibold text-red-800 mb-2">Commande annulée</h3>
                {order.cancelled_at && (
                  <p className="text-sm text-red-700 mb-2">Annulée le {new Date(order.cancelled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
                <p className="text-sm text-red-600">Le remboursement de <strong>{order.total.toFixed(2)}€</strong> sera effectué sous 10 jours sur votre carte de paiement.</p>
              </div>
            )}

            {/* Driver Card - only when delivering or delivered */}
            {showDriver && (
            <div className="bg-white rounded-2xl p-6 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => fetchDriverInfo(tracking.driver_name)} className="relative" data-testid="driver-photo-btn">
                    <img src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100`} alt={tracking.driver_name} className="w-14 h-14 rounded-full object-cover border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity" />
                  </button>
                  <div>
                    <p className="font-semibold" data-testid="driver-name">{tracking.driver_name}</p>
                    <p className="text-sm text-muted-foreground">Votre livreur</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isDelivered && (
                    <>
                      <a href={`tel:${tracking.driver_phone}`} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors" data-testid="call-driver-btn">
                        <Phone className="w-5 h-5 text-primary" />
                      </a>
                      <a href={`sms:${tracking.driver_phone}`} className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center hover:bg-secondary/20 transition-colors" data-testid="message-driver-btn">
                        <MessageCircle className="w-5 h-5 text-secondary" />
                      </a>
                    </>
                  )}
                </div>
              </div>
              {!isDelivered && (
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground">Arrivée estimée</p>
                  <p className="font-heading text-2xl font-semibold text-primary" data-testid="eta">{tracking.estimated_arrival}</p>
                </div>
              )}
              {isDelivered && (
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-sm text-primary font-medium">Commande livrée avec succès</p>
                </div>
              )}
            </div>
            )}

            {/* Post-delivery: Review Section */}
            {isDelivered && !isCancelled && !reviewMode && !reviewsSubmitted && (
              <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-2xl p-6 border text-center">
                <Gift className="w-10 h-10 mx-auto text-secondary mb-3" />
                <h3 className="font-heading text-lg font-semibold mb-2">Donnez votre avis</h3>
                <p className="text-sm text-muted-foreground mb-4">Notez vos produits et votre livreur pour gagner <strong>5 points par avis</strong> (min. 20 caractères)</p>
                <Button className="btn-primary" onClick={() => setReviewMode(true)} data-testid="start-review-btn">
                  Donner mon avis
                </Button>
              </div>
            )}

            {isDelivered && !isCancelled && reviewsSubmitted && (
              <div className="bg-white rounded-2xl p-6 border">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="font-heading text-lg font-semibold text-green-800">Vos avis ont été enregistrés</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Merci ! Vos points fidélité ont été crédités. Les avis ne peuvent pas être modifiés.</p>
                
                {existingReviews?.product_reviews?.length > 0 && (
                  <div className="space-y-3">
                    {existingReviews.product_reviews.map((r, i) => (
                      <div key={i} className="bg-muted/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{order.items.find(it => it.product_id === r.product_id)?.name || r.product_id}</span>
                          <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-secondary text-secondary' : 'text-muted'}`} />)}</div>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.comment}</p>
                        {r.image_urls?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {r.image_urls.map((url, k) => <img key={k} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {existingReviews?.driver_review && (
                  <div className="bg-muted/30 rounded-xl p-4 mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">Livreur : {existingReviews.driver_review.driver_name}</span>
                      <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < existingReviews.driver_review.rating ? 'fill-secondary text-secondary' : 'text-muted'}`} />)}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">{existingReviews.driver_review.comment}</p>
                  </div>
                )}
              </div>
            )}

            {isDelivered && !isCancelled && reviewMode && (
              <div className="bg-white rounded-2xl p-6 border space-y-6">
                <h3 className="font-heading text-lg font-semibold">Notez votre commande</h3>

                {/* Product Reviews */}
                {order.items.map((item) => (
                  <div key={item.product_id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">+5 pts</span>
                    </div>
                    <StarRating
                      value={productReviews[item.product_id]?.rating || 0}
                      onChange={(r) => setProductReviews(prev => ({...prev, [item.product_id]: {...(prev[item.product_id] || {}), rating: r}}))}
                    />
                    <textarea
                      value={productReviews[item.product_id]?.comment || ''}
                      onChange={(e) => setProductReviews(prev => ({...prev, [item.product_id]: {...(prev[item.product_id] || {}), comment: e.target.value}}))}
                      placeholder="Votre avis sur ce produit (min. 20 caractères)..."
                      className="form-input mt-2 text-sm min-h-[60px]"
                      minLength={20}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${(productReviews[item.product_id]?.comment || '').length >= 20 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {(productReviews[item.product_id]?.comment || '').length}/20 caractères min.
                      </span>
                      <label className="flex items-center gap-1 text-xs text-primary cursor-pointer">
                        <Camera className="w-3 h-3" />
                        <span>Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files?.[0]) {
                            toast.info('Photo sélectionnée', { description: 'La photo sera jointe à votre avis.' });
                          }
                        }} />
                      </label>
                    </div>
                  </div>
                ))}

                {/* Driver Review */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">Note du livreur : {tracking.driver_name}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">+5 pts</span>
                  </div>
                  <StarRating value={driverReview.rating} onChange={(r) => setDriverReview(prev => ({...prev, rating: r}))} />
                  <textarea
                    value={driverReview.comment}
                    onChange={(e) => setDriverReview(prev => ({...prev, comment: e.target.value}))}
                    placeholder="Votre avis sur le livreur..."
                    className="form-input mt-2 text-sm min-h-[60px]"
                    data-testid="driver-review-input"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setReviewMode(false)}>Annuler</Button>
                  <Button className="flex-1 btn-primary" onClick={handleSubmitReviews} disabled={submittingReviews} data-testid="submit-reviews-btn">
                    {submittingReviews ? 'Envoi...' : 'Envoyer mes avis'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Items Recap */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-heading text-lg font-semibold mb-4">Votre commande</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{order.subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{order.delivery_fee === 0 ? 'Gratuit' : `${order.delivery_fee.toFixed(2)}€`}</span>
                  </div>
                  {order.loyalty_discount > 0 && (
                    <div className="flex justify-between text-sm text-secondary">
                      <span>Réduction fidélité</span>
                      <span>-{order.loyalty_discount.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Total</span>
                    <span className="text-primary">{order.total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-heading text-lg font-semibold mb-4">Livraison</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{order.delivery_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créneau</span>
                  <span>{order.delivery_slot}</span>
                </div>
                {order.address && (
                  <div className="pt-3 border-t">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="text-muted-foreground">
                        <p>{order.address.street}</p>
                        <p>{order.address.postal_code} {order.address.city}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Info Dialog */}
      <Dialog open={driverInfoOpen} onOpenChange={setDriverInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Infos livreur</DialogTitle>
          </DialogHeader>
          {driverInfo && (
            <div className="text-center">
              <img src={driverInfo.photo} alt={driverInfo.name} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary mb-4" />
              <h2 className="font-heading text-xl font-semibold">{driverInfo.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2 mb-4">
                <Star className="w-5 h-5 fill-secondary text-secondary" />
                <span className="font-semibold">{driverInfo.rating}</span>
                <span className="text-muted-foreground">({driverInfo.total_reviews} avis)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{driverInfo.total_deliveries} livraisons effectuées</p>

              {driverInfo.recent_reviews.length > 0 && (
                <div className="text-left">
                  <h3 className="font-medium text-sm mb-3">Derniers avis</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {driverInfo.recent_reviews.map((r, i) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{r.user_name}</span>
                          <div className="flex gap-0.5">{[...Array(r.rating)].map((_,j) => <Star key={j} className="w-3 h-3 fill-secondary text-secondary" />)}</div>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {driverInfo.recent_reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTrackingPage;
