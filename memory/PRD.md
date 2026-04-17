# KÔYA Market - PRD

## Problem Statement
Premium e-commerce site for KÔYA Market, an Afro-Caribbean grocery delivery platform in Paris & Île-de-France.

## Architecture
- Frontend: React + Tailwind + Shadcn UI
- Backend: FastAPI + MongoDB (Motor)
- Auth: JWT + Emergent Google OAuth
- Payment: MOCKED for demo

## User Personas
- P1: Afro-Caribbean diaspora in Paris/IDF seeking authentic products
- P2: Food enthusiasts wanting to discover Afro-Caribbean cuisine
- P3: Professional B2B buyers (restaurants, caterers)

## Core Requirements
- Delivery zone checker (postal code based)
- Product catalog with filters
- Recipe system with portion adjustment
- Cart with 50€ minimum, promo codes, loyalty codes
- Multi-step checkout with delivery slots
- User account with loyalty program
- Chatbot FAQ

## What's Been Implemented (April 2026)
- Full backend API (products, categories, recipes, cart, orders, auth, promo, loyalty)
- Complete frontend (Home, Catalogue, Recipes, About, Contact, Cart, Checkout, Account, Careers, Legal)
- Auth: JWT + Google OAuth
- Delivery zone checker by postal code (75/91/92/93/94 full, 77/78/95 partial)
- Promo code system (BIENVENUE10, KOYA20, LIVRAISON)
- Loyalty code generation (100 pts = 5€ code)
- FAQ chatbot
- Newsletter subscription
- Contact form
- Careers page

## User Modifications Applied
1. Removed "Accueil" from navigation
2. Changed zone checker from city → postal code
3. Added promo code field in cart
4. Added loyalty code system (generate in account, redeem in cart)

## Backlog
- P0: Real payment integration (Stripe)
- P1: Order email notifications
- P2: Admin dashboard for order management
- P2: Image upload for reviews and contact
- P3: Real mobile app links
- P3: Push notifications
