# KÔYA Market - PRD

## Problem Statement
Premium e-commerce site for KÔYA Market, an Afro-Caribbean grocery delivery platform in Paris & IDF.

## Architecture
- Frontend: React + Tailwind + Shadcn UI + Leaflet (maps)
- Backend: FastAPI + MongoDB (Motor)
- Auth: JWT + Emergent Google OAuth
- Payment: MOCKED

## What's Been Implemented

### Round 1 (April 2026)
- Full backend API, frontend pages (Home, Catalogue, Recipes, About, Contact, Cart, Checkout, Account, Careers, Legal)
- Auth JWT + Google OAuth, delivery zone checker by postal code
- Promo code system, loyalty code generation, FAQ chatbot, newsletter

### Round 2 (April 2026)
- Page Zones de livraison with interactive Leaflet map
- Referral system (invite a friend, +10 points each)
- Careers page with full job detail (missions, salary, requirements, benefits)
- Order tracking page with simulated map, driver, ETA
- New categories: Épicerie Africaine, Épicerie Caribéenne
- Product quantity selector popover
- Loyalty points info banner in cart
- Seeded reviews for products

## Backlog
- P0: Real Stripe payment integration
- P1: Email notifications (order confirmation, delivery updates)
- P2: Admin dashboard for managing products/orders
- P2: Image upload for reviews/contact
- P3: Real mobile app, push notifications
