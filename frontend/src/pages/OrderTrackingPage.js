import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Clock, CheckCircle, Package, Truck, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [tracking, setTracking] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/connexion'); return; }
    fetchData();
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
        if (typeof window.L !== 'undefined') {
          initMap();
        } else {
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
    } catch (error) { /* silent */ }
  };

  const initMap = () => {
    const L = window.L;
    if (!L || !tracking) return;

    const mapEl = document.getElementById('tracking-map');
    if (!mapEl || mapEl._leaflet_id) return;

    const map = L.map('tracking-map').setView([tracking.driver_lat, tracking.driver_lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

    const driverIcon = L.divIcon({
      className: 'driver-marker',
      html: '<div style="width:40px;height:40px;background:#EA580C;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚗</div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    L.marker([tracking.driver_lat, tracking.driver_lng], { icon: driverIcon })
      .addTo(map)
      .bindPopup(`<strong>${tracking.driver_name}</strong><br/>Votre livreur`);

    setMapInitialized(true);
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'pending': return <CheckCircle className="w-5 h-5" />;
      case 'preparing': return <Package className="w-5 h-5" />;
      case 'delivering': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tracking || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Commande non trouvée</p>
          <Button onClick={() => navigate('/compte/commandes')}>Retour aux commandes</Button>
        </div>
      </div>
    );
  }

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
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map + Driver */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div id="tracking-map" className="w-full h-[400px] rounded-2xl overflow-hidden border shadow-lg" data-testid="tracking-map" />

            {/* Driver Info */}
            <div className="bg-white rounded-2xl p-6 border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  🚗
                </div>
                <div>
                  <p className="font-semibold" data-testid="driver-name">{tracking.driver_name}</p>
                  <p className="text-sm text-muted-foreground">Votre livreur</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Arrivée estimée</p>
                <p className="font-heading text-xl font-semibold text-primary" data-testid="eta">
                  {tracking.estimated_arrival}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline + Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-heading text-lg font-semibold mb-4">Progression</h3>
              <div className="space-y-0">
                {tracking.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.done ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {getStepIcon(step.status)}
                      </div>
                      {index < tracking.steps.length - 1 && (
                        <div className={`w-0.5 h-10 ${step.done ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className={`font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 border">
              <h3 className="font-heading text-lg font-semibold mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{order.delivery_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créneau</span>
                  <span>{order.delivery_slot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Articles</span>
                  <span>{order.items.length} produit(s)</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">{order.total.toFixed(2)}€</span>
                </div>
              </div>

              {/* Address */}
              {order.address && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p>{order.address.street}</p>
                      <p>{order.address.postal_code} {order.address.city}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Driver */}
              <div className="mt-4 pt-4 border-t">
                <a href={`tel:${tracking.driver_phone}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{tracking.driver_phone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
