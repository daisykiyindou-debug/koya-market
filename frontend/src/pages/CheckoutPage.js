import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, Check, AlertCircle, Gift, Plus, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay, isToday, getHours } from 'date-fns';
import { fr } from 'date-fns/locale';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ALL_DELIVERY_SLOTS = [
  { value: '9h-12h', label: '9h - 12h', startHour: 9 },
  { value: '11h-14h', label: '11h - 14h', startHour: 11 },
  { value: '14h-17h', label: '14h - 17h', startHour: 14 },
  { value: '17h-20h', label: '17h - 20h', startHour: 17 },
  { value: '20h-23h', label: '20h - 23h', startHour: 20 },
];

// Some weekend slots are "full"
const FULL_SLOTS_WEEKENDS = ['11h-14h', '14h-17h'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const { user, token, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [loyalty, setLoyalty] = useState({ points: 0, rewards_available: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(addDays(new Date(), 1));
  const [deliverySlot, setDeliverySlot] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState('');

  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    postal_code: '',
    digicode: '',
    floor: '',
    door_number: '',
    elevator: false,
    is_default: false
  });
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/connexion');
      return;
    }
    
    if (!cart.minimum_reached) {
      navigate('/panier');
      return;
    }

    fetchAddresses();
    fetchLoyalty();
  }, [isAuthenticated, cart.minimum_reached, navigate]);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API}/users/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data);
      const defaultAddr = response.data.find(a => a.is_default) || response.data[0];
      if (defaultAddr) setSelectedAddress(defaultAddr.address_id);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const fetchLoyalty = async () => {
    try {
      const response = await axios.get(`${API}/loyalty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoyalty(response.data);
    } catch (error) {
      console.error('Failed to fetch loyalty:', error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/users/addresses`, newAddress, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses([...addresses, response.data]);
      setSelectedAddress(response.data.address_id);
      setShowAddressDialog(false);
      setNewAddress({ label: '', street: '', city: '', postal_code: '', digicode: '', floor: '', door_number: '', elevator: false, is_default: false });
      toast.success('Adresse ajoutée');
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible d\'ajouter l\'adresse.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedAddress || !deliveryDate || !deliverySlot) {
      toast.error('Informations manquantes', { description: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    setSubmitting(true);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await axios.post(`${API}/orders`, {
        address_id: selectedAddress,
        delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
        delivery_slot: deliverySlot,
        delivery_details: deliveryDetails,
        use_loyalty_points: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Paiement accepté !', { 
        description: `Commande ${response.data.order.order_id} confirmée. Merci pour votre achat !` 
      });
      
      await fetchCart();
      navigate('/compte/commandes');
    } catch (error) {
      const message = error.response?.data?.detail || 'Impossible de passer la commande.';
      toast.error('Paiement refusé', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAddressData = addresses.find(a => a.address_id === selectedAddress);
  const deliveryFee = cart.subtotal >= 80 ? 0 : 4.99;
  const total = cart.subtotal + deliveryFee;

  const steps = [
    { number: 1, title: 'Adresse', icon: MapPin },
    { number: 2, title: 'Livraison', icon: Clock },
    { number: 3, title: 'Paiement', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8">
        {/* Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 md:gap-4">
            {steps.map((s, index) => (
              <React.Fragment key={s.number}>
                <div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    step >= s.number ? 'bg-primary text-white' : 'bg-white text-muted-foreground'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span className="hidden md:inline font-medium">{s.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6" data-testid="step-address">
                <h2 className="font-heading text-xl font-semibold mb-4">Adresse de livraison</h2>

                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Aucune adresse enregistrée</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {addresses.map((address) => (
                      <label
                        key={address.address_id}
                        className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          selectedAddress === address.address_id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            value={address.address_id}
                            checked={selectedAddress === address.address_id}
                            onChange={(e) => setSelectedAddress(e.target.value)}
                            className="mt-1"
                            data-testid={`address-${address.address_id}`}
                          />
                          <div>
                            <p className="font-medium">{address.label}</p>
                            <p className="text-sm text-muted-foreground">{address.street}</p>
                            <p className="text-sm text-muted-foreground">{address.postal_code} {address.city}</p>
                            {address.digicode && (
                              <p className="text-sm text-muted-foreground">Digicode: {address.digicode}</p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Add Address Dialog */}
                <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="add-address-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une adresse
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle adresse</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAddress} className="space-y-4">
                      <div>
                        <label className="form-label">Nom de l'adresse</label>
                        <input
                          type="text"
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                          placeholder="Ex: Domicile, Bureau"
                          className="form-input"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label">Adresse</label>
                        <input
                          type="text"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                          placeholder="Numéro et rue"
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Code postal</label>
                          <input
                            type="text"
                            value={newAddress.postal_code}
                            onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                            placeholder="75001"
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Ville</label>
                          <input
                            type="text"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            placeholder="Paris"
                            className="form-input"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Digicode</label>
                          <input
                            type="text"
                            value={newAddress.digicode}
                            onChange={(e) => setNewAddress({...newAddress, digicode: e.target.value})}
                            placeholder="1234A"
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">Numéro de porte</label>
                          <input
                            type="text"
                            value={newAddress.door_number}
                            onChange={(e) => setNewAddress({...newAddress, door_number: e.target.value})}
                            placeholder="Apt 12"
                            className="form-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">Étage</label>
                          <input
                            type="text"
                            value={newAddress.floor}
                            onChange={(e) => setNewAddress({...newAddress, floor: e.target.value})}
                            placeholder="3ème"
                            className="form-input"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAddress.elevator}
                          onChange={(e) => setNewAddress({...newAddress, elevator: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Ascenseur disponible</span>
                      </label>
                      <Button type="submit" className="w-full btn-primary" disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Ajouter l\'adresse'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button 
                  className="w-full mt-6 btn-primary"
                  disabled={!selectedAddress}
                  onClick={() => setStep(2)}
                  data-testid="next-step-btn"
                >
                  Continuer
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Delivery */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6" data-testid="step-delivery">
                <h2 className="font-heading text-xl font-semibold mb-4">Date et créneau de livraison</h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="form-label">Date de livraison</label>
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      disabled={(date) => isBefore(date, startOfDay(new Date()))}
                      locale={fr}
                      className="rounded-xl border"
                      data-testid="delivery-calendar"
                    />
                  </div>
                  <div>
                    <label className="form-label">Créneau horaire</label>
                    <div className="space-y-2">
                      {ALL_DELIVERY_SLOTS.map((slot) => {
                        const selectedIsToday = deliveryDate && isToday(deliveryDate);
                        const currentHour = getHours(new Date());
                        const isPast = selectedIsToday && slot.startHour <= currentHour;
                        const isWeekend = deliveryDate && (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6);
                        const isFull = isWeekend && FULL_SLOTS_WEEKENDS.includes(slot.value);
                        const isDisabled = isPast || isFull;

                        return (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => !isDisabled && setDeliverySlot(slot.value)}
                            disabled={isDisabled}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                              deliverySlot === slot.value
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : isDisabled
                                  ? 'border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50'
                                  : 'border-border hover:border-primary/50'
                            }`}
                            data-testid={`slot-${slot.value}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{slot.label}</span>
                              {isPast && <span className="text-xs text-muted-foreground">Passé</span>}
                              {isFull && !isPast && <span className="text-xs text-red-500">Complet</span>}
                              {deliverySlot === slot.value && <Check className="w-4 h-4 text-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6">
                      <label className="form-label">Instructions de livraison (optionnel)</label>
                      <textarea
                        value={deliveryDetails}
                        onChange={(e) => setDeliveryDetails(e.target.value)}
                        placeholder="Ex: Sonner 2 fois, laisser chez le gardien..."
                        className="form-input min-h-[100px]"
                        data-testid="delivery-details-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button 
                    className="flex-1 btn-primary"
                    disabled={!deliverySlot}
                    onClick={() => setStep(3)}
                    data-testid="next-step-btn"
                  >
                    Continuer
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-6" data-testid="step-payment">
                <h2 className="font-heading text-xl font-semibold mb-4">Paiement</h2>

                <div className="mb-6 p-4 bg-primary/5 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="font-medium">Codes promo et fidélité</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Les codes promo et fidélité peuvent être appliqués directement dans le panier avant de passer commande.
                  </p>
                </div>

                {/* Simulated Payment Form */}
                <div className="border rounded-xl p-6 mb-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <span className="font-medium">Carte bancaire</span>
                  </div>
                  <div>
                    <label className="form-label">Numéro de carte</label>
                    <input type="text" defaultValue="4242 4242 4242 4242" className="form-input" readOnly data-testid="card-number" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Date d'expiration</label>
                      <input type="text" defaultValue="12/28" className="form-input" readOnly />
                    </div>
                    <div>
                      <label className="form-label">CVV</label>
                      <input type="text" defaultValue="123" className="form-input" readOnly />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Mode démo — Aucune transaction réelle</p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Retour
                  </Button>
                  <Button 
                    className="flex-1 btn-primary py-6"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    data-testid="confirm-order-btn"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Paiement en cours...
                      </span>
                    ) : `Payer ${total.toFixed(2)}€`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24">
              <h3 className="font-heading text-lg font-semibold mb-4">Récapitulatif</h3>

              {/* Address */}
              {selectedAddressData && (
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm font-medium mb-1">Livraison à</p>
                  <p className="text-sm text-muted-foreground">{selectedAddressData.street}</p>
                  <p className="text-sm text-muted-foreground">{selectedAddressData.postal_code} {selectedAddressData.city}</p>
                </div>
              )}

              {/* Delivery */}
              {deliveryDate && deliverySlot && (
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm font-medium mb-1">Créneau</p>
                  <p className="text-sm text-muted-foreground">
                    {format(deliveryDate, 'EEEE d MMMM', { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">{deliverySlot}</p>
                </div>
              )}

              {/* Items */}
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm font-medium mb-2">{cart.items.length} article(s)</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}x {item.product.name}</span>
                      <span>{item.total.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{cart.subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{deliveryFee === 0 ? 'Gratuit' : `${deliveryFee.toFixed(2)}€`}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-heading text-xl font-semibold text-primary">
                    {total.toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
