import React from 'react';
import { Plus, Star, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, onClick }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Connexion requise', { description: 'Connectez-vous pour ajouter des produits au panier.' });
      navigate('/connexion');
      return;
    }

    try {
      await addToCart(product.product_id, 1);
      toast.success('Produit ajouté !', { description: `${product.name} a été ajouté au panier.` });
    } catch (error) {
      toast.error('Erreur', { description: 'Impossible d\'ajouter le produit au panier.' });
    }
  };

  return (
    <div 
      className="product-card cursor-pointer group"
      onClick={onClick}
      data-testid={`product-card-${product.product_id}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        
        {/* Quick Add Button */}
        <Button
          onClick={handleAddToCart}
          size="icon"
          className="add-to-cart-btn bg-secondary hover:bg-secondary/90 rounded-full shadow-lg"
          data-testid={`add-to-cart-${product.product_id}`}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Origin Badge */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3 h-3" />
          <span>{product.origin_country}</span>
        </div>

        {/* Name */}
        <h3 className="font-heading font-medium text-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-secondary text-secondary" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-primary font-heading">
            {product.price.toFixed(2)}€
          </span>
          <span className="text-xs text-muted-foreground">
            /{product.unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
