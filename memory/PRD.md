# KÔYA Market - PRD

## Architecture
React + Tailwind + Shadcn + Leaflet | FastAPI + MongoDB | JWT + Google OAuth | Payment MOCKED

## All Implemented Features (April 2026)

### Round 1-4 Complete
- 22 products, 11 categories (Épicerie Africaine/Caribéenne first)
- Product reviews: min 20 chars, photo upload, +5pts (1x only), no duplicates
- Cart: promo codes, loyalty codes, 50€ minimum
- Checkout: delivery slots, address with door_number, calendar
- Order tracking: driver photo/info popup, progress bar, call/msg (hidden post-delivery)
- Post-delivery reviews: products + driver, locked after submission
- Order cancellation: up to 48h before delivery (pending only)
- Referral: 200pts each, activated after filleul's 1st purchase
- Loyalty: 1€=1pt, 100pts=5€ code
- Pages: Home, Catalogue, Recipes, About, Contact (phone+form, no email), Cart, Checkout, Account, Careers (CV upload, no spontaneous), Zones (Leaflet map), KÔYA Pro (coming soon), Legal
- FAQ chatbot, newsletter, ScrollToTop

## Backlog
- P0: Stripe payment integration
- P1: Email notifications
- P2: Admin dashboard
