import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Linkedin, Mail, MapPin, Phone, Send } from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubscribing(true);
    try {
      await axios.post(`${API}/newsletter`, { email });
      toast.success('Inscription réussie !', { description: 'Merci de vous être inscrit à notre newsletter.' });
      setEmail('');
    } catch (error) {
      toast.error('Erreur', { description: 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setSubscribing(false);
    }
  };

  const footerLinks = {
    navigation: [
      { name: 'Accueil', path: '/' },
      { name: 'Catalogue', path: '/catalogue' },
      { name: 'Recettes', path: '/recettes' },
      { name: 'Qui sommes-nous', path: '/about' },
    ],
    compte: [
      { name: 'Mon compte', path: '/compte' },
      { name: 'Mes commandes', path: '/compte/commandes' },
      { name: 'Programme fidélité', path: '/compte/fidelite' },
      { name: 'Panier', path: '/panier' },
    ],
    aide: [
      { name: 'Contact', path: '/contact' },
      { name: 'FAQ', path: '/contact#faq' },
      { name: 'KÔYA Market Pro', path: '/koya-pro' },
    ],
    legal: [
      { name: 'CGV', path: '/cgv' },
      { name: 'Politique de confidentialité', path: '/confidentialite' },
      { name: 'Mentions légales', path: '/mentions-legales' },
      { name: 'Carrières', path: '/carrieres' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, url: 'https://facebook.com/koyamarket', label: 'Facebook' },
    { icon: Instagram, url: 'https://instagram.com/koyamarket', label: 'Instagram' },
    { icon: Youtube, url: 'https://youtube.com/koyamarket', label: 'YouTube' },
    { icon: Linkedin, url: 'https://linkedin.com/company/koyamarket', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-primary text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container-custom py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading text-2xl font-semibold mb-2">
                Restez informé
              </h3>
              <p className="text-white/70">
                Recevez nos offres exclusives et nos nouvelles recettes
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-secondary w-full md:w-72"
                data-testid="newsletter-email-input"
              />
              <Button 
                type="submit" 
                className="btn-primary px-6"
                disabled={subscribing}
                data-testid="newsletter-submit-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="mb-6">
              <span className="font-heading text-3xl font-semibold">KÔYA</span>
              <span className="font-heading text-xl text-secondary ml-1">Market</span>
            </div>
            <p className="text-white/70 mb-6 max-w-xs">
              Les saveurs afro-caraïbéennes livrées chez vous en 3 heures.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-secondary" />
                <span>Paris et Île-de-France</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Phone className="w-5 h-5 text-secondary" />
                <span>01 23 45 67 89</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Navigation</h4>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/70 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compte */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Mon compte</h4>
            <ul className="space-y-3">
              {footerLinks.compte.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/70 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Aide</h4>
            <ul className="space-y-3">
              {footerLinks.aide.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a href={link.path} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                      {link.name}
                    </a>
                  ) : (
                    <Link to={link.path} className="text-white/70 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Informations</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/70 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} KÔYA Market. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary transition-colors"
                  aria-label={social.label}
                  data-testid={`social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
