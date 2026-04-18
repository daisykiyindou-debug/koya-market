# KÔYA Market - PRD (Round 10)

## Architecture
React + Tailwind + Shadcn + Leaflet | FastAPI + MongoDB | JWT + Google OAuth | Payment MOCKED (fictif, per user)

## All Features (Rounds 1-10)
- 22 products, 11 categories (Épicerie Africaine/Caribéenne first)
- Reviews: min 20 chars, 1x only per product, +5/+25pts (with photo), synced to product detail dialog
- **Photos d'avis: upload réel multipart → /app/backend/uploads/reviews/, servis via /api/uploads/reviews/{filename}** (plus de base64)
- Cart: promo codes, flexible loyalty codes, 50€ min
- Checkout: delivery slots (past disabled, weekends "complet"), calendar, door_number
- Order tracking: driver (only when delivering), progress bar, cancelled state preserved with refund info
- Order cancellation: popup confirmation (perte points + remboursement 10j), 48h rule, **bouton annulation aussi dans OrderTrackingPage**
- Cancelled orders in AccountPage: greyed out mais cliquables, avec date d'annulation et "Remboursement X€ sous 10 jours ouvrés"
- AuthPage: icônes + placeholders alignés (fix !pl-11 override du @apply px-4)
- Referral: 200pts each, after filleul's 1st purchase
- Loyalty: flexible (100pts=5€, 200pts=10€, slider to choose)
- Pagination: orders (5/page)
- Pages: Home, Catalogue, Recipes, About, Contact, Cart, Checkout, Account, Careers, Zones (Leaflet), KÔYA Pro, Legal
- ScrollToTop, FAQ chatbot, newsletter

## Round 10 Completed (2026-04-18)
- CRITICAL fix: React hooks violation in OrderTrackingPage (useState after early returns) → hooks hoisted to top
- Real photo upload endpoint POST /api/upload/review-photo (multipart, 8MB max, validated ext)
- StaticFiles mount /api/uploads/reviews (authenticated upload, public GET)
- Cancel dialog + amber banner inside OrderTrackingPage for cancellable pending orders
- AccountPage cancelled orders: grey card + cancel date + refund notice inline
- AuthPage: `!pl-11` override fixes icon/placeholder superposition
- Bug fix (testing agent): tracking endpoint was overwriting cancelled status → preserved now

## Backlog
- P1: Real Stripe payment (user explicitly said keep fictif for now)
- P1: Real email/SMS notifications
- P2: Admin dashboard
- P2: Refactor server.py (>1700 lines) → split routers (auth, products, orders, reviews)

## Test credentials
client@koyamarket.com / Koya2026
