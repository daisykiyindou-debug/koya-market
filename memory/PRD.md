# KÔYA Market - PRD (Round 11)

## Architecture
React + Tailwind + Shadcn + Leaflet | FastAPI + MongoDB | JWT + Google OAuth | Payment MOCKED (fictif, per user)

## Features (cumulative)
- 22 products, 11 categories (Épicerie Africaine/Caraïbéenne en premier)
- Catalogue, Recettes, Qui sommes-nous, Contact, KÔYA Pro, Carrières, Légal
- **Guest cart** (localStorage) + **merge automatique** à la connexion via `/api/cart/merge`
- Reviews: min 20 chars, 1x, upload photo réelle multipart, +5/+25pts, synchronisation fiche produit
- Cart: promo codes, codes fidélité flexibles (100pts = 5€, slider), minimum 50€
- Checkout: créneaux de livraison, calendrier, adresse complète. **Paiement simulé** (setTimeout + carte 4242)
- Order tracking: livreur (visible seulement en livraison), statut préservé après annulation, bouton "Annuler" directement dans le suivi
- Order cancellation: 48h avant livraison, dialog avec perte points + remboursement 10j, info affichée dans Mon Compte
- Referral: 200pts chacun après 1er achat filleul
- Pagination commandes (5/page)
- AuthPage: icônes non-superposées, retour post-login vers /checkout si besoin
- Popup livreur: z-index contenu pour passer au-dessus de la carte Leaflet

## Round 11 Completed (2026-04-18)
- Hero image remplacée par photo livreur (277 KB, /images/hero-delivery.jpg)
- Typo global "afro-caribéennes" → "afro-caraïbéennes"
- Page /zones-livraison supprimée (route + fichier + lien footer)
- Fix z-index: popup livreur au-dessus de la carte Leaflet
- **Guest cart persistence + merge au login** : `/api/cart/compute` (public), `/api/cart/merge` (auth), localStorage `koya_guest_cart`, AuthPage revient vers la page d'origine après connexion

## Backlog
- P1: Stripe paiement réel (désactivé à la demande de l'utilisateur)
- P1: Notifications email/SMS réelles
- P2: Dashboard admin
- P2: Refactor server.py (>1800 lignes) en routers séparés

## Test credentials
client@koyamarket.com / Koya2026
