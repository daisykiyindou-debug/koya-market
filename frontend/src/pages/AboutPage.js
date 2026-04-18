import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, Clock, Heart, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const AboutPage = () => {
  const navigate = useNavigate();

  const problems = [
    { icon: Package, title: 'Accès limité', description: 'Difficulté à trouver des produits afro-caraïbéens authentiques près de chez soi.' },
    { icon: Truck, title: 'Éloignement', description: 'Les commerces spécialisés sont souvent loin, nécessitant de longs trajets.' },
    { icon: Clock, title: 'Manque de temps', description: 'Entre travail et vie de famille, faire ses courses devient un défi.' },
  ];

  const solutions = [
    { title: 'Livraison rapide', description: 'Vos courses livrées en 3 heures, directement chez vous.', icon: Truck },
    { title: '+2500 produits', description: 'Un large catalogue de produits authentiques et de qualité.', icon: Package },
    { title: 'Qualité garantie', description: 'Des produits frais sélectionnés avec soin chaque jour.', icon: CheckCircle },
    { title: 'Simple et pratique', description: 'Commandez en quelques clics, 7j/7 de 9h à 23h.', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1774415108927-ab76336ca9c8?w=1920"
            alt="Cuisine traditionnelle"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container-custom relative z-10 text-white text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold mb-6">
            Qui sommes-nous ?
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            KÔYA Market, c'est l'histoire d'une passion pour les saveurs afro-caraïbéennes et d'une volonté de les rendre accessibles à tous.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
                Notre mission
              </span>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                Rapprocher les saveurs de chez vous
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Fondé en 2023, KÔYA Market est né d'un constat simple : trop de personnes 
                peinent à trouver les produits afro-caraïbéens qui leur rappellent leurs racines, 
                leurs traditions culinaires et les saveurs de leur enfance.
              </p>
              <p className="text-muted-foreground text-lg">
                Notre mission est de créer un pont entre ces cultures riches et votre cuisine, 
                en vous livrant des produits authentiques et de qualité, directement chez vous.
              </p>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1773332585861-72cf1558a6fc?w=600"
                alt="Préparation de plats"
                className="rounded-3xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-secondary text-white p-6 rounded-2xl shadow-lg">
                <span className="text-4xl font-heading font-bold">+2500</span>
                <p className="text-sm text-white/80">produits disponibles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium mb-4">
              Le problème
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-4">
              Des obstacles au quotidien
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Avant KÔYA Market, faire ses courses afro-caraïbéennes était souvent un parcours du combattant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <problem.icon className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              La solution KÔYA
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-4">
              Votre épicerie afro-caraïbéenne à portée de main
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Nous avons créé KÔYA Market pour vous simplifier la vie et vous permettre de profiter 
              des produits que vous aimez, sans compromis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((solution, index) => (
              <div key={index} className="bg-primary/5 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <solution.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{solution.title}</h3>
                <p className="text-muted-foreground text-sm">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-primary text-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                Nos valeurs
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Authenticité</h3>
                    <p className="text-white/70">Nous sélectionnons des produits authentiques auprès de fournisseurs de confiance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Qualité</h3>
                    <p className="text-white/70">Chaque produit est contrôlé pour garantir fraîcheur et qualité optimales.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Accessibilité</h3>
                    <p className="text-white/70">Des prix justes pour rendre les produits afro-caraïbéens accessibles à tous.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Culture</h3>
                    <p className="text-white/70">Nous célébrons et partageons la richesse des cultures afro-caraïbéennes.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1669128351671-181d1ca87f7a?w=400"
                alt="Produits frais"
                className="rounded-2xl h-48 w-full object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400"
                alt="Fruits tropicaux"
                className="rounded-2xl h-48 w-full object-cover mt-8"
              />
              <img 
                src="https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400"
                alt="Légumes"
                className="rounded-2xl h-48 w-full object-cover"
              />
              <img 
                src="https://images.unsplash.com/photo-1553279768-865429fa0078?w=400"
                alt="Mangues"
                className="rounded-2xl h-48 w-full object-cover mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-4">
            Prêt à découvrir nos produits ?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Explorez notre catalogue et faites-vous livrer vos produits préférés en 3 heures.
          </p>
          <Button 
            onClick={() => navigate('/catalogue')}
            className="btn-primary text-lg px-8 py-6"
            data-testid="cta-explore-btn"
          >
            Explorer le catalogue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
