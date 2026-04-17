import React, { useState } from 'react';
import { Send, Briefcase, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const POSITIONS = [
  { id: 'livreur', title: 'Livreur', location: 'Paris & IDF', type: 'CDI / Temps partiel' },
  { id: 'preparateur', title: 'Préparateur de commandes', location: 'Paris', type: 'CDI' },
  { id: 'marketing', title: 'Chargé(e) Marketing Digital', location: 'Paris', type: 'CDI' },
  { id: 'dev', title: 'Développeur Full Stack', location: 'Remote', type: 'CDI' },
  { id: 'sav', title: 'Conseiller Service Client', location: 'Paris', type: 'CDI / CDD' },
];

const CareersPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate submission
    setTimeout(() => {
      toast.success('Candidature envoyée !', { description: 'Nous examinerons votre profil et vous recontacterons.' });
      setFormData({ name: '', email: '', phone: '', position: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-white py-16">
        <div className="container-custom text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4">Rejoignez l'équipe KÔYA</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Participez à l'aventure KÔYA Market et contribuez à rendre les produits afro-caribéens accessibles à tous.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Job Listings */}
          <div>
            <h2 className="font-heading text-2xl font-semibold mb-6">Nos offres d'emploi</h2>
            <div className="space-y-4">
              {POSITIONS.map((position) => (
                <div key={position.id} className="bg-white rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-semibold mb-2">{position.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {position.type}
                        </span>
                      </div>
                    </div>
                    <Briefcase className="w-10 h-10 text-primary/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8">
            <h2 className="font-heading text-2xl font-semibold mb-6">Postuler</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Nom complet *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                  data-testid="career-name-input"
                />
              </div>
              
              <div>
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                  required
                  data-testid="career-email-input"
                />
              </div>

              <div>
                <label className="form-label">Téléphone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                  required
                  data-testid="career-phone-input"
                />
              </div>

              <div>
                <label className="form-label">Poste souhaité *</label>
                <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                  <SelectTrigger data-testid="career-position-select">
                    <SelectValue placeholder="Sélectionnez un poste" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.title}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Candidature spontanée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="form-label">Message / Motivation</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="form-input"
                  placeholder="Parlez-nous de vous..."
                  data-testid="career-message-input"
                />
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  CV et lettre de motivation (facultatif)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC jusqu'à 5MB
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary py-6"
                disabled={loading || !formData.position}
                data-testid="career-submit-btn"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer ma candidature'}
                <Send className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </div>
        </div>

        {/* Why Join Us */}
        <div className="mt-16">
          <h2 className="font-heading text-2xl font-semibold text-center mb-8">Pourquoi rejoindre KÔYA ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Mission porteuse de sens', description: 'Contribuez à valoriser les cultures afro-caribéennes.' },
              { title: 'Équipe dynamique', description: 'Rejoignez une équipe passionnée et multiculturelle.' },
              { title: 'Croissance rapide', description: 'Évoluez dans une startup en pleine expansion.' },
              { title: 'Environnement flexible', description: 'Télétravail partiel et horaires flexibles.' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 text-center">
                <h3 className="font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;
