import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, MapPin, Info } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEPARTMENTS = [
  { code: "75", name: "Paris", coverage: "complete", color: "#043F2E" },
  { code: "92", name: "Hauts-de-Seine", coverage: "complete", color: "#065f46" },
  { code: "93", name: "Seine-Saint-Denis", coverage: "complete", color: "#065f46" },
  { code: "94", name: "Val-de-Marne", coverage: "complete", color: "#065f46" },
  { code: "91", name: "Essonne", coverage: "complete", color: "#065f46" },
  { code: "77", name: "Seine-et-Marne", coverage: "partial", color: "#EA580C" },
  { code: "78", name: "Yvelines", coverage: "partial", color: "#EA580C" },
  { code: "95", name: "Val-d'Oise", coverage: "partial", color: "#EA580C" },
];

const DeliveryZonePage = () => {
  const [postcode, setPostcode] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    // Small delay then init map
    const timer = setTimeout(() => {
      initMap();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      document.head.removeChild(link);
    };
  }, []);

  const initMap = () => {
    if (typeof window.L === 'undefined') {
      // Load leaflet script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => createMap();
      document.head.appendChild(script);
    } else {
      createMap();
    }
  };

  const createMap = () => {
    const L = window.L;
    if (!L || mapLoaded) return;

    const map = L.map('delivery-map').setView([48.8566, 2.3522], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Add circles for departments
    const departmentCoords = {
      "75": { lat: 48.8566, lng: 2.3522, radius: 5000 },
      "92": { lat: 48.8400, lng: 2.2300, radius: 6000 },
      "93": { lat: 48.9100, lng: 2.4800, radius: 6000 },
      "94": { lat: 48.7800, lng: 2.4700, radius: 6000 },
      "91": { lat: 48.6300, lng: 2.3000, radius: 8000 },
      "77": { lat: 48.8400, lng: 2.7500, radius: 7000 },
      "78": { lat: 48.8000, lng: 2.0500, radius: 7000 },
      "95": { lat: 49.0500, lng: 2.3000, radius: 7000 },
    };

    DEPARTMENTS.forEach(dept => {
      const coords = departmentCoords[dept.code];
      if (coords) {
        const circle = L.circle([coords.lat, coords.lng], {
          color: dept.color,
          fillColor: dept.color,
          fillOpacity: 0.2,
          radius: coords.radius,
          weight: 2
        }).addTo(map);
        
        circle.bindPopup(`<strong>${dept.name} (${dept.code})</strong><br/>Couverture : ${dept.coverage === 'complete' ? 'Complète' : 'Partielle'}`);
      }
    });

    setMapLoaded(true);
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!postcode.trim()) return;

    setChecking(true);
    try {
      const response = await axios.post(`${API}/delivery-zone/check`, { postcode });
      setResult(response.data);
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="container-custom text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4">Zones de livraison</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            KÔYA Market livre à Paris et en Île-de-France. Vérifiez si votre code postal est couvert.
          </p>
        </div>
      </div>

      <div className="container-custom py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div id="delivery-map" className="w-full h-[500px] rounded-2xl overflow-hidden border border-border shadow-lg" data-testid="delivery-map" />
            
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 mt-4 p-4 bg-white rounded-xl border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <span className="text-sm">Couverture complète</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-secondary" />
                <span className="text-sm">Couverture partielle</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Zone Checker */}
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="font-heading text-lg font-semibold mb-4">Vérifiez votre code postal</h2>
              <form onSubmit={handleCheck} className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Ex: 75011, 92100..."
                    className="form-input pl-10"
                    maxLength={5}
                    data-testid="zone-page-input"
                  />
                </div>
                <Button type="submit" className="w-full btn-primary" disabled={checking} data-testid="zone-page-check-btn">
                  {checking ? 'Vérification...' : 'Vérifier'}
                </Button>
              </form>

              {result && (
                <div className={`mt-4 p-4 rounded-xl ${result.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`} data-testid="zone-page-result">
                  {result.eligible ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">Zone éligible !</p>
                        <p className="text-sm text-green-700">
                          Nous livrons au {postcode} ({result.coverage === 'complete' ? 'couverture complète' : 'couverture partielle'})
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">Zone non couverte</p>
                        <p className="text-sm text-red-700">
                          {result.error || result.message || "Désolé, nous ne livrons pas encore dans cette zone."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Department List */}
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="font-heading text-lg font-semibold mb-4">Départements couverts</h2>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Couverture complète
                </h3>
                <div className="space-y-2">
                  {DEPARTMENTS.filter(d => d.coverage === 'complete').map(dept => (
                    <div key={dept.code} className="flex items-center gap-2 text-sm p-2 bg-primary/5 rounded-lg">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{dept.name} ({dept.code})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-secondary mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Couverture partielle
                </h3>
                <div className="space-y-2">
                  {DEPARTMENTS.filter(d => d.coverage === 'partial').map(dept => (
                    <div key={dept.code} className="flex items-center gap-2 text-sm p-2 bg-secondary/5 rounded-lg">
                      <MapPin className="w-4 h-4 text-secondary" />
                      <span>{dept.name} ({dept.code})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryZonePage;
