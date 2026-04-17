import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '../ui/button';

const FAQ_RESPONSES = {
  'livraison': {
    keywords: ['livraison', 'livrer', 'délai', 'temps', 'quand', 'heure'],
    response: "Nous livrons en 3 heures maximum après validation de votre commande, 7j/7 de 9h à 23h. Les créneaux disponibles sont : 9h-12h, 11h-14h, 14h-17h, 17h-20h, 20h-23h."
  },
  'minimum': {
    keywords: ['minimum', 'commande minimum', '50', 'montant'],
    response: "Le minimum de commande est de 50€ pour bénéficier de la livraison. Les frais de livraison sont de 4,99€ pour les commandes de moins de 80€, et gratuits au-delà."
  },
  'fidelite': {
    keywords: ['fidélité', 'points', 'réduction', 'remise', 'programme'],
    response: "Notre programme fidélité vous récompense : 1€ dépensé = 1 point. À 100 points, vous bénéficiez de 5€ de réduction sur votre prochaine commande !"
  },
  'zone': {
    keywords: ['zone', 'livrez', 'secteur', 'paris', 'ville', 'région'],
    response: "Nous livrons dans tout Paris (75), les Hauts-de-Seine (92), la Seine-Saint-Denis (93), le Val-de-Marne (94), l'Essonne (91), et partiellement en Seine-et-Marne (77), Yvelines (78) et Val-d'Oise (95)."
  },
  'paiement': {
    keywords: ['paiement', 'payer', 'carte', 'bancaire', 'cb'],
    response: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) et Apple Pay. Le paiement est sécurisé."
  },
  'retour': {
    keywords: ['retour', 'rembourser', 'problème', 'qualité', 'satisfait'],
    response: "Si vous n'êtes pas satisfait d'un produit, contactez-nous dans les 24h suivant la livraison. Nous vous rembourserons ou remplacerons le produit."
  },
  'contact': {
    keywords: ['contact', 'joindre', 'email', 'téléphone', 'service client'],
    response: "Vous pouvez nous contacter via le formulaire de contact sur notre site, par email à contact@koyamarket.com, ou par téléphone au 01 23 45 67 89."
  },
  'produits': {
    keywords: ['produit', 'frais', 'qualité', 'origine', 'provenance'],
    response: "Tous nos produits frais sont sélectionnés le jour même et livrés dans des conditions optimales. Nous proposons plus de 2500 produits afro-caribéens de qualité."
  },
  'recette': {
    keywords: ['recette', 'cuisine', 'préparer', 'ingrédient'],
    response: "Découvrez nos recettes traditionnelles dans la section Recettes ! Vous pouvez ajuster le nombre de personnes et ajouter tous les ingrédients au panier en un clic."
  },
  'compte': {
    keywords: ['compte', 'inscription', 'connexion', 'mot de passe'],
    response: "Créez votre compte pour accéder à vos commandes, votre programme fidélité et vos adresses enregistrées. Vous pouvez aussi vous connecter avec Google."
  }
};

const DEFAULT_RESPONSE = "Je n'ai pas compris votre question. Voici les sujets sur lesquels je peux vous aider : livraison, minimum de commande, programme fidélité, zones de livraison, paiement, retours, contact, produits, recettes, compte. N'hésitez pas à reformuler votre question !";

const WELCOME_MESSAGE = "Bonjour ! Je suis l'assistant KÔYA Market. Comment puis-je vous aider ? Vous pouvez me poser des questions sur la livraison, les commandes, le programme fidélité, etc.";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: WELCOME_MESSAGE }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [, data] of Object.entries(FAQ_RESPONSES)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data.response;
      }
    }
    
    return DEFAULT_RESPONSE;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse = findResponse(userMessage);
      setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chatbot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-button"
        data-testid="chatbot-toggle-btn"
        aria-label="Ouvrir le chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window animate-scale-in" data-testid="chatbot-window">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Assistant KÔYA</h3>
              <p className="text-sm text-white/70">En ligne</p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.type === 'user' ? 'bg-secondary text-white' : 'bg-primary text-white'
                }`}>
                  {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] p-3 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-secondary text-white rounded-tr-none' 
                    : 'bg-white border border-border rounded-tl-none'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 rounded-full border border-border focus:outline-none focus:border-primary text-sm"
                data-testid="chatbot-input"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90"
                data-testid="chatbot-send-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
