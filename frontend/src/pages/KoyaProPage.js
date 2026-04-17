import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';

const KoyaProPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center py-12 px-4">
      <div className="text-center text-white max-w-lg">
        <div className="mb-8">
          <span className="font-heading text-4xl font-semibold">KÔYA</span>
          <span className="font-heading text-3xl text-secondary ml-2">Market Pro</span>
        </div>

        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white/10 flex items-center justify-center">
          <Clock className="w-10 h-10 text-secondary" />
        </div>

        <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4">
          La plateforme professionnelle arrive bientôt
        </h1>
        <p className="text-white/70 text-lg mb-8">
          Restaurateurs, traiteurs, épiciers : bientôt un catalogue dédié avec des prix de gros et une livraison adaptée à vos besoins professionnels.
        </p>

        <Button 
          onClick={() => navigate('/')}
          className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-8 py-6 text-lg"
          data-testid="back-to-koya-btn"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour sur KÔYA Market
        </Button>
      </div>
    </div>
  );
};

export default KoyaProPage;
