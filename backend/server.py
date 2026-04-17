from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'koya_market_secret_key_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

app = FastAPI(title="KÔYA Market API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    picture: Optional[str] = None
    loyalty_points: int = 0
    created_at: datetime

class AddressCreate(BaseModel):
    label: str
    street: str
    city: str
    postal_code: str
    country: str = "France"
    details: Optional[str] = None
    digicode: Optional[str] = None
    floor: Optional[str] = None
    door_number: Optional[str] = None
    elevator: bool = False
    is_default: bool = False

class AddressResponse(BaseModel):
    address_id: str
    label: str
    street: str
    city: str
    postal_code: str
    country: str
    details: Optional[str] = None
    digicode: Optional[str] = None
    floor: Optional[str] = None
    door_number: Optional[str] = None
    elevator: bool = False
    is_default: bool = False

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    origin_country: str
    image_url: str
    stock: int = 100
    unit: str = "pièce"
    rating: float = 4.5
    reviews_count: int = 0

class ProductResponse(BaseModel):
    product_id: str
    name: str
    description: str
    price: float
    category: str
    origin_country: str
    image_url: str
    stock: int
    unit: str
    rating: float
    reviews_count: int
    created_at: datetime

class CategoryResponse(BaseModel):
    category_id: str
    name: str
    slug: str
    image_url: str
    product_count: int = 0

class RecipeIngredient(BaseModel):
    product_id: str
    name: str
    quantity: float
    unit: str
    base_servings: int = 1

class RecipeCreate(BaseModel):
    name: str
    description: str
    origin_country: str
    image_url: str
    prep_time: int
    cook_time: int
    difficulty: str
    servings: int
    ingredients: List[RecipeIngredient]
    steps: List[str]

class RecipeResponse(BaseModel):
    recipe_id: str
    name: str
    description: str
    origin_country: str
    image_url: str
    prep_time: int
    cook_time: int
    difficulty: str
    servings: int
    ingredients: List[RecipeIngredient]
    steps: List[str]
    created_at: datetime

class CartItem(BaseModel):
    product_id: str
    quantity: int

class CartResponse(BaseModel):
    cart_id: str
    user_id: str
    items: List[dict]
    subtotal: float
    minimum_reached: bool
    amount_to_minimum: float

class OrderCreate(BaseModel):
    address_id: str
    delivery_date: str
    delivery_slot: str
    use_loyalty_points: bool = False
    delivery_details: Optional[str] = None

class OrderResponse(BaseModel):
    order_id: str
    user_id: str
    items: List[dict]
    subtotal: float
    delivery_fee: float
    loyalty_discount: float
    total: float
    status: str
    address: dict
    delivery_date: str
    delivery_slot: str
    delivery_details: Optional[str] = None
    driver_name: Optional[str] = None
    created_at: datetime

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str
    image_urls: List[str] = []
    order_id: Optional[str] = None

class ReviewResponse(BaseModel):
    review_id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    image_urls: List[str]
    created_at: datetime

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    order_number: Optional[str] = None
    reason: str
    message: str
    image_urls: List[str] = []

class NewsletterSubscribe(BaseModel):
    email: EmailStr

class DeliveryZoneCheck(BaseModel):
    postcode: str

class PromoCodeCheck(BaseModel):
    code: str

class LoyaltyCodeRedeem(BaseModel):
    code: str

class ReferralApply(BaseModel):
    referral_code: str

class FAQResponse(BaseModel):
    question: str
    answer: str
    category: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Then try Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a JWT token
    try:
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if user:
            return user
    except jwt.InvalidTokenError:
        pass
    
    # Check if it's a session token (Google OAuth)
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ==================== DELIVERY ZONES ====================

# Full coverage: all postal codes starting with these
FULL_COVERAGE_PREFIXES = ["75", "92", "93", "94", "91"]

# Partial coverage: specific postal codes
PARTIAL_COVERAGE_POSTCODES = {
    # Seine-et-Marne (77) - zones proches IDF centre
    "77420": True,  # Champs-sur-Marne
    "77186": True,  # Noisiel
    "77185": True,  # Lognes
    "77400": True,  # Lagny-sur-Marne
    "77600": True,  # Bussy-Saint-Georges
    "77700": True,  # Serris
    "77200": True,  # Torcy
    "77100": True,  # Meaux
    "77500": True,  # Chelles
    # Yvelines (78)
    "78000": True,  # Versailles
    "78100": True,  # Saint-Germain-en-Laye
    "78300": True,  # Poissy
    "78500": True,  # Sartrouville
    "78200": True,  # Mantes-la-Jolie
    "78130": True,  # Les Mureaux
    "78400": True,  # Chatou
    "78600": True,  # Maisons-Laffitte
    # Val-d'Oise (95)
    "95100": True,  # Argenteuil
    "95000": True,  # Cergy
    "95300": True,  # Pontoise
    "95200": True,  # Sarcelles
    "95140": True,  # Garges-lès-Gonesse
    "95130": True,  # Franconville
    "95220": True,  # Herblay
    "95150": True,  # Taverny
    "95400": True,  # Villiers-le-Bel
    "95500": True,  # Gonesse
}

def check_delivery_zone_by_postcode(postcode: str) -> dict:
    postcode = postcode.strip().replace(" ", "")
    
    # Validate format (5 digits)
    if not postcode.isdigit() or len(postcode) != 5:
        return {"eligible": False, "coverage": None, "department": None, "error": "Format invalide. Entrez un code postal à 5 chiffres."}
    
    # Get department prefix (first 2 digits)
    dept = postcode[:2]
    
    # Check full coverage departments
    if dept in FULL_COVERAGE_PREFIXES:
        return {"eligible": True, "coverage": "complete", "department": dept}
    
    # Check partial coverage
    if postcode in PARTIAL_COVERAGE_POSTCODES:
        return {"eligible": True, "coverage": "partial", "department": dept}
    
    # Check if department is partially covered but this specific code isn't
    if dept in ["77", "78", "95"]:
        return {"eligible": False, "coverage": None, "department": dept, "message": "Ce code postal n'est pas encore couvert. Consultez notre liste des zones partiellement couvertes."}
    
    return {"eligible": False, "coverage": None, "department": None}

# ==================== FAQ DATA ====================

FAQ_DATA = [
    {"question": "Quels sont les délais de livraison ?", "answer": "Nous livrons en 3 heures maximum après validation de votre commande, 7j/7 de 9h à 23h.", "category": "livraison"},
    {"question": "Quel est le minimum de commande ?", "answer": "Le minimum de commande est de 50€ pour bénéficier de la livraison.", "category": "commande"},
    {"question": "Comment fonctionne le programme fidélité ?", "answer": "Chaque euro dépensé vous rapporte 1 point. À 100 points, vous bénéficiez de 5€ de réduction sur votre prochaine commande.", "category": "fidélité"},
    {"question": "Quelles sont les zones de livraison ?", "answer": "Nous livrons dans tout Paris (75), les Hauts-de-Seine (92), la Seine-Saint-Denis (93), le Val-de-Marne (94), l'Essonne (91), et partiellement en Seine-et-Marne (77), Yvelines (78) et Val-d'Oise (95).", "category": "livraison"},
    {"question": "Comment modifier ma commande ?", "answer": "Vous pouvez modifier votre commande tant qu'elle est en statut 'En attente'. Rendez-vous dans Mon Compte > Mes Commandes.", "category": "commande"},
    {"question": "Quels moyens de paiement acceptez-vous ?", "answer": "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) et Apple Pay.", "category": "paiement"},
    {"question": "Comment contacter le service client ?", "answer": "Vous pouvez nous contacter via le formulaire de contact ou par email à contact@koyamarket.com.", "category": "contact"},
    {"question": "Les produits sont-ils frais ?", "answer": "Oui, tous nos produits frais sont sélectionnés le jour même et livrés dans des conditions optimales de conservation.", "category": "produits"},
    {"question": "Puis-je retourner un produit ?", "answer": "Si vous n'êtes pas satisfait, contactez-nous dans les 24h suivant la livraison. Nous vous rembourserons ou remplacerons le produit.", "category": "retour"},
    {"question": "Comment suivre ma commande ?", "answer": "Connectez-vous à votre compte et accédez à 'Mes Commandes' pour voir le statut en temps réel de votre livraison.", "category": "commande"}
]

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "phone": user_data.phone,
        "picture": None,
        "loyalty_points": 0,
        "addresses": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_HOURS * 3600
    )
    
    # Fetch clean user without _id and password
    clean_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0, "addresses": 0})
    if isinstance(clean_user.get("created_at"), str):
        clean_user["created_at"] = datetime.fromisoformat(clean_user["created_at"])
    return {"user": clean_user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"])
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_HOURS * 3600
    )
    
    user_response = {k: v for k, v in user.items() if k not in ["password", "addresses"]}
    if isinstance(user_response.get("created_at"), str):
        user_response["created_at"] = datetime.fromisoformat(user_response["created_at"])
    return {"user": user_response, "token": token}

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process session_id from Emergent Google OAuth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id for user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Auth service unavailable")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Find or create user
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "phone": None,
            "password": None,
            "loyalty_points": 0,
            "addresses": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0, "addresses": 0})
    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return {"user": user, "token": session_token}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_data = {k: v for k, v in user.items() if k not in ["password", "addresses"]}
    if isinstance(user_data.get("created_at"), str):
        user_data["created_at"] = datetime.fromisoformat(user_data["created_at"])
    return user_data

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out"}

# ==================== USER ENDPOINTS ====================

@api_router.put("/users/profile")
async def update_profile(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    allowed_fields = ["name", "phone"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0})
    return updated_user

@api_router.put("/users/password")
async def change_password(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    current_password = body.get("current_password")
    new_password = body.get("new_password")
    
    if not user.get("password"):
        raise HTTPException(status_code=400, detail="Cannot change password for OAuth users")
    
    if not verify_password(current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    
    hashed = hash_password(new_password)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"password": hashed}})
    return {"message": "Password updated"}

# ==================== ADDRESS ENDPOINTS ====================

@api_router.get("/users/addresses")
async def get_addresses(user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "addresses": 1})
    return user_doc.get("addresses", [])

@api_router.post("/users/addresses")
async def add_address(address: AddressCreate, user: dict = Depends(get_current_user)):
    address_id = f"addr_{uuid.uuid4().hex[:8]}"
    address_doc = {
        "address_id": address_id,
        **address.model_dump()
    }
    
    if address.is_default:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"addresses.$[].is_default": False}}
        )
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$push": {"addresses": address_doc}}
    )
    return address_doc

@api_router.put("/users/addresses/{address_id}")
async def update_address(address_id: str, address: AddressCreate, user: dict = Depends(get_current_user)):
    if address.is_default:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"addresses.$[].is_default": False}}
        )
    
    address_doc = {"address_id": address_id, **address.model_dump()}
    await db.users.update_one(
        {"user_id": user["user_id"], "addresses.address_id": address_id},
        {"$set": {"addresses.$": address_doc}}
    )
    return address_doc

@api_router.delete("/users/addresses/{address_id}")
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$pull": {"addresses": {"address_id": address_id}}}
    )
    return {"message": "Address deleted"}

# ==================== PRODUCT ENDPOINTS ====================

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    country: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "name",
    limit: int = 50,
    skip: int = 0
):
    query = {}
    if category:
        query["category"] = category
    if country:
        query["origin_country"] = country
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    sort_field = "name"
    sort_order = 1
    if sort == "price_asc":
        sort_field, sort_order = "price", 1
    elif sort == "price_desc":
        sort_field, sort_order = "price", -1
    elif sort == "rating":
        sort_field, sort_order = "rating", -1
    elif sort == "newest":
        sort_field, sort_order = "created_at", -1
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_field, sort_order).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    
    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    
    return {"products": products, "total": total}

@api_router.get("/products/popular")
async def get_popular_products(limit: int = 8):
    products = await db.products.find({}, {"_id": 0}).sort("rating", -1).limit(limit).to_list(limit)
    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    return product

# ==================== CATEGORY ENDPOINTS ====================

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

# ==================== RECIPE ENDPOINTS ====================

@api_router.get("/recipes")
async def get_recipes(
    country: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    skip: int = 0
):
    query = {}
    if country:
        query["origin_country"] = country
    if difficulty:
        query["difficulty"] = difficulty
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    recipes = await db.recipes.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.recipes.count_documents(query)
    
    for r in recipes:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    
    return {"recipes": recipes, "total": total}

@api_router.get("/recipes/featured")
async def get_featured_recipes(limit: int = 4):
    recipes = await db.recipes.find({}, {"_id": 0}).limit(limit).to_list(limit)
    for r in recipes:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    return recipes

@api_router.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: str):
    recipe = await db.recipes.find_one({"recipe_id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if isinstance(recipe.get("created_at"), str):
        recipe["created_at"] = datetime.fromisoformat(recipe["created_at"])
    return recipe

@api_router.get("/recipes/by-product/{product_id}")
async def get_recipes_by_product(product_id: str):
    recipes = await db.recipes.find(
        {"ingredients.product_id": product_id},
        {"_id": 0}
    ).to_list(10)
    for r in recipes:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    return recipes

# ==================== CART ENDPOINTS ====================

@api_router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not cart:
        cart = {"cart_id": f"cart_{uuid.uuid4().hex[:8]}", "user_id": user["user_id"], "items": []}
    
    # Populate product details
    items_with_details = []
    subtotal = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price"] * item["quantity"]
            items_with_details.append({
                **item,
                "product": product,
                "total": item_total
            })
            subtotal += item_total
    
    minimum_reached = subtotal >= 50
    amount_to_minimum = max(0, 50 - subtotal)
    
    return {
        "cart_id": cart.get("cart_id", ""),
        "user_id": user["user_id"],
        "items": items_with_details,
        "subtotal": round(subtotal, 2),
        "minimum_reached": minimum_reached,
        "amount_to_minimum": round(amount_to_minimum, 2)
    }

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if not cart:
        cart = {
            "cart_id": f"cart_{uuid.uuid4().hex[:8]}",
            "user_id": user["user_id"],
            "items": []
        }
        await db.carts.insert_one(cart)
    
    # Check if product already in cart
    existing_item = next((i for i in cart.get("items", []) if i["product_id"] == item.product_id), None)
    
    if existing_item:
        await db.carts.update_one(
            {"user_id": user["user_id"], "items.product_id": item.product_id},
            {"$inc": {"items.$.quantity": item.quantity}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user["user_id"]},
            {"$push": {"items": {"product_id": item.product_id, "quantity": item.quantity}}}
        )
    
    return await get_cart(user)

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, user: dict = Depends(get_current_user)):
    if item.quantity <= 0:
        await db.carts.update_one(
            {"user_id": user["user_id"]},
            {"$pull": {"items": {"product_id": item.product_id}}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user["user_id"], "items.product_id": item.product_id},
            {"$set": {"items.$.quantity": item.quantity}}
        )
    
    return await get_cart(user)

@api_router.delete("/cart/item/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["user_id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return await get_cart(user)

@api_router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"items": []}}
    )
    return {"message": "Cart cleared"}

@api_router.post("/cart/add-recipe-ingredients")
async def add_recipe_ingredients(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    recipe_id = body.get("recipe_id")
    servings = body.get("servings", 1)
    
    recipe = await db.recipes.find_one({"recipe_id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    base_servings = recipe.get("servings", 1)
    multiplier = servings / base_servings
    
    for ingredient in recipe.get("ingredients", []):
        product = await db.products.find_one({"product_id": ingredient["product_id"]}, {"_id": 0})
        if product:
            quantity = max(1, round(ingredient["quantity"] * multiplier))
            await add_to_cart(CartItem(product_id=ingredient["product_id"], quantity=quantity), user)
    
    return await get_cart(user)

# ==================== ORDER ENDPOINTS ====================

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    cart = await get_cart(user)
    
    if not cart["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    if not cart["minimum_reached"]:
        raise HTTPException(status_code=400, detail=f"Minimum order is 50€. Add {cart['amount_to_minimum']}€ more.")
    
    # Get address
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    address = next((a for a in user_doc.get("addresses", []) if a["address_id"] == order_data.address_id), None)
    if not address:
        raise HTTPException(status_code=400, detail="Address not found")
    
    # Calculate totals
    subtotal = cart["subtotal"]
    delivery_fee = 4.99 if subtotal < 80 else 0
    
    loyalty_discount = 0
    if order_data.use_loyalty_points and user_doc.get("loyalty_points", 0) >= 100:
        loyalty_discount = 5.0
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$inc": {"loyalty_points": -100}}
        )
    
    total = subtotal + delivery_fee - loyalty_discount
    
    # Create order
    import random as _random
    driver_names = ["Mamadou D.", "Ibrahim K.", "Fatou S.", "Abdoulaye M.", "Aïssatou B.", "Moussa T."]
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    order = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "items": [{"product_id": i["product_id"], "quantity": i["quantity"], "price": i["product"]["price"], "name": i["product"]["name"]} for i in cart["items"]],
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "loyalty_discount": loyalty_discount,
        "total": round(total, 2),
        "status": "pending",
        "address": address,
        "delivery_date": order_data.delivery_date,
        "delivery_slot": order_data.delivery_slot,
        "delivery_details": order_data.delivery_details,
        "driver_name": _random.choice(driver_names),
        "driver_phone": f"06 {_random.randint(10,99)} {_random.randint(10,99)} {_random.randint(10,99)} {_random.randint(10,99)}",
        "tracking": {
            "steps": [
                {"status": "pending", "label": "Commande confirmée", "time": datetime.now(timezone.utc).isoformat(), "done": True},
                {"status": "preparing", "label": "En préparation", "time": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(), "done": False},
                {"status": "delivering", "label": "En livraison", "time": (datetime.now(timezone.utc) + timedelta(minutes=90)).isoformat(), "done": False},
                {"status": "delivered", "label": "Livrée", "time": (datetime.now(timezone.utc) + timedelta(minutes=150)).isoformat(), "done": False}
            ],
            "estimated_arrival": (datetime.now(timezone.utc) + timedelta(minutes=150)).isoformat(),
            "current_lat": 48.8566 + _random.uniform(-0.05, 0.05),
            "current_lng": 2.3522 + _random.uniform(-0.05, 0.05)
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order)
    
    # Remove MongoDB _id from order before returning
    order.pop("_id", None)
    
    # Add loyalty points (1€ = 1 point)
    points_earned = int(subtotal)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"loyalty_points": points_earned}}
    )
    
    # Clear cart
    await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": []}})
    
    # Check if this is user's first order - award referral points
    user_order_count = await db.orders.count_documents({"user_id": user["user_id"]})
    if user_order_count == 1:  # This is the first order (just created)
        pending_referral = await db.referrals.find_one({"referred_id": user["user_id"], "points_awarded": False}, {"_id": 0})
        if pending_referral:
            await db.users.update_one({"user_id": pending_referral["referrer_id"]}, {"$inc": {"loyalty_points": 200}})
            await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"loyalty_points": 200}})
            await db.referrals.update_one({"referred_id": user["user_id"]}, {"$set": {"points_awarded": True}})
    
    return {"order": order, "points_earned": points_earned}

@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    if order["status"] != "pending":
        raise HTTPException(status_code=400, detail="Seules les commandes en attente peuvent être annulées.")
    
    # Check 48h before delivery date
    delivery_date_str = order.get("delivery_date", "")
    try:
        delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        hours_until = (delivery_date - datetime.now(timezone.utc)).total_seconds() / 3600
        if hours_until < 48:
            raise HTTPException(status_code=400, detail="L'annulation n'est possible que jusqu'à 48h avant la date de livraison.")
    except ValueError:
        pass
    
    # Deduct loyalty points earned from this order
    points_to_deduct = int(order.get("subtotal", 0))
    if points_to_deduct > 0:
        user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
        current_points = user_doc.get("loyalty_points", 0)
        actual_deduction = min(points_to_deduct, current_points)
        if actual_deduction > 0:
            await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"loyalty_points": -actual_deduction}})
    
    await db.orders.update_one({"order_id": order_id}, {"$set": {
        "status": "cancelled",
        "cancelled_at": datetime.now(timezone.utc).isoformat(),
        "points_deducted": points_to_deduct
    }})
    
    return {
        "message": "Commande annulée. Le remboursement sera effectué sous 10 jours sur votre carte de paiement.",
        "refund_amount": order["total"],
        "points_deducted": points_to_deduct
    }

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user), page: int = 1, per_page: int = 5):
    skip = (page - 1) * per_page
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
    total = await db.orders.count_documents({"user_id": user["user_id"]})
    for o in orders:
        if isinstance(o.get("created_at"), str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
    return {"orders": orders, "total": total, "page": page, "per_page": per_page, "total_pages": max(1, (total + per_page - 1) // per_page)}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    return order

# ==================== LOYALTY ENDPOINTS ====================

@api_router.get("/loyalty")
async def get_loyalty(user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    points = user_doc.get("loyalty_points", 0)
    rewards_available = points // 100
    progress = points % 100
    
    return {
        "points": points,
        "rewards_available": rewards_available,
        "next_reward_progress": progress,
        "reward_value": 5.0
    }

# ==================== REVIEW ENDPOINTS ====================

@api_router.get("/reviews/{product_id}")
async def get_product_reviews(product_id: str, limit: int = 10):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    for r in reviews:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    return reviews

@api_router.get("/reviews/order/{order_id}")
async def get_order_reviews(order_id: str, user: dict = Depends(get_current_user)):
    """Get all reviews submitted by the user for a specific order"""
    product_reviews = await db.reviews.find(
        {"order_id": order_id, "user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    driver_review = await db.driver_reviews.find_one(
        {"order_id": order_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    return {
        "product_reviews": product_reviews,
        "driver_review": driver_review,
        "has_reviews": len(product_reviews) > 0 or driver_review is not None
    }

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user)):
    # Check minimum comment length
    if len(review.comment.strip()) < 20:
        raise HTTPException(status_code=400, detail="L'avis doit contenir au moins 20 caractères.")
    
    # Check if user already reviewed this product
    existing = await db.reviews.find_one({
        "product_id": review.product_id,
        "user_id": user["user_id"]
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà donné un avis pour ce produit.")
    
    review_id = f"rev_{uuid.uuid4().hex[:8]}"
    review_doc = {
        "review_id": review_id,
        "product_id": review.product_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "image_urls": review.image_urls,
        "order_id": review.order_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    # Update product rating
    pipeline = [
        {"$match": {"product_id": review.product_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if result:
        await db.products.update_one(
            {"product_id": review.product_id},
            {"$set": {"rating": round(result[0]["avg_rating"], 1), "reviews_count": result[0]["count"]}}
        )
    
    # Award 5 loyalty points for review
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"loyalty_points": 5}})
    
    # Exclude MongoDB _id from response
    response_doc = {k: v for k, v in review_doc.items() if k != "_id"}
    return {**response_doc, "points_earned": 5}

class DriverReviewCreate(BaseModel):
    order_id: str
    rating: int
    comment: str

@api_router.post("/reviews/driver")
async def review_driver(review: DriverReviewCreate, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": review.order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    if len(review.comment.strip()) < 20:
        raise HTTPException(status_code=400, detail="L'avis doit contenir au moins 20 caractères.")
    
    # Check if already reviewed this order's driver
    existing = await db.driver_reviews.find_one({"order_id": review.order_id, "user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà noté le livreur pour cette commande.")
    
    review_id = f"drev_{uuid.uuid4().hex[:8]}"
    review_doc = {
        "review_id": review_id,
        "order_id": review.order_id,
        "driver_name": order.get("driver_name"),
        "user_id": user["user_id"],
        "user_name": user["name"],
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.driver_reviews.insert_one(review_doc)
    
    # Award 5 loyalty points
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"loyalty_points": 5}})
    
    # Exclude MongoDB _id from response
    response_doc = {k: v for k, v in review_doc.items() if k != "_id"}
    return {**response_doc, "points_earned": 5}

@api_router.get("/driver/{driver_name}/info")
async def get_driver_info(driver_name: str):
    reviews = await db.driver_reviews.find({"driver_name": driver_name}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    total_reviews = await db.driver_reviews.count_documents({"driver_name": driver_name})
    
    avg_rating = 4.8
    if reviews:
        avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 1)
    
    # Simulated driver profile
    driver_photos = {
        "Mamadou D.": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        "Ibrahim K.": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
        "Fatou S.": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        "Abdoulaye M.": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        "Aïssatou B.": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        "Moussa T.": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    }
    
    return {
        "name": driver_name,
        "photo": driver_photos.get(driver_name, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"),
        "rating": avg_rating,
        "total_reviews": total_reviews,
        "total_deliveries": total_reviews + 127,
        "recent_reviews": reviews
    }

# ==================== CONTACT & NEWSLETTER ====================

@api_router.post("/contact")
async def submit_contact(contact: ContactCreate):
    contact_id = f"contact_{uuid.uuid4().hex[:8]}"
    contact_doc = {
        "contact_id": contact_id,
        **contact.model_dump(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contacts.insert_one(contact_doc)
    return {"message": "Message sent successfully", "contact_id": contact_id}

@api_router.post("/newsletter")
async def subscribe_newsletter(subscription: NewsletterSubscribe):
    existing = await db.newsletter.find_one({"email": subscription.email}, {"_id": 0})
    if existing:
        return {"message": "Already subscribed"}
    
    await db.newsletter.insert_one({
        "email": subscription.email,
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Subscribed successfully"}

# ==================== DELIVERY ZONE & FAQ ====================

@api_router.post("/delivery-zone/check")
async def check_zone(data: DeliveryZoneCheck):
    result = check_delivery_zone_by_postcode(data.postcode)
    return result

# ==================== PROMO CODES ====================

PROMO_CODES = {
    "BIENVENUE10": {"discount_percent": 10, "min_order": 50, "description": "10% de réduction"},
    "KOYA20": {"discount_percent": 20, "min_order": 80, "description": "20% de réduction"},
    "LIVRAISON": {"discount_amount": 4.99, "min_order": 50, "description": "Livraison offerte"},
}

@api_router.post("/promo/validate")
async def validate_promo_code(data: PromoCodeCheck, user: dict = Depends(get_current_user)):
    code = data.code.upper().strip()
    
    if code not in PROMO_CODES:
        raise HTTPException(status_code=400, detail="Code promo invalide")
    
    promo = PROMO_CODES[code]
    return {
        "valid": True,
        "code": code,
        "discount_percent": promo.get("discount_percent"),
        "discount_amount": promo.get("discount_amount"),
        "min_order": promo.get("min_order"),
        "description": promo.get("description")
    }

# ==================== LOYALTY CODE ====================

@api_router.post("/loyalty/redeem")
async def redeem_loyalty_code(data: LoyaltyCodeRedeem, user: dict = Depends(get_current_user)):
    """Redeem loyalty points using a code. User generates code from their account, then enters it at checkout."""
    code = data.code.upper().strip()
    
    # Check if this is a valid loyalty code for this user
    loyalty_code = await db.loyalty_codes.find_one({"code": code, "user_id": user["user_id"], "used": False}, {"_id": 0})
    
    if not loyalty_code:
        raise HTTPException(status_code=400, detail="Code fidélité invalide ou déjà utilisé")
    
    # Mark code as used
    await db.loyalty_codes.update_one(
        {"code": code},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "valid": True,
        "discount_amount": loyalty_code.get("value", 5.0),
        "message": "Code fidélité appliqué avec succès !"
    }

class LoyaltyCodeGenerate(BaseModel):
    points_to_use: int

@api_router.post("/loyalty/generate-code")
async def generate_loyalty_code(body: LoyaltyCodeGenerate, user: dict = Depends(get_current_user)):
    """Generate a loyalty code. points_to_use must be a multiple of 100. Each 100pts = 5€."""
    pts = body.points_to_use
    if pts < 100 or pts % 100 != 0:
        raise HTTPException(status_code=400, detail="Le nombre de points doit être un multiple de 100 (min 100).")
    
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    points = user_doc.get("loyalty_points", 0)
    
    if points < pts:
        raise HTTPException(status_code=400, detail=f"Vous avez {points} points. Il vous en faut {pts}.")
    
    value = (pts // 100) * 5.0
    code = f"FIDELITE-{uuid.uuid4().hex[:8].upper()}"
    
    await db.loyalty_codes.insert_one({
        "code": code,
        "user_id": user["user_id"],
        "value": value,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"loyalty_points": -pts}})
    
    return {
        "code": code,
        "value": value,
        "points_used": pts,
        "message": f"Code de {value:.0f}€ généré ! Utilisez-le dans votre panier."
    }

@api_router.get("/faq")
async def get_faq(category: Optional[str] = None):
    if category:
        return [f for f in FAQ_DATA if f["category"] == category]
    return FAQ_DATA

# ==================== REFERRAL SYSTEM ====================

@api_router.get("/referral")
async def get_referral_info(user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    referral_code = user_doc.get("referral_code")
    if not referral_code:
        referral_code = f"KOYA-{user['user_id'][-6:].upper()}"
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"referral_code": referral_code}})
    
    referrals_count = await db.referrals.count_documents({"referrer_id": user["user_id"], "points_awarded": True})
    pending_count = await db.referrals.count_documents({"referrer_id": user["user_id"], "points_awarded": False})
    return {
        "referral_code": referral_code,
        "referrals_count": referrals_count,
        "pending_referrals": pending_count,
        "points_per_referral": 200
    }

@api_router.post("/referral/apply")
async def apply_referral(data: ReferralApply, user: dict = Depends(get_current_user)):
    code = data.referral_code.upper().strip()
    
    referrer = await db.users.find_one({"referral_code": code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=400, detail="Code de parrainage invalide")
    if referrer["user_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas utiliser votre propre code")
    
    existing = await db.referrals.find_one({"referred_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà utilisé un code de parrainage")
    
    # Store referral but DON'T award points yet - only after first purchase
    await db.referrals.insert_one({
        "referrer_id": referrer["user_id"],
        "referred_id": user["user_id"],
        "code": code,
        "points_awarded": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Code de parrainage enregistré ! Les 200 points seront attribués après votre première commande."}

# ==================== JOBS ====================

JOBS_DATA = [
    {
        "id": "livreur", "title": "Livreur / Livreuse", "location": "Paris & IDF", "type": "CDI / Temps partiel",
        "salary": "1 800€ - 2 200€ brut/mois", "department": "Logistique",
        "description": "Rejoignez notre équipe de livraison et participez à la satisfaction de nos clients en livrant des produits afro-caribéens de qualité à domicile.",
        "missions": ["Assurer les livraisons dans les délais impartis (3h max)", "Garantir la qualité des produits pendant le transport", "Offrir un service client irréprochable à chaque livraison", "Gérer les retours et réclamations sur le terrain", "Entretenir le véhicule de livraison"],
        "requirements": ["Permis B obligatoire", "Connaissance de Paris et de l'Île-de-France", "Ponctualité et sens du service", "Bonne condition physique", "Smartphone requis pour l'application de livraison"],
        "benefits": ["Primes sur objectifs", "Véhicule fourni", "Mutuelle d'entreprise", "Tickets restaurant", "Réductions sur les produits KÔYA"]
    },
    {
        "id": "preparateur", "title": "Préparateur / Préparatrice de commandes", "location": "Paris", "type": "CDI",
        "salary": "1 900€ - 2 300€ brut/mois", "department": "Entrepôt",
        "description": "Vous serez en charge de préparer les commandes clients avec soin, en respectant les normes de qualité et les délais de traitement.",
        "missions": ["Préparer les commandes clients avec précision", "Vérifier la qualité et la conformité des produits", "Gérer les stocks et signaler les ruptures", "Organiser l'espace de stockage", "Respecter les normes d'hygiène alimentaire"],
        "requirements": ["Expérience en logistique souhaitée", "Rigueur et sens de l'organisation", "Capacité à travailler en équipe", "Bonne condition physique (port de charges)", "Connaissance des produits alimentaires appréciée"],
        "benefits": ["CDI dès l'embauche", "Horaires fixes", "Mutuelle d'entreprise", "Tickets restaurant", "Ambiance multiculturelle"]
    },
    {
        "id": "marketing", "title": "Chargé(e) Marketing Digital", "location": "Paris", "type": "CDI",
        "salary": "2 800€ - 3 500€ brut/mois", "department": "Marketing",
        "description": "Vous piloterez la stratégie digitale de KÔYA Market pour accroître la notoriété et développer l'acquisition client.",
        "missions": ["Concevoir et piloter les campagnes marketing digitales", "Gérer les réseaux sociaux (Instagram, TikTok, Facebook)", "Analyser les KPIs et optimiser les performances", "Créer du contenu engageant (visuels, vidéos, rédactionnel)", "Collaborer avec les influenceurs et partenaires"],
        "requirements": ["Bac+3/5 en Marketing Digital", "3+ ans d'expérience en marketing digital", "Maîtrise des outils analytics (GA4, Meta Business)", "Créativité et sensibilité culturelle", "Connaissance de la culture afro-caribéenne appréciée"],
        "benefits": ["Télétravail 2j/semaine", "Macbook Pro fourni", "Budget formation", "Tickets restaurant", "Ambiance startup dynamique"]
    },
    {
        "id": "dev", "title": "Développeur / Développeuse Full Stack", "location": "Remote", "type": "CDI",
        "salary": "3 500€ - 5 000€ brut/mois", "department": "Tech",
        "description": "Vous contribuerez au développement de la plateforme e-commerce KÔYA Market et de son application mobile.",
        "missions": ["Développer de nouvelles fonctionnalités (React, Python/FastAPI)", "Optimiser les performances de la plateforme", "Participer aux code reviews et à l'architecture", "Maintenir et améliorer l'infrastructure cloud", "Collaborer avec l'équipe produit"],
        "requirements": ["3+ ans d'expérience en développement web", "Maîtrise de React et Python", "Expérience avec MongoDB et les APIs REST", "Connaissances en DevOps appréciées", "Esprit d'équipe et autonomie"],
        "benefits": ["100% Remote", "Macbook Pro fourni", "Budget formation annuel", "Stock-options", "Semaine de 4 jours possible"]
    },
    {
        "id": "sav", "title": "Conseiller / Conseillère Service Client", "location": "Paris", "type": "CDI / CDD",
        "salary": "2 000€ - 2 400€ brut/mois", "department": "Service Client",
        "description": "Vous serez le premier point de contact de nos clients et garantirez leur satisfaction à chaque interaction.",
        "missions": ["Répondre aux demandes clients par chat, email et téléphone", "Traiter les réclamations et trouver des solutions", "Suivre les commandes et résoudre les problèmes de livraison", "Alimenter la FAQ et les guides d'aide", "Remonter les feedbacks clients à l'équipe produit"],
        "requirements": ["Expérience en relation client", "Excellente communication écrite et orale", "Empathie et patience", "Maîtrise des outils CRM", "Langues : Français courant, Anglais apprécié"],
        "benefits": ["Formation complète", "Horaires flexibles", "Mutuelle d'entreprise", "Tickets restaurant", "Évolution possible vers Team Lead"]
    }
]

@api_router.get("/jobs")
async def get_jobs():
    return JOBS_DATA

@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = next((j for j in JOBS_DATA if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Poste non trouvé")
    return job

# ==================== ORDER TRACKING ====================

@api_router.get("/orders/{order_id}/tracking")
async def get_order_tracking(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Simulate tracking progress based on time elapsed
    import random as _rand
    created_at = datetime.fromisoformat(order["created_at"]) if isinstance(order["created_at"], str) else order["created_at"]
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - created_at).total_seconds() / 60
    
    tracking = order.get("tracking", {})
    steps = tracking.get("steps", [])
    
    # Simulate progression
    if elapsed >= 5:
        for s in steps:
            if s["status"] == "preparing":
                s["done"] = True
    if elapsed >= 15:
        for s in steps:
            if s["status"] == "delivering":
                s["done"] = True
        current_status = "delivering"
    if elapsed >= 30:
        for s in steps:
            s["done"] = True
        current_status = "delivered"
    
    if elapsed < 5:
        current_status = "pending"
    elif elapsed < 15:
        current_status = "preparing"
    elif elapsed < 30:
        current_status = "delivering"
    else:
        current_status = "delivered"
    
    # Update order status in DB
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": current_status, "tracking.steps": steps}})
    
    # Simulate driver position moving toward delivery address
    dest_lat = 48.8566 + _rand.uniform(-0.02, 0.02)
    dest_lng = 2.3522 + _rand.uniform(-0.02, 0.02)
    
    eta_minutes = max(0, int(30 - elapsed)) if elapsed < 30 else 0
    
    return {
        "order_id": order_id,
        "status": current_status,
        "driver_name": order.get("driver_name", "Mamadou D."),
        "driver_phone": order.get("driver_phone", "06 12 34 56 78"),
        "steps": steps,
        "estimated_arrival": f"{eta_minutes} min" if eta_minutes > 0 else "Livrée",
        "driver_lat": dest_lat,
        "driver_lng": dest_lng,
        "delivery_slot": order.get("delivery_slot"),
        "delivery_date": order.get("delivery_date")
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "KÔYA Market API", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ==================== SEED DATA ====================

@app.on_event("startup")
async def seed_data():
    """Seed initial data if database is empty"""
    
    # Seed categories
    if await db.categories.count_documents({}) == 0:
        categories = [
            {"category_id": "cat_epicerie_afr", "name": "Épicerie Africaine", "slug": "epicerie-africaine", "image_url": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400", "product_count": 0},
            {"category_id": "cat_epicerie_car", "name": "Épicerie Caribéenne", "slug": "epicerie-caribeenne", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400", "product_count": 0},
            {"category_id": "cat_viande", "name": "Viande", "slug": "viande", "image_url": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400", "product_count": 0},
            {"category_id": "cat_poisson", "name": "Poisson", "slug": "poisson", "image_url": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400", "product_count": 0},
            {"category_id": "cat_boissons", "name": "Boissons", "slug": "boissons", "image_url": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400", "product_count": 0},
            {"category_id": "cat_beaute", "name": "Beauté", "slug": "beaute", "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", "product_count": 0},
            {"category_id": "cat_textile", "name": "Textile", "slug": "textile", "image_url": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400", "product_count": 0},
            {"category_id": "cat_fruits", "name": "Fruits", "slug": "fruits", "image_url": "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400", "product_count": 0},
            {"category_id": "cat_legumes", "name": "Légumes", "slug": "legumes", "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400", "product_count": 0},
            {"category_id": "cat_riz", "name": "Riz", "slug": "riz", "image_url": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400", "product_count": 0},
            {"category_id": "cat_sauces", "name": "Sauces", "slug": "sauces", "image_url": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400", "product_count": 0},
        ]
        await db.categories.insert_many(categories)
        logger.info("Categories seeded")
    
    # Seed products
    if await db.products.count_documents({}) == 0:
        products = [
            {"product_id": "prod_001", "name": "Plantain Mûr", "description": "Plantains mûrs parfaits pour frire ou griller. Doux et savoureux.", "price": 3.99, "category": "fruits", "origin_country": "Cameroun", "image_url": "https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=400", "stock": 100, "unit": "kg", "rating": 4.8, "reviews_count": 45, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_002", "name": "Igname Blanche", "description": "Igname de qualité supérieure, idéale pour le foufou ou en frites.", "price": 5.49, "category": "legumes", "origin_country": "Côte d'Ivoire", "image_url": "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400", "stock": 80, "unit": "kg", "rating": 4.7, "reviews_count": 32, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_003", "name": "Riz Parfumé Basmati", "description": "Riz basmati long grain, parfumé et léger.", "price": 8.99, "category": "riz", "origin_country": "Sénégal", "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "stock": 150, "unit": "kg", "rating": 4.9, "reviews_count": 67, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_004", "name": "Huile de Palme Rouge", "description": "Huile de palme traditionnelle non raffinée pour vos plats authentiques.", "price": 7.49, "category": "sauces", "origin_country": "Nigeria", "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "stock": 60, "unit": "litre", "rating": 4.6, "reviews_count": 28, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_005", "name": "Tilapia Frais", "description": "Tilapia frais entier, pêché de manière responsable.", "price": 12.99, "category": "poisson", "origin_country": "Sénégal", "image_url": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400", "stock": 40, "unit": "kg", "rating": 4.8, "reviews_count": 51, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_006", "name": "Poulet Fermier", "description": "Poulet entier élevé en plein air, tendre et savoureux.", "price": 14.99, "category": "viande", "origin_country": "France", "image_url": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400", "stock": 50, "unit": "pièce", "rating": 4.9, "reviews_count": 89, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_007", "name": "Gingembre Frais", "description": "Gingembre frais biologique aux arômes intenses.", "price": 4.99, "category": "legumes", "origin_country": "Nigeria", "image_url": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400", "stock": 70, "unit": "kg", "rating": 4.5, "reviews_count": 23, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_008", "name": "Bissap (Fleurs d'Hibiscus)", "description": "Fleurs d'hibiscus séchées pour votre jus de bissap traditionnel.", "price": 6.99, "category": "boissons", "origin_country": "Sénégal", "image_url": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400", "stock": 90, "unit": "sachet", "rating": 4.7, "reviews_count": 56, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_009", "name": "Beurre de Karité Pur", "description": "Beurre de karité 100% naturel pour la peau et les cheveux.", "price": 11.99, "category": "beaute", "origin_country": "Ghana", "image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400", "stock": 45, "unit": "pot", "rating": 4.8, "reviews_count": 72, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_010", "name": "Piment Habanero", "description": "Piments habanero frais, très piquants pour relever vos plats.", "price": 3.49, "category": "legumes", "origin_country": "Antilles", "image_url": "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400", "stock": 55, "unit": "sachet", "rating": 4.6, "reviews_count": 34, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_011", "name": "Mangue Kent", "description": "Mangue Kent juteuse et sucrée, mûrie au soleil.", "price": 4.49, "category": "fruits", "origin_country": "Côte d'Ivoire", "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400", "stock": 65, "unit": "pièce", "rating": 4.9, "reviews_count": 98, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_012", "name": "Attieke", "description": "Semoule de manioc traditionnelle ivoirienne.", "price": 5.99, "category": "riz", "origin_country": "Côte d'Ivoire", "image_url": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400", "stock": 75, "unit": "sachet", "rating": 4.7, "reviews_count": 43, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_013", "name": "Pagne Wax Africain", "description": "Tissu wax authentique aux motifs colorés.", "price": 24.99, "category": "textile", "origin_country": "Ghana", "image_url": "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400", "stock": 30, "unit": "mètre", "rating": 4.8, "reviews_count": 27, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_014", "name": "Cube Maggi", "description": "Cubes de bouillon pour assaisonner vos plats.", "price": 2.99, "category": "sauces", "origin_country": "Nigeria", "image_url": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400", "stock": 200, "unit": "boîte", "rating": 4.5, "reviews_count": 112, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_015", "name": "Jus de Gingembre", "description": "Boisson au gingembre frais, énergisante et épicée.", "price": 4.99, "category": "boissons", "origin_country": "Sénégal", "image_url": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400", "stock": 85, "unit": "bouteille", "rating": 4.6, "reviews_count": 39, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_016", "name": "Viande de Boeuf", "description": "Viande de boeuf fraîche de qualité supérieure.", "price": 18.99, "category": "viande", "origin_country": "France", "image_url": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400", "stock": 35, "unit": "kg", "rating": 4.8, "reviews_count": 64, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_017", "name": "Manioc (Kwanga)", "description": "Manioc frais traditionnel, base de nombreux plats africains.", "price": 4.99, "category": "epicerie-africaine", "origin_country": "Congo", "image_url": "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400", "stock": 60, "unit": "kg", "rating": 4.7, "reviews_count": 38, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_018", "name": "Foufou / Farine de Manioc", "description": "Farine de manioc premium pour préparer le foufou traditionnel.", "price": 6.49, "category": "epicerie-africaine", "origin_country": "Cameroun", "image_url": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400", "stock": 80, "unit": "sachet", "rating": 4.6, "reviews_count": 42, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_019", "name": "Semoule de Maïs", "description": "Semoule de maïs fine pour accompagnements et bouillies.", "price": 3.99, "category": "epicerie-africaine", "origin_country": "Côte d'Ivoire", "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", "stock": 90, "unit": "sachet", "rating": 4.5, "reviews_count": 29, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_020", "name": "Chips de Plantain", "description": "Chips de plantain croustillantes, snack savoureux des Caraïbes.", "price": 3.49, "category": "epicerie-caribeenne", "origin_country": "Antilles", "image_url": "https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=400", "stock": 100, "unit": "sachet", "rating": 4.8, "reviews_count": 55, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_021", "name": "Bonbons Tropicaux", "description": "Assortiment de bonbons aux saveurs tropicales : mangue, coco, goyave.", "price": 4.99, "category": "epicerie-caribeenne", "origin_country": "Antilles", "image_url": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400", "stock": 75, "unit": "sachet", "rating": 4.4, "reviews_count": 33, "created_at": datetime.now(timezone.utc).isoformat()},
            {"product_id": "prod_022", "name": "Sucre de Canne", "description": "Sucre de canne pur non raffiné, au goût authentique des Antilles.", "price": 5.49, "category": "epicerie-caribeenne", "origin_country": "Antilles", "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", "stock": 65, "unit": "kg", "rating": 4.6, "reviews_count": 27, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.products.insert_many(products)
        logger.info("Products seeded")
    
    # Seed recipes
    if await db.recipes.count_documents({}) == 0:
        recipes = [
            {
                "recipe_id": "rec_001",
                "name": "Thiéboudienne",
                "description": "Le plat national sénégalais : riz au poisson avec légumes et sauce tomate.",
                "origin_country": "Sénégal",
                "image_url": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600",
                "prep_time": 30,
                "cook_time": 60,
                "difficulty": "Moyen",
                "servings": 4,
                "ingredients": [
                    {"product_id": "prod_003", "name": "Riz Parfumé Basmati", "quantity": 0.5, "unit": "kg", "base_servings": 4},
                    {"product_id": "prod_005", "name": "Tilapia Frais", "quantity": 1, "unit": "kg", "base_servings": 4},
                    {"product_id": "prod_004", "name": "Huile de Palme Rouge", "quantity": 0.1, "unit": "litre", "base_servings": 4},
                    {"product_id": "prod_014", "name": "Cube Maggi", "quantity": 2, "unit": "pièce", "base_servings": 4},
                ],
                "steps": [
                    "Nettoyer et assaisonner le poisson avec sel, poivre et épices.",
                    "Faire revenir les légumes dans l'huile de palme.",
                    "Ajouter la sauce tomate et le poisson, laisser mijoter.",
                    "Cuire le riz dans le bouillon parfumé.",
                    "Servir le riz garni de poisson et légumes."
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "recipe_id": "rec_002",
                "name": "Poulet Yassa",
                "description": "Poulet mariné aux oignons et citron, spécialité sénégalaise.",
                "origin_country": "Sénégal",
                "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600",
                "prep_time": 20,
                "cook_time": 45,
                "difficulty": "Facile",
                "servings": 4,
                "ingredients": [
                    {"product_id": "prod_006", "name": "Poulet Fermier", "quantity": 1, "unit": "pièce", "base_servings": 4},
                    {"product_id": "prod_003", "name": "Riz Parfumé Basmati", "quantity": 0.4, "unit": "kg", "base_servings": 4},
                    {"product_id": "prod_014", "name": "Cube Maggi", "quantity": 1, "unit": "pièce", "base_servings": 4},
                ],
                "steps": [
                    "Mariner le poulet avec oignons, citron et moutarde pendant 2h.",
                    "Griller le poulet jusqu'à coloration dorée.",
                    "Faire revenir les oignons marinés.",
                    "Ajouter le poulet et laisser mijoter.",
                    "Servir avec du riz blanc."
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "recipe_id": "rec_003",
                "name": "Alloco",
                "description": "Plantains frits croustillants, accompagnement populaire ivoirien.",
                "origin_country": "Côte d'Ivoire",
                "image_url": "https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=600",
                "prep_time": 10,
                "cook_time": 15,
                "difficulty": "Facile",
                "servings": 2,
                "ingredients": [
                    {"product_id": "prod_001", "name": "Plantain Mûr", "quantity": 0.5, "unit": "kg", "base_servings": 2},
                    {"product_id": "prod_010", "name": "Piment Habanero", "quantity": 1, "unit": "pièce", "base_servings": 2},
                ],
                "steps": [
                    "Éplucher et couper les plantains en rondelles.",
                    "Chauffer l'huile à feu moyen-vif.",
                    "Frire les plantains jusqu'à coloration dorée.",
                    "Égoutter sur du papier absorbant.",
                    "Servir chaud avec sauce pimentée."
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "recipe_id": "rec_004",
                "name": "Ndolé",
                "description": "Plat traditionnel camerounais aux feuilles amères et arachides.",
                "origin_country": "Cameroun",
                "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
                "prep_time": 45,
                "cook_time": 90,
                "difficulty": "Difficile",
                "servings": 6,
                "ingredients": [
                    {"product_id": "prod_006", "name": "Poulet Fermier", "quantity": 1, "unit": "pièce", "base_servings": 6},
                    {"product_id": "prod_001", "name": "Plantain Mûr", "quantity": 1, "unit": "kg", "base_servings": 6},
                    {"product_id": "prod_014", "name": "Cube Maggi", "quantity": 3, "unit": "pièce", "base_servings": 6},
                ],
                "steps": [
                    "Préparer et cuire les feuilles de ndolé.",
                    "Griller la pâte d'arachides.",
                    "Cuire la viande avec les assaisonnements.",
                    "Mélanger les feuilles avec la pâte d'arachides.",
                    "Ajouter la viande et laisser mijoter.",
                    "Servir avec du plantain frit."
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "recipe_id": "rec_005",
                "name": "Jus de Bissap",
                "description": "Boisson rafraîchissante à l'hibiscus, populaire en Afrique de l'Ouest.",
                "origin_country": "Sénégal",
                "image_url": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600",
                "prep_time": 15,
                "cook_time": 20,
                "difficulty": "Facile",
                "servings": 6,
                "ingredients": [
                    {"product_id": "prod_008", "name": "Bissap (Fleurs d'Hibiscus)", "quantity": 1, "unit": "sachet", "base_servings": 6},
                    {"product_id": "prod_007", "name": "Gingembre Frais", "quantity": 0.05, "unit": "kg", "base_servings": 6},
                ],
                "steps": [
                    "Rincer les fleurs d'hibiscus.",
                    "Porter l'eau à ébullition avec le gingembre.",
                    "Ajouter les fleurs et laisser infuser 15 min.",
                    "Filtrer et ajouter le sucre selon goût.",
                    "Réfrigérer avant de servir bien frais."
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "recipe_id": "rec_006",
                "name": "Accras de Morue",
                "description": "Beignets de morue épicés, spécialité antillaise.",
                "origin_country": "Antilles",
                "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
                "prep_time": 30,
                "cook_time": 20,
                "difficulty": "Moyen",
                "servings": 4,
                "ingredients": [
                    {"product_id": "prod_010", "name": "Piment Habanero", "quantity": 1, "unit": "pièce", "base_servings": 4},
                    {"product_id": "prod_007", "name": "Gingembre Frais", "quantity": 0.02, "unit": "kg", "base_servings": 4},
                ],
                "steps": [
                    "Dessaler la morue pendant 24h en changeant l'eau.",
                    "Émietter la morue et mélanger avec la pâte.",
                    "Ajouter les épices et herbes.",
                    "Former des boulettes et frire dans l'huile chaude.",
                    "Servir chaud avec sauce créole."
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.recipes.insert_many(recipes)
        logger.info("Recipes seeded")
    
    # Seed reviews
    if await db.reviews.count_documents({}) == 0:
        review_data = [
            {"review_id": "rev_001", "product_id": "prod_001", "user_id": "seed", "user_name": "Aminata D.", "rating": 5, "comment": "Plantains parfaits, bien mûrs comme je les aime. Idéals pour l'alloco !", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_002", "product_id": "prod_002", "user_id": "seed", "user_name": "Jean-Claude M.", "rating": 4, "comment": "Ignames de très bonne qualité, parfaites pour le foufou.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_003", "product_id": "prod_003", "user_id": "seed", "user_name": "Fatou S.", "rating": 5, "comment": "Le meilleur riz basmati que j'ai trouvé. Parfumé et léger.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_004", "product_id": "prod_004", "user_id": "seed", "user_name": "Pierre L.", "rating": 5, "comment": "Huile de palme authentique, couleur et saveur parfaites.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_005", "product_id": "prod_005", "user_id": "seed", "user_name": "Binta S.", "rating": 5, "comment": "Tilapia très frais, livré sous glace. Parfait pour le thiéb !", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_006", "product_id": "prod_006", "user_id": "seed", "user_name": "Marie K.", "rating": 5, "comment": "Excellent poulet fermier, tendre et goûteux. Ma famille adore.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_007", "product_id": "prod_007", "user_id": "seed", "user_name": "Ousmane B.", "rating": 4, "comment": "Gingembre très frais et parfumé. Idéal pour le jus.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_008", "product_id": "prod_008", "user_id": "seed", "user_name": "Aïcha T.", "rating": 5, "comment": "Bissap de qualité premium. Le jus est rouge foncé comme il faut.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_009", "product_id": "prod_009", "user_id": "seed", "user_name": "Léa N.", "rating": 5, "comment": "Le beurre de karité est incroyable, pur et naturel.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_010", "product_id": "prod_010", "user_id": "seed", "user_name": "Sandra P.", "rating": 4, "comment": "Piments bien forts comme il faut ! Attention aux doigts.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_011", "product_id": "prod_011", "user_id": "seed", "user_name": "Kofi A.", "rating": 5, "comment": "Mangues parfaites, sucrées et juteuses. Comme au pays !", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_012", "product_id": "prod_012", "user_id": "seed", "user_name": "Ibrahim D.", "rating": 5, "comment": "Attiéké de qualité, grain parfait. Comme à Abidjan.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_013", "product_id": "prod_013", "user_id": "seed", "user_name": "Nana A.", "rating": 4, "comment": "Très beau pagne wax, motifs authentiques et couleurs vives.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_014", "product_id": "prod_014", "user_id": "seed", "user_name": "Cécile D.", "rating": 5, "comment": "Indispensable en cuisine africaine, goût authentique.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_015", "product_id": "prod_015", "user_id": "seed", "user_name": "Moussa T.", "rating": 4, "comment": "Jus de gingembre bien épicé et rafraîchissant.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_016", "product_id": "prod_016", "user_id": "seed", "user_name": "Paul M.", "rating": 5, "comment": "Viande de très bonne qualité, tendre et savoureuse.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_017", "product_id": "prod_017", "user_id": "seed", "user_name": "Grace N.", "rating": 5, "comment": "Kwanga authentique, texture et goût parfaits.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_018", "product_id": "prod_018", "user_id": "seed", "user_name": "David K.", "rating": 4, "comment": "Farine de manioc de qualité, le foufou était réussi.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_019", "product_id": "prod_019", "user_id": "seed", "user_name": "Adama C.", "rating": 5, "comment": "Semoule fine et sans grumeaux. Parfaite pour le tô.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_020", "product_id": "prod_020", "user_id": "seed", "user_name": "Caroline R.", "rating": 5, "comment": "Chips de plantain croustillantes et délicieuses !", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_021", "product_id": "prod_021", "user_id": "seed", "user_name": "Thierry J.", "rating": 4, "comment": "Bonbons savoureux, les enfants adorent le goût coco.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"review_id": "rev_022", "product_id": "prod_022", "user_id": "seed", "user_name": "Estelle M.", "rating": 5, "comment": "Sucre de canne authentique, goût incomparable.", "image_urls": [], "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.reviews.insert_many(review_data)
        logger.info("Reviews seeded")
    
    logger.info("Database seeding completed")
