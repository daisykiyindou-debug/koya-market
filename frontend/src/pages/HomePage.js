import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Package, Truck, CheckCircle, Star, ArrowRight, Apple, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const navigate = useNavigate();
  const [zonePostcode, setZonePostcode] = useState('');
  const [zoneResult, setZoneResult] = useState(null);
  const [checkingZone, setCheckingZone] = useState(false);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, recipesRes] = await Promise.all([
        axios.get(`${API}/products/popular?limit=8`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/recipes/featured?limit=4`)
      ]);
      setPopularProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setFeaturedRecipes(recipesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const checkDeliveryZone = async (e) => {
    e.preventDefault();
    if (!zonePostcode.trim()) return;

    setCheckingZone(true);
    try {
      const response = await axios.post(`${API}/delivery-zone/check`, { postcode: zonePostcode });
      setZoneResult(response.data);
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible de vérifier la zone de livraison.' });
    } finally {
      setCheckingZone(false);
    }
  };

  const benefits = [
    { icon: Clock, title: 'Livraison en 3h', description: 'Recevez vos courses rapidement' },
    { icon: Package, title: '+2500 produits', description: 'Large choix afro-caraïbéen' },
    { icon: CheckCircle, title: 'Qualité garantie', description: 'Produits frais sélectionnés' },
    { icon: Truck, title: '7j/7 de 9h à 23h', description: 'Livraison tous les jours' },
  ];

  const customerReviews = [
    { name: 'Aminata D.', rating: 5, comment: 'Excellent service ! Les produits sont toujours frais et la livraison rapide. Je recommande KÔYA Market à toutes mes amies.', location: 'Paris 18e' },
    { name: 'Jean-Claude M.', rating: 5, comment: 'Enfin une plateforme qui comprend nos besoins ! Les plantains sont parfaits et le prix est raisonnable.', location: 'Créteil' },
    { name: 'Fatou S.', rating: 5, comment: 'Je fais mes courses chaque semaine sur KÔYA. Le programme fidélité est super avantageux !', location: 'Saint-Denis' },
    { name: 'Pierre L.', rating: 4, comment: 'Très bonne sélection de produits caribéens. Ma femme est ravie de pouvoir cuisiner ses plats traditionnels.', location: 'Montreuil' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section" data-testid="hero-section">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/hero-delivery.jpg)' }}
        />
        <div className="hero-overlay" />
        
        <div className="hero-content animate-fade-in">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold mb-4">
            Les saveurs afro-caraïbéennes
            <br />
            <span className="text-secondary">livrées chez vous</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Découvrez plus de 2500 produits authentiques livrés en 3 heures à Paris et en Île-de-France
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button 
              onClick={() => navigate('/catalogue')}
              className="btn-primary text-lg px-8 py-6"
              data-testid="cta-order-now"
            >
              Commander maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Zone Checker */}
          <div className="max-w-md mx-auto" id="zones">
            <p className="text-white/70 text-sm mb-3">Vérifiez si vous êtes dans notre zone de livraison</p>
            <form onSubmit={checkDeliveryZone} className="zone-input">
              <Search className="w-5 h-5 text-white/60" />
              <input
                type="text"
                value={zonePostcode}
                onChange={(e) => setZonePostcode(e.target.value)}
                placeholder="Entrez votre code postal (ex: 75011)..."
                className="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none"
                maxLength={5}
                data-testid="zone-check-input"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="bg-secondary hover:bg-secondary/90 rounded-full"
                disabled={checkingZone}
                data-testid="zone-check-btn"
              >
                {checkingZone ? 'Vérification...' : 'Vérifier'}
              </Button>
            </form>
            
            {zoneResult && (
              <div className={`mt-4 p-3 rounded-xl ${zoneResult.eligible ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`} data-testid="zone-result">
                {zoneResult.eligible ? (
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Bonne nouvelle ! Nous livrons au code postal {zonePostcode} {zoneResult.coverage === 'complete' ? '(couverture complète)' : '(couverture partielle)'}
                  </p>
                ) : (
                  <p>{zoneResult.error || zoneResult.message || "Désolé, nous ne livrons pas encore dans cette zone. Inscrivez-vous à notre newsletter pour être informé."}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-white" data-testid="benefits-section">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-2xl bg-muted/50 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="section-padding" data-testid="popular-products-section">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-semibold mb-2">Produits populaires</h2>
              <p className="text-muted-foreground">Les favoris de nos clients</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/catalogue')}
              className="hidden md:flex"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {popularProducts.map((product) => (
                <CarouselItem key={product.product_id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard 
                    product={product} 
                    onClick={() => navigate(`/catalogue?product=${product.product_id}`)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 hidden md:flex" />
            <CarouselNext className="-right-4 hidden md:flex" />
          </Carousel>

          <Button 
            variant="outline" 
            onClick={() => navigate('/catalogue')}
            className="w-full mt-6 md:hidden"
          >
            Voir tous les produits
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding bg-white" data-testid="categories-section">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-semibold mb-2">Nos catégories</h2>
            <p className="text-muted-foreground">Explorez notre sélection</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(0, 5).map((category) => (
              <div
                key={category.category_id}
                className="category-card"
                onClick={() => navigate(`/catalogue?category=${category.slug}`)}
                data-testid={`category-${category.slug}`}
              >
                <img src={category.image_url} alt={category.name} className="category-image" />
                <div className="category-overlay">
                  <span className="font-heading text-white text-lg font-semibold">{category.name}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {categories.slice(5).map((category) => (
              <div
                key={category.category_id}
                className="category-card"
                onClick={() => navigate(`/catalogue?category=${category.slug}`)}
                data-testid={`category-${category.slug}`}
              >
                <img src={category.image_url} alt={category.name} className="category-image" />
                <div className="category-overlay">
                  <span className="font-heading text-white text-lg font-semibold">{category.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="section-padding" data-testid="recipes-section">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-semibold mb-2">Recettes inspirantes</h2>
              <p className="text-muted-foreground">Découvrez les saveurs de chez nous</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/recettes')}
              className="hidden md:flex"
            >
              Toutes les recettes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredRecipes.map((recipe) => (
              <div
                key={recipe.recipe_id}
                className="recipe-card cursor-pointer"
                onClick={() => navigate(`/recettes/${recipe.recipe_id}`)}
                data-testid={`recipe-card-${recipe.recipe_id}`}
              >
                <div className="relative">
                  <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
                  <span className="recipe-badge bg-white/90 text-primary">
                    {recipe.origin_country}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-lg mb-2">{recipe.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{recipe.prep_time + recipe.cook_time} min</span>
                    <span>•</span>
                    <span>{recipe.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate('/recettes')}
            className="w-full mt-6 md:hidden"
          >
            Voir toutes les recettes
          </Button>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="section-padding bg-primary text-white" data-testid="reviews-section">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-semibold mb-2">Ce que disent nos clients</h2>
            <p className="text-white/70">Des milliers de clients satisfaits</p>
          </div>

          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {customerReviews.map((review, index) => (
                <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-full">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < review.rating ? 'fill-secondary text-secondary' : 'text-white/30'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-white/90 mb-4 italic">"{review.comment}"</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{review.name}</span>
                      <span className="text-sm text-white/60">{review.location}</span>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 hidden md:flex bg-white/20 hover:bg-white/30 border-0" />
            <CarouselNext className="-right-4 hidden md:flex bg-white/20 hover:bg-white/30 border-0" />
          </Carousel>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="section-padding" data-testid="app-section">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-4">
                Téléchargez l'app KÔYA Market
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Commandez encore plus facilement depuis votre smartphone. Profitez d'offres exclusives et suivez vos livraisons en temps réel.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#" className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-black/80 transition-colors" data-testid="app-store-btn">
                  <Apple className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xs text-white/70">Télécharger sur</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-black/80 transition-colors" data-testid="play-store-btn">
                  <Play className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xs text-white/70">Disponible sur</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600" 
                alt="KÔYA Market App" 
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* KÔYA Pro Section */}
      <section className="section-padding bg-muted" data-testid="pro-section">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600" 
                alt="KÔYA Market Pro" 
                className="rounded-3xl shadow-xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
                Pour les professionnels
              </span>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-4">
                KÔYA Market Pro
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Vous êtes restaurateur, traiteur ou épicier ? Accédez à notre catalogue professionnel avec des prix de gros et une livraison adaptée à vos besoins.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Prix de gros avantageux</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Livraison adaptée aux professionnels</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Conseiller dédié</span>
                </li>
              </ul>
              <Button className="btn-secondary px-8 py-6 text-lg" onClick={() => navigate('/koya-pro')} data-testid="pro-cta-btn">
                  Découvrir KÔYA Pro
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
