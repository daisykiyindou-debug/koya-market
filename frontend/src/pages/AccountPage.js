import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, Gift, MapPin, Lock, LogOut, ChevronRight, Clock, Truck, CheckCircle, Copy, Check, Users, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AccountPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loyalty, setLoyalty] = useState({ points: 0, rewards_available: 0, next_reward_progress: 0 });
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(100);
  const [editingAddress, setEditingAddress] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/connexion');
      return;
    }

    // Determine active tab from URL
    const path = location.pathname.split('/').pop();
    if (['commandes', 'fidelite', 'adresses', 'securite', 'parrainage'].includes(path)) {
      setActiveTab(path);
    } else {
      setActiveTab('profile');
    }
  }, [location, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab, ordersPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'commandes' || activeTab === 'profile') {
        const ordersRes = await axios.get(`${API}/orders?page=${ordersPage}&per_page=5`, { headers: { Authorization: `Bearer ${token}` }});
        setOrders(ordersRes.data.orders || ordersRes.data);
        setOrdersTotalPages(ordersRes.data.total_pages || 1);
      }
      if (activeTab === 'fidelite' || activeTab === 'profile') {
        const loyaltyRes = await axios.get(`${API}/loyalty`, { headers: { Authorization: `Bearer ${token}` }});
        setLoyalty(loyaltyRes.data);
      }
      if (activeTab === 'adresses') {
        const addressesRes = await axios.get(`${API}/users/addresses`, { headers: { Authorization: `Bearer ${token}` }});
        setAddresses(addressesRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible de mettre à jour le profil.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Erreur', { description: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    try {
      await axios.put(`${API}/users/password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }, { headers: { Authorization: `Bearer ${token}` }});
      toast.success('Mot de passe modifié');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      const message = error.response?.data?.detail || 'Impossible de modifier le mot de passe.';
      toast.error('Erreur', { description: message });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await axios.delete(`${API}/users/addresses/${addressId}`, { headers: { Authorization: `Bearer ${token}` }});
      setAddresses(addresses.filter(a => a.address_id !== addressId));
      toast.success('Adresse supprimée');
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible de supprimer l\'adresse.' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'preparing': return <Package className="w-5 h-5" />;
      case 'delivering': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'delivering': return 'En livraison';
      case 'delivered': return 'Livrée';
      default: return status;
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Mon profil', icon: User, path: '/compte' },
    { id: 'commandes', label: 'Mes commandes', icon: Package, path: '/compte/commandes' },
    { id: 'fidelite', label: 'Programme fidélité', icon: Gift, path: '/compte/fidelite' },
    { id: 'parrainage', label: 'Parrainage', icon: Users, path: '/compte/parrainage' },
    { id: 'adresses', label: 'Mes adresses', icon: MapPin, path: '/compte/adresses' },
    { id: 'securite', label: 'Sécurité', icon: Lock, path: '/compte/securite' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container-custom">
        <h1 className="font-heading text-3xl font-semibold mb-8">Mon compte</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3 p-3">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="bg-white rounded-2xl p-2">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === item.id ? 'bg-primary text-white' : 'hover:bg-muted'
                  }`}
                  data-testid={`menu-${item.id}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                data-testid="logout-menu-btn"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Commandes</p>
                    <p className="font-heading text-3xl font-semibold">{orders.length}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Points fidélité</p>
                    <p className="font-heading text-3xl font-semibold text-secondary">{loyalty.points}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Récompenses</p>
                    <p className="font-heading text-3xl font-semibold text-primary">{loyalty.rewards_available}</p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="bg-white rounded-2xl p-6">
                  <h2 className="font-heading text-xl font-semibold mb-4">Informations personnelles</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="form-label">Nom complet</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        className="form-input"
                        data-testid="profile-name-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="form-input bg-muted"
                      />
                    </div>
                    <div>
                      <label className="form-label">Téléphone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="form-input"
                        data-testid="profile-phone-input"
                      />
                    </div>
                    <Button type="submit" className="btn-primary" data-testid="update-profile-btn">
                      Enregistrer
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'commandes' && (
              <>
              <div className="bg-white rounded-2xl p-6" data-testid="orders-tab">
                <h2 className="font-heading text-xl font-semibold mb-4">Mes commandes</h2>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune commande</p>
                    <Button onClick={() => navigate('/catalogue')} className="mt-4">
                      Découvrir nos produits
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.order_id}
                        className={`border rounded-xl p-4 ${order.status === 'cancelled' ? 'opacity-50 bg-muted/30' : ''}`}
                        data-testid={`order-${order.order_id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{order.order_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                          <span className={`order-status ${order.status}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{getStatusLabel(order.status)}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {order.items.length} article(s)
                            </p>
                            {(order.status === 'delivering') && order.driver_name && (
                              <p className="text-sm text-muted-foreground">
                                Livreur : {order.driver_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <p className="font-semibold">{order.total.toFixed(2)}€</p>
                            {order.status === 'pending' && (() => {
                              const deliveryDate = new Date(order.delivery_date);
                              const hoursUntil = (deliveryDate - new Date()) / (1000 * 60 * 60);
                              return hoursUntil > 48;
                            })() && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={(e) => { e.stopPropagation(); setCancelConfirm(order); }}
                                data-testid={`cancel-order-${order.order_id}`}
                              >
                                Annuler
                              </Button>
                            )}
                            {order.status === 'cancelled' && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Annulée</span>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/commande/${order.order_id}`)}
                              data-testid={`track-order-${order.order_id}`}
                            >
                              {order.status === 'cancelled' ? 'Voir détails' : 'Suivre'}
                            </Button>
                          </div>
                        </div>
                        {order.status === 'cancelled' && (
                          <div className="mt-3 pt-3 border-t border-red-200/50 text-xs text-red-700 space-y-1">
                            {order.cancelled_at && (
                              <p>Annulée le {format(new Date(order.cancelled_at), 'dd MMMM yyyy', { locale: fr })}</p>
                            )}
                            <p>Remboursement de <strong>{order.total.toFixed(2)}€</strong> sous 10 jours ouvrés.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {ordersTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button variant="outline" size="sm" disabled={ordersPage <= 1} onClick={() => { setOrdersPage(p => p - 1); }}>
                      Précédent
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {ordersPage} / {ordersTotalPages}</span>
                    <Button variant="outline" size="sm" disabled={ordersPage >= ordersTotalPages} onClick={() => { setOrdersPage(p => p + 1); }}>
                      Suivant
                    </Button>
                  </div>
                )}
              </div>

              {/* Cancel Confirmation Dialog */}
              {cancelConfirm && (
                <Dialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Annuler la commande ?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="mb-4">Êtes-vous sûr de vouloir annuler la commande <strong>{cancelConfirm?.order_id}</strong> ?</p>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <p className="text-sm text-amber-800 font-medium">Remboursement</p>
                        <p className="text-sm text-amber-700 mt-1">Le remboursement de <strong>{cancelConfirm?.total?.toFixed(2)}€</strong> sera effectué sous 10 jours ouvrés sur votre carte de paiement.</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-800 font-medium">Points de fidélité</p>
                        <p className="text-sm text-red-700 mt-1">Vous perdrez <strong>{Math.floor(cancelConfirm?.subtotal || cancelConfirm?.total || 0)} points</strong> de fidélité associés à cette commande.</p>
                      </div>
                    </div>
                    <DialogFooter className="flex gap-3">
                      <Button variant="outline" onClick={() => setCancelConfirm(null)}>Non, garder ma commande</Button>
                      <Button 
                        variant="destructive"
                        onClick={async () => {
                          try {
                            const res = await axios.post(`${API}/orders/${cancelConfirm.order_id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` }});
                            toast.success('Commande annulée', { description: `${res.data.points_deducted} points de fidélité déduits. Remboursement sous 10 jours.` });
                            setCancelConfirm(null);
                            fetchData();
                          } catch (err) {
                            toast.error('Erreur', { description: err.response?.data?.detail || 'Impossible d\'annuler.' });
                            setCancelConfirm(null);
                          }
                        }}
                        data-testid="confirm-cancel-btn"
                      >
                        Oui, annuler
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </>
            )}

            {/* Loyalty Tab */}
            {activeTab === 'fidelite' && (
              <div className="space-y-6" data-testid="loyalty-tab">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="w-8 h-8" />
                    <h2 className="font-heading text-2xl font-semibold">Programme Fidélité</h2>
                  </div>
                  <p className="text-white/80 mb-6">1€ dépensé = 1 point • 100 points = 5€ de réduction</p>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white/70 text-sm">Vos points</p>
                        <p className="font-heading text-4xl font-bold">{loyalty.points}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/70 text-sm">Récompenses disponibles</p>
                        <p className="font-heading text-4xl font-bold">{loyalty.rewards_available}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progression vers la prochaine récompense</span>
                        <span>{loyalty.next_reward_progress}/100 points</span>
                      </div>
                      <Progress value={loyalty.next_reward_progress} className="h-3" />
                    </div>
                  </div>
                </div>

                {/* Generate Loyalty Code */}
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold mb-4">Générer un code de réduction</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choisissez le nombre de points à convertir. Chaque tranche de 100 points = 5€ de réduction.
                  </p>

                  {loyalty.points >= 100 && (
                    <div className="mb-4">
                      <label className="form-label">Points à utiliser</label>
                      <select
                        value={loyaltyPointsToUse}
                        onChange={(e) => setLoyaltyPointsToUse(parseInt(e.target.value))}
                        className="form-input"
                        data-testid="loyalty-points-select"
                      >
                        {Array.from({ length: Math.floor(loyalty.points / 100) }, (_, i) => (i + 1) * 100).map(pts => (
                          <option key={pts} value={pts}>
                            {pts} points = {((pts / 100) * 5).toFixed(0)}€ de réduction
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    className="btn-secondary w-full py-5"
                    disabled={loyalty.points < 100 || generatingCode}
                    onClick={async () => {
                      setGeneratingCode(true);
                      try {
                        const response = await axios.post(`${API}/loyalty/generate-code`, { points_to_use: loyaltyPointsToUse }, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        setGeneratedCodes(prev => [response.data, ...prev]);
                        toast.success('Code généré !', { description: response.data.message });
                        const loyaltyRes = await axios.get(`${API}/loyalty`, { headers: { Authorization: `Bearer ${token}` }});
                        setLoyalty(loyaltyRes.data);
                        setLoyaltyPointsToUse(100);
                      } catch (error) {
                        const message = error.response?.data?.detail || 'Impossible de générer le code.';
                        toast.error('Erreur', { description: message });
                      } finally {
                        setGeneratingCode(false);
                      }
                    }}
                    data-testid="generate-loyalty-code-btn"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    {loyalty.points < 100
                      ? `Il vous manque ${100 - loyalty.points} points`
                      : generatingCode
                        ? 'Génération...'
                        : `Générer un code de ${((loyaltyPointsToUse / 100) * 5).toFixed(0)}€ (${loyaltyPointsToUse} points)`
                    }
                  </Button>

                  {/* Display Generated Codes */}
                  {generatedCodes.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="text-sm font-medium">Vos codes générés :</h4>
                      {generatedCodes.map((gc, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                          <div>
                            <p className="font-mono font-semibold text-primary">{gc.code}</p>
                            <p className="text-xs text-muted-foreground">Valeur : {gc.value.toFixed(2)}€</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(gc.code);
                              setCopiedCode(gc.code);
                              toast.success('Code copié !');
                              setTimeout(() => setCopiedCode(null), 2000);
                            }}
                            data-testid={`copy-code-${index}`}
                          >
                            {copiedCode === gc.code ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold mb-4">Comment ça marche ?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Achetez vos produits préférés</p>
                        <p className="text-sm text-muted-foreground">Chaque euro dépensé vous rapporte 1 point</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Cumulez 100 points</p>
                        <p className="text-sm text-muted-foreground">Générez un code de réduction de 5€ depuis cette page</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Entrez le code dans le panier</p>
                        <p className="text-sm text-muted-foreground">Collez votre code dans le champ "Code fidélité" du panier pour appliquer la réduction</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'adresses' && (
              <div className="bg-white rounded-2xl p-6" data-testid="addresses-tab">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl font-semibold">Mes adresses</h2>
                  <Button onClick={() => navigate('/checkout')} variant="outline" size="sm">
                    Ajouter une adresse
                  </Button>
                </div>
                
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune adresse enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.address_id} className="border rounded-xl p-4 flex items-start justify-between">
                        <div>
                          <p className="font-medium">{address.label}</p>
                          <p className="text-sm text-muted-foreground">{address.street}</p>
                          <p className="text-sm text-muted-foreground">{address.postal_code} {address.city}</p>
                          {address.door_number && <p className="text-sm text-muted-foreground">Porte : {address.door_number}</p>}
                          {address.digicode && <p className="text-sm text-muted-foreground">Digicode : {address.digicode}</p>}
                          {address.floor && <p className="text-sm text-muted-foreground">Étage : {address.floor}</p>}
                          {address.is_default && (
                            <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Par défaut</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingAddress({...address})} data-testid={`edit-addr-${address.address_id}`}>
                            Modifier
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAddress(address.address_id)}>
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Address Dialog */}
                {editingAddress && (
                  <Dialog open={!!editingAddress} onOpenChange={() => setEditingAddress(null)}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Modifier l'adresse</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await axios.put(`${API}/users/addresses/${editingAddress.address_id}`, {
                            label: editingAddress.label,
                            street: editingAddress.street,
                            city: editingAddress.city,
                            postal_code: editingAddress.postal_code,
                            door_number: editingAddress.door_number || '',
                            digicode: editingAddress.digicode || '',
                            floor: editingAddress.floor || '',
                            elevator: editingAddress.elevator || false,
                            is_default: editingAddress.is_default || false
                          }, { headers: { Authorization: `Bearer ${token}` }});
                          toast.success('Adresse modifiée');
                          setEditingAddress(null);
                          fetchData();
                        } catch (err) {
                          toast.error('Erreur', { description: 'Impossible de modifier l\'adresse.' });
                        }
                      }} className="space-y-3">
                        <div>
                          <label className="form-label">Nom</label>
                          <input type="text" value={editingAddress.label} onChange={(e) => setEditingAddress({...editingAddress, label: e.target.value})} className="form-input" required />
                        </div>
                        <div>
                          <label className="form-label">Adresse</label>
                          <input type="text" value={editingAddress.street} onChange={(e) => setEditingAddress({...editingAddress, street: e.target.value})} className="form-input" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="form-label">Code postal</label>
                            <input type="text" value={editingAddress.postal_code} onChange={(e) => setEditingAddress({...editingAddress, postal_code: e.target.value})} className="form-input" required />
                          </div>
                          <div>
                            <label className="form-label">Ville</label>
                            <input type="text" value={editingAddress.city} onChange={(e) => setEditingAddress({...editingAddress, city: e.target.value})} className="form-input" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="form-label">N° porte</label>
                            <input type="text" value={editingAddress.door_number || ''} onChange={(e) => setEditingAddress({...editingAddress, door_number: e.target.value})} className="form-input" />
                          </div>
                          <div>
                            <label className="form-label">Digicode</label>
                            <input type="text" value={editingAddress.digicode || ''} onChange={(e) => setEditingAddress({...editingAddress, digicode: e.target.value})} className="form-input" />
                          </div>
                          <div>
                            <label className="form-label">Étage</label>
                            <input type="text" value={editingAddress.floor || ''} onChange={(e) => setEditingAddress({...editingAddress, floor: e.target.value})} className="form-input" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={editingAddress.elevator || false} onChange={(e) => setEditingAddress({...editingAddress, elevator: e.target.checked})} className="rounded" />
                          <span className="text-sm">Ascenseur</span>
                        </label>
                        <Button type="submit" className="w-full btn-primary">Enregistrer</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'securite' && (
              <div className="bg-white rounded-2xl p-6" data-testid="security-tab">
                <h2 className="font-heading text-xl font-semibold mb-4">Modifier le mot de passe</h2>
                
                {user?.password === null ? (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Vous êtes connecté via Google. Le mot de passe ne peut pas être modifié.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="form-label">Mot de passe actuel</label>
                      <input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                        className="form-input"
                        required
                        data-testid="current-password-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        className="form-input"
                        required
                        minLength={6}
                        data-testid="new-password-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        className="form-input"
                        required
                        data-testid="confirm-password-input"
                      />
                    </div>
                    <Button type="submit" className="btn-primary" data-testid="change-password-btn">
                      Modifier le mot de passe
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Referral Tab */}
            {activeTab === 'parrainage' && (
              <div className="space-y-6" data-testid="referral-tab">
                <ReferralSection token={token} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReferralSection = ({ token }) => {
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/referral`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setReferralInfo(res.data))
        .catch(() => {});
    }
  }, [token]);

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) return;
    setApplying(true);
    try {
      const res = await axios.post(`${API}/referral/apply`, { referral_code: referralCode }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Parrainage appliqué !', { description: res.data.message });
      setReferralCode('');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Code de parrainage invalide';
      toast.error('Erreur', { description: msg });
    } finally {
      setApplying(false);
    }
  };

  const handleCopyCode = () => {
    if (referralInfo?.referral_code) {
      navigator.clipboard.writeText(referralInfo.referral_code);
      setCopied(true);
      toast.success('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-secondary to-secondary/80 text-white rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-8 h-8" />
          <h2 className="font-heading text-2xl font-semibold">Parrainage</h2>
        </div>
        <p className="text-white/80 mb-6">
          Invitez vos amis et gagnez chacun 200 points de fidélité après leur 1er achat !
        </p>
        
        {referralInfo && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <p className="text-white/70 text-sm mb-2">Votre code de parrainage</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-wider" data-testid="referral-code">
                {referralInfo.referral_code}
              </span>
              <Button variant="ghost" size="icon" onClick={handleCopyCode} className="text-white hover:bg-white/20">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-white/60 text-sm mt-3">
              {referralInfo.referrals_count} ami(s) parrainé(s)
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Utiliser un code de parrainage</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Un ami vous a partagé son code ? Entrez-le ci-dessous. Les 200 points seront crédités après votre 1ère commande.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Code KOYA-XXXXXX"
            className="flex-1 form-input"
            data-testid="apply-referral-input"
          />
          <Button onClick={handleApplyReferral} disabled={applying || !referralCode.trim()} className="btn-primary" data-testid="apply-referral-btn">
            {applying ? '...' : 'Appliquer'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Comment ça marche ?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
              <span className="font-semibold text-secondary">1</span>
            </div>
            <div>
              <p className="font-medium">Partagez votre code</p>
              <p className="text-sm text-muted-foreground">Envoyez votre code de parrainage à vos amis</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
              <span className="font-semibold text-secondary">2</span>
            </div>
            <div>
              <p className="font-medium">Votre ami s'inscrit</p>
              <p className="text-sm text-muted-foreground">Il entre votre code dans son espace Mon Compte</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
              <span className="font-semibold text-secondary">3</span>
            </div>
            <div>
              <p className="font-medium">Vous gagnez tous les deux !</p>
              <p className="text-sm text-muted-foreground">Chacun reçoit 200 points de fidélité après le 1er achat</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountPage;
