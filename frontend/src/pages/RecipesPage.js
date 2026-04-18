import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Clock, ChefHat, Users, Minus, Plus, ShoppingCart, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COUNTRIES = [
  { value: 'all', label: 'Tous les pays' },
  { value: 'Sénégal', label: 'Sénégal' },
  { value: 'Côte d\'Ivoire', label: 'Côte d\'Ivoire' },
  { value: 'Cameroun', label: 'Cameroun' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Congo', label: 'Congo' },
  { value: 'Antilles', label: 'Antilles' },
];

const DIFFICULTIES = [
  { value: 'all', label: 'Toutes les difficultés' },
  { value: 'Facile', label: 'Facile' },
  { value: 'Moyen', label: 'Moyen' },
  { value: 'Difficile', label: 'Difficile' },
];

const RecipesPage = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { addRecipeIngredients, addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const [servings, setServings] = useState(4);

  useEffect(() => {
    if (recipeId) {
      fetchRecipeDetails(recipeId);
    } else {
      fetchRecipes();
    }
  }, [recipeId, selectedCountry, selectedDifficulty, searchQuery]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCountry && selectedCountry !== 'all') params.append('country', selectedCountry);
      if (selectedDifficulty && selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API}/recipes?${params.toString()}`);
      setRecipes(response.data.recipes);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      toast.error('Erreur', { description: 'Impossible de charger les recettes.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeDetails = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/recipes/${id}`);
      setSelectedRecipe(response.data);
      setServings(response.data.servings);
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      toast.error('Recette non trouvée');
      navigate('/recettes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecipes();
  };

  const getAdjustedQuantity = (ingredient) => {
    if (!selectedRecipe) return ingredient.quantity;
    const multiplier = servings / selectedRecipe.servings;
    return Math.round(ingredient.quantity * multiplier * 10) / 10;
  };

  const handleAddAllIngredients = async () => {
    if (!isAuthenticated) {
      toast.error('Connexion requise', { description: 'Connectez-vous pour ajouter des ingrédients au panier.' });
      navigate('/connexion');
      return;
    }

    try {
      await addRecipeIngredients(selectedRecipe.recipe_id, servings);
      toast.success('Ingrédients ajoutés !', { 
        description: `Les ingrédients pour ${servings} personnes ont été ajoutés au panier.` 
      });
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible d\'ajouter les ingrédients au panier.' });
    }
  };

  // Recipe Detail View
  if (recipeId && selectedRecipe) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="relative h-64 md:h-96">
          <img 
            src={selectedRecipe.image_url} 
            alt={selectedRecipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container-custom">
              <Button 
                variant="ghost" 
                className="text-white mb-4 hover:bg-white/20"
                onClick={() => navigate('/recettes')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Toutes les recettes
              </Button>
              <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>{selectedRecipe.origin_country}</span>
              </div>
              <h1 className="font-heading text-3xl md:text-5xl font-semibold text-white" data-testid="recipe-title">
                {selectedRecipe.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="container-custom py-8 md:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Info Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/50 rounded-2xl p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Temps total</p>
                  <p className="font-semibold">{selectedRecipe.prep_time + selectedRecipe.cook_time} min</p>
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 text-center">
                  <ChefHat className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Difficulté</p>
                  <p className="font-semibold">{selectedRecipe.difficulty}</p>
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Portions</p>
                  <p className="font-semibold">{selectedRecipe.servings} pers.</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-heading text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground">{selectedRecipe.description}</p>
              </div>

              {/* Steps */}
              <div>
                <h2 className="font-heading text-xl font-semibold mb-4">Préparation</h2>
                <ol className="space-y-4">
                  {selectedRecipe.steps.map((step, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-semibold">
                        {index + 1}
                      </span>
                      <p className="pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Sidebar - Ingredients */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl border border-border p-6">
                <h2 className="font-heading text-xl font-semibold mb-4">Ingrédients</h2>
                
                {/* Portion Selector */}
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3">Nombre de personnes</p>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className="rounded-full"
                      data-testid="servings-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-semibold w-12 text-center" data-testid="servings-count">
                      {servings}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setServings(servings + 1)}
                      className="rounded-full"
                      data-testid="servings-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Ingredients List */}
                <ul className="space-y-3 mb-6">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span>{ingredient.name}</span>
                        <span className="text-primary font-medium ml-2" data-testid={`ingredient-qty-${index}`}>
                          {getAdjustedQuantity(ingredient)} {ingredient.unit}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={async () => {
                          if (!isAuthenticated) {
                            toast.error('Connexion requise');
                            navigate('/connexion');
                            return;
                          }
                          try {
                            const qty = Math.max(1, Math.round(getAdjustedQuantity(ingredient)));
                            await addToCart(ingredient.product_id, qty);
                            toast.success(`${ingredient.name} ajouté au panier`);
                          } catch (e) {
                            toast.error('Erreur');
                          }
                        }}
                        data-testid={`add-ingredient-${index}`}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Ajouter
                      </Button>
                    </li>
                  ))}
                </ul>

                {/* Add All to Cart */}
                <Button 
                  className="w-full btn-primary py-6"
                  onClick={handleAddAllIngredients}
                  data-testid="add-all-ingredients-btn"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ajouter au panier
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Tous les ingrédients pour {servings} personnes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Recipes List View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="container-custom">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4">Nos Recettes</h1>
          <p className="text-white/70 mb-6">Découvrez les saveurs traditionnelles afro-caraïbéennes</p>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une recette..."
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                data-testid="recipe-search-input"
              />
            </div>
          </form>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-48" data-testid="country-filter">
              <SelectValue placeholder="Pays d'origine" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-48" data-testid="difficulty-filter">
              <SelectValue placeholder="Difficulté" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recipes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-56 rounded-2xl mb-4" />
                <div className="bg-muted h-4 rounded w-3/4 mb-2" />
                <div className="bg-muted h-4 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
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
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.prep_time + recipe.cook_time} min</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      recipe.difficulty === 'Facile' ? 'bg-green-100 text-green-700' :
                      recipe.difficulty === 'Moyen' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Aucune recette trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesPage;
