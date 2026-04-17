# KÔYA Market - PRD

## Architecture
- Frontend: React + Tailwind + Shadcn UI + Leaflet
- Backend: FastAPI + MongoDB (Motor)
- Auth: JWT + Emergent Google OAuth
- Payment: MOCKED

## Implemented Features (April 2026)

### Core E-commerce
- 22 products across 11 categories (Épicerie Africaine/Caribéenne first)
- Product detail with reviews, quantity selector
- Cart with 50€ minimum, promo codes, loyalty codes
- Multi-step checkout with delivery slots
- Order tracking with driver info, map, progress bar, call/message

### User Features
- JWT + Google OAuth authentication
- Loyalty program (1€=1pt, 100pts=5€ code)
- Referral system (+10pts each)
- Post-delivery reviews (+5pts per review)
- Address management

### Pages
- Home, Catalogue, Recipes, About, Contact, Cart, Checkout, Account
- Zones de livraison (Leaflet map), Careers (job details + CV upload)
- Order tracking, Legal pages

### Round 3 Additions
- ScrollToTop on navigation
- New products (Manioc, Foufou, Semoule, Chips plantain, Bonbons, Sucre canne)
- Categories reordered (Épicerie Africaine/Caribéenne first)
- Enhanced order tracking (driver photo, progress bar, call/message, post-delivery reviews)
- Careers: no spontaneous form, CV upload, click on job for full details
- Product reviews visible and clickable in catalogue

## Backlog
- P0: Real Stripe payment
- P1: Email notifications
- P2: Admin dashboard
- P3: Real mobile app
