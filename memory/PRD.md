# KÔYA Market - PRD (Round 5)

## Architecture
React + Tailwind + Shadcn + Leaflet | FastAPI + MongoDB | JWT + Google OAuth | Payment MOCKED

## All Features (Rounds 1-5)
- 22 products, 11 categories (Épicerie Africaine/Caribéenne first)
- Reviews: min 20 chars, 1x only, photo, +5pts, no duplicates
- Cart: promo codes, flexible loyalty codes, 50€ min
- Checkout: delivery slots (past disabled, weekends "complet"), calendar, door_number
- Order tracking: driver (only when delivering), progress bar, cancelled state with refund info
- Order cancellation: popup confirmation, 48h rule, 10-day refund
- Referral: 200pts each, after filleul's 1st purchase
- Loyalty: flexible (100pts=5€, 200pts=10€, slider to choose)
- Pagination: orders (5/page)
- Pages: Home, Catalogue, Recipes, About, Contact (no email), Cart, Checkout, Account (profile/orders/loyalty/referral/addresses/security), Careers (CV upload, job details), Zones (Leaflet), KÔYA Pro (coming soon), Legal
- ScrollToTop, FAQ chatbot, newsletter

## Backlog
- P0: Stripe payment
- P1: Email notifications
- P2: Admin dashboard
