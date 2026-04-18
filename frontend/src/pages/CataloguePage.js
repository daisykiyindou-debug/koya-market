import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Star, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import ProductCard from '../components/ProductCard';
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
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Antilles', label: 'Antilles' },
  { value: 'France', label: 'France' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Nom A-Z' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Meilleures notes' },
  { value: 'newest', label: 'Nouveautés' },
];

const CataloguePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState('name');
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productReviews, setProductReviews] = useState([]);
  const [relatedRecipes, setRelatedRecipes] = useState([]);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedCountry, sortBy, searchQuery]);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId) {
      fetchProductDetails(productId);
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCountry && selectedCountry !== 'all') params.append('country', selectedCountry);
      if (searchQuery) params.append('search', searchQuery);
      if (priceRange[0] > 0) params.append('min_price', priceRange[0]);
      if (priceRange[1] < 50) params.append('max_price', priceRange[1]);
      params.append('sort', sortBy);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data.products);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Erreur', { description: 'Impossible de charger les produits.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      const [productRes, reviewsRes, recipesRes] = await Promise.all([
        axios.get(`${API}/products/${productId}`),
        axios.get(`${API}/reviews/${productId}`),
        axios.get(`${API}/recipes/by-product/${productId}`)
      ]);
      setSelectedProduct(productRes.data);
      setProductReviews(reviewsRes.data);
      setRelatedRecipes(recipesRes.data);
      setProductQuantity(1);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
      toast.error('Produit non trouvé');
      setSearchParams({});
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchQuery) {
        prev.set('search', searchQuery);
      } else {
        prev.delete('search');
      }
      return prev;
    });
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSearchParams(prev => {
      if (value && value !== 'all') {
        prev.set('category', value);
      } else {
        prev.delete('category');
      }
      return prev;
    });
  };

  const handleProductClick = (product) => {
    setSearchParams({ product: product.product_id });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Connexion requise', { description: 'Connectez-vous pour ajouter des produits au panier.' });
      navigate('/connexion');
      return;
    }

    try {
      await addToCart(selectedProduct.product_id, productQuantity);
      toast.success('Produit ajouté !', { description: `${selectedProduct.name} a été ajouté au panier.` });
      setSearchParams({});
      setSelectedProduct(null);
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible d\'ajouter le produit au panier.' });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedCountry('all');
    setPriceRange([0, 50]);
    setSearchQuery('');
    setSortBy('name');
    setSearchParams({});
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-heading font-semibold mb-3">Catégories</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all' ? 'bg-primary text-white' : 'hover:bg-muted'
            }`}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === cat.slug ? 'bg-primary text-white' : 'hover:bg-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Country */}
      <div>
        <h3 className="font-heading font-semibold mb-3">Origine</h3>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger data-testid="country-filter">
            <SelectValue placeholder="Tous les pays" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-heading font-semibold mb-3">Prix</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={50}
          step={1}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0]}€</span>
          <span>{priceRange[1]}€+</span>
        </div>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Réinitialiser les filtres
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="container-custom">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4">Catalogue</h1>
          <p className="text-white/70 mb-6">Découvrez notre sélection de produits afro-caribéens</p>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                data-testid="catalog-search-input"
              />
            </div>
          </form>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white p-6 rounded-2xl border border-border">
              <h2 className="font-heading text-xl font-semibold mb-6">Filtres</h2>
              <FilterContent />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {total} produit{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
              </p>
              
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44" data-testid="sort-select">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mobile Filter Button */}
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="mobile-filter-btn">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filtres
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filtres</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted h-48 rounded-2xl mb-4" />
                    <div className="bg-muted h-4 rounded w-3/4 mb-2" />
                    <div className="bg-muted h-4 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.product_id} 
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">Aucun produit trouvé</p>
                <Button onClick={clearFilters}>Réinitialiser les filtres</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => { setSearchParams({}); setSelectedProduct(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="w-full h-64 md:h-80 object-cover rounded-xl"
                  />
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedProduct.origin_country}</span>
                  </div>

                  <h2 className="font-heading text-2xl font-semibold mb-2" data-testid="product-detail-name">
                    {selectedProduct.name}
                  </h2>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-secondary text-secondary" />
                      <span className="font-medium">{selectedProduct.rating}</span>
                    </div>
                    <button 
                      onClick={() => document.getElementById('product-reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="text-primary hover:underline cursor-pointer"
                      data-testid="reviews-count-link"
                    >
                      ({selectedProduct.reviews_count} avis)
                    </button>
                  </div>

                  <p className="text-muted-foreground mb-6">{selectedProduct.description}</p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-semibold text-primary font-heading">
                      {selectedProduct.price.toFixed(2)}€
                    </span>
                    <span className="text-muted-foreground">/{selectedProduct.unit}</span>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-medium">Quantité :</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                        data-testid="quantity-decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{productQuantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setProductQuantity(productQuantity + 1)}
                        data-testid="quantity-increase"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <Button 
                    className="w-full btn-primary py-6 text-lg"
                    onClick={handleAddToCart}
                    data-testid="product-detail-add-to-cart"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Ajouter au panier - {(selectedProduct.price * productQuantity).toFixed(2)}€
                  </Button>
                </div>
              </div>

              {/* Related Recipes */}
              {relatedRecipes.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="font-heading text-xl font-semibold mb-4">Recettes associées</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {relatedRecipes.map((recipe) => (
                      <div 
                        key={recipe.recipe_id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => { setSearchParams({}); setSelectedProduct(null); navigate(`/recettes/${recipe.recipe_id}`); }}
                      >
                        <img src={recipe.image_url} alt={recipe.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-sm">{recipe.name}</p>
                          <p className="text-xs text-muted-foreground">{recipe.origin_country}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div id="product-reviews-section" className="mt-8 pt-8 border-t">
                <h3 className="font-heading text-xl font-semibold mb-4">
                  Avis clients ({productReviews.length})
                </h3>
                {productReviews.length > 0 ? (
                  <div className="space-y-4">
                    {productReviews.map((review) => (
                      <div key={review.review_id} className="bg-muted/50 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{review.user_name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'fill-secondary text-secondary' : 'text-muted'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        {review.image_urls?.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {review.image_urls.map((url, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setViewingPhoto(url); }}
                                className="focus:outline-none hover:opacity-80 transition-opacity"
                                data-testid={`review-photo-${review.review_id}-${idx}`}
                              >
                                <img src={url} alt="Photo avis" className="w-20 h-20 rounded-lg object-cover border hover:border-primary cursor-pointer" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun avis pour ce produit.</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setViewingPhoto(null)}
          data-testid="photo-lightbox"
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            onClick={() => setViewingPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={viewingPhoto} 
            alt="Photo avis agrandie" 
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default CataloguePage;
