import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CONTACT_REASONS = [
  { value: 'commande', label: 'Question sur ma commande' },
  { value: 'produit', label: 'Question sur un produit' },
  { value: 'livraison', label: 'Problème de livraison' },
  { value: 'remboursement', label: 'Demande de remboursement' },
  { value: 'partenariat', label: 'Proposition de partenariat' },
  { value: 'autre', label: 'Autre' },
];

const ContactPage = () => {
  const [faq, setFaq] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    order_number: '',
    reason: '',
    message: '',
    image_urls: []
  });

  useEffect(() => {
    fetchFaq();
  }, []);

  const fetchFaq = async () => {
    try {
      const response = await axios.get(`${API}/faq`);
      setFaq(response.data);
    } catch (error) {
      console.error('Failed to fetch FAQ:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/contact`, formData);
      toast.success('Message envoyé !', { description: 'Nous vous répondrons dans les plus brefs délais.' });
      setFormData({
        name: '',
        email: '',
        phone: '',
        order_number: '',
        reason: '',
        message: '',
        image_urls: []
      });
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible d\'envoyer le message. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  const faqByCategory = faq.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    livraison: 'Livraison',
    commande: 'Commandes',
    fidélité: 'Programme fidélité',
    paiement: 'Paiement',
    produits: 'Produits',
    retour: 'Retours',
    contact: 'Contact'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container-custom text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4">Contactez-nous</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Une question ? Un problème ? Notre équipe est là pour vous aider.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 md:p-8">
              <h2 className="font-heading text-2xl font-semibold mb-6">Formulaire de contact</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nom complet *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                      required
                      data-testid="contact-name-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                      required
                      data-testid="contact-email-input"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      data-testid="contact-phone-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Numéro de commande</label>
                    <input
                      type="text"
                      name="order_number"
                      value={formData.order_number}
                      onChange={handleChange}
                      placeholder="ORD-XXXXXXXX (facultatif)"
                      className="form-input"
                      data-testid="contact-order-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Raison du contact *</label>
                  <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})}>
                    <SelectTrigger data-testid="contact-reason-select">
                      <SelectValue placeholder="Sélectionnez une raison" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="form-label">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="form-input"
                    required
                    data-testid="contact-message-input"
                  />
                </div>

                <div>
                  <label className="form-label">Pièces jointes (facultatif)</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Glissez vos fichiers ici ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG jusqu'à 5MB
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-primary py-6"
                  disabled={loading || !formData.reason}
                  data-testid="contact-submit-btn"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                  <Send className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info & FAQ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">Informations de contact</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:contact@koyamarket.com" className="text-sm text-muted-foreground hover:text-primary">
                      contact@koyamarket.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <a href="tel:+33123456789" className="text-sm text-muted-foreground hover:text-primary">
                      01 23 45 67 89
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      Paris et Île-de-France
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Horaires du service client :</strong><br />
                  Du lundi au samedi, 9h - 20h
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl p-6" id="faq" data-testid="faq-section">
              <h3 className="font-heading text-lg font-semibold mb-4">Questions fréquentes</h3>
              
              <Accordion type="single" collapsible className="w-full">
                {faq.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
