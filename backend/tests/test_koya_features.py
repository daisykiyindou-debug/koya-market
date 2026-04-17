"""
KOYA Market Backend Tests
Tests for: Zone checker (postal codes), Promo codes, Loyalty system, Auth, Cart
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://koya-ecommerce.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_USER_EMAIL = "carttest@koya.com"
TEST_USER_PASSWORD = "Cart123456"
TEST_USER_NAME = "Cart Test User"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"API Health: {data}")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "KÔYA Market API" in data.get("message", "")
        print(f"API Root: {data}")


class TestDeliveryZonePostalCode:
    """Tests for delivery zone checker using postal codes (not city names)"""
    
    def test_zone_75011_full_coverage(self):
        """Test postal code 75011 (Paris) returns eligible=true, coverage=complete"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "75011"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "complete"
        assert data["department"] == "75"
        print(f"75011 result: {data}")
    
    def test_zone_91000_full_coverage(self):
        """Test postal code 91000 (Essonne) returns eligible=true, coverage=complete"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "91000"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "complete"
        assert data["department"] == "91"
        print(f"91000 result: {data}")
    
    def test_zone_92100_full_coverage(self):
        """Test postal code 92100 (Hauts-de-Seine) returns eligible=true, coverage=complete"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "92100"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "complete"
        print(f"92100 result: {data}")
    
    def test_zone_93000_full_coverage(self):
        """Test postal code 93000 (Seine-Saint-Denis) returns eligible=true, coverage=complete"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "93000"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "complete"
        print(f"93000 result: {data}")
    
    def test_zone_94000_full_coverage(self):
        """Test postal code 94000 (Val-de-Marne) returns eligible=true, coverage=complete"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "94000"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "complete"
        print(f"94000 result: {data}")
    
    def test_zone_78000_partial_coverage(self):
        """Test postal code 78000 (Versailles) returns eligible=true, coverage=partial"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "78000"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "partial"
        assert data["department"] == "78"
        print(f"78000 result: {data}")
    
    def test_zone_95100_partial_coverage(self):
        """Test postal code 95100 (Argenteuil) returns eligible=true, coverage=partial"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "95100"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "partial"
        print(f"95100 result: {data}")
    
    def test_zone_77420_partial_coverage(self):
        """Test postal code 77420 (Champs-sur-Marne) returns eligible=true, coverage=partial"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "77420"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "partial"
        print(f"77420 result: {data}")
    
    def test_zone_13001_not_eligible(self):
        """Test postal code 13001 (Marseille) returns eligible=false"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "13001"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        print(f"13001 result: {data}")
    
    def test_zone_invalid_format(self):
        """Test invalid postal code format"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "Paris"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        assert "error" in data or "Format invalide" in str(data)
        print(f"Invalid format result: {data}")
    
    def test_zone_short_code(self):
        """Test too short postal code"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "750"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        print(f"Short code result: {data}")


class TestAuthentication:
    """Tests for user authentication"""
    
    def test_register_new_user(self):
        """Test user registration"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@koya.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == unique_email
        print(f"Registration successful for: {unique_email}")
    
    def test_login_existing_user(self):
        """Test login with existing user"""
        # First register a user
        import uuid
        unique_email = f"login_test_{uuid.uuid4().hex[:8]}@koya.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Login Test User"
        })
        assert reg_response.status_code == 200
        
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        print(f"Login successful for: {unique_email}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@koya.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")
    
    def test_get_me_authenticated(self):
        """Test /auth/me endpoint with valid token"""
        # Register and get token
        import uuid
        unique_email = f"me_test_{uuid.uuid4().hex[:8]}@koya.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Me Test User"
        })
        token = reg_response.json()["token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == unique_email
        print(f"Auth/me successful: {data['email']}")
    
    def test_get_me_unauthenticated(self):
        """Test /auth/me endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("Unauthenticated request correctly rejected")


class TestPromoCodes:
    """Tests for promo code validation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for promo tests"""
        import uuid
        unique_email = f"promo_test_{uuid.uuid4().hex[:8]}@koya.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Promo Test User"
        })
        return response.json()["token"]
    
    def test_promo_bienvenue10_valid(self, auth_token):
        """Test BIENVENUE10 promo code returns valid=true with 10% discount"""
        response = requests.post(
            f"{BASE_URL}/api/promo/validate",
            json={"code": "BIENVENUE10"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 10
        assert data["code"] == "BIENVENUE10"
        print(f"BIENVENUE10 result: {data}")
    
    def test_promo_koya20_valid(self, auth_token):
        """Test KOYA20 promo code returns valid=true with 20% discount"""
        response = requests.post(
            f"{BASE_URL}/api/promo/validate",
            json={"code": "KOYA20"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_percent"] == 20
        assert data["code"] == "KOYA20"
        print(f"KOYA20 result: {data}")
    
    def test_promo_livraison_valid(self, auth_token):
        """Test LIVRAISON promo code returns valid=true with 4.99€ discount"""
        response = requests.post(
            f"{BASE_URL}/api/promo/validate",
            json={"code": "LIVRAISON"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["discount_amount"] == 4.99
        print(f"LIVRAISON result: {data}")
    
    def test_promo_invalid_code(self, auth_token):
        """Test invalid promo code returns 400 error"""
        response = requests.post(
            f"{BASE_URL}/api/promo/validate",
            json={"code": "INVALIDCODE"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print("Invalid promo code correctly rejected")
    
    def test_promo_lowercase_works(self, auth_token):
        """Test promo code works with lowercase"""
        response = requests.post(
            f"{BASE_URL}/api/promo/validate",
            json={"code": "bienvenue10"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        print("Lowercase promo code works")


class TestLoyaltySystem:
    """Tests for loyalty code generation and redemption"""
    
    def test_loyalty_generate_insufficient_points(self):
        """Test generate-code fails when user has < 100 points"""
        import uuid
        unique_email = f"loyalty_low_{uuid.uuid4().hex[:8]}@koya.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Low Points User"
        })
        token = reg_response.json()["token"]
        
        # Try to generate code with 0 points
        response = requests.post(
            f"{BASE_URL}/api/loyalty/generate-code",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "100 points" in data.get("detail", "") or "points" in data.get("detail", "").lower()
        print(f"Insufficient points error: {data}")
    
    def test_loyalty_get_status(self):
        """Test getting loyalty status"""
        import uuid
        unique_email = f"loyalty_status_{uuid.uuid4().hex[:8]}@koya.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Loyalty Status User"
        })
        token = reg_response.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/loyalty",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        assert "rewards_available" in data
        assert "next_reward_progress" in data
        print(f"Loyalty status: {data}")
    
    def test_loyalty_redeem_invalid_code(self):
        """Test redeem endpoint rejects invalid code"""
        import uuid
        unique_email = f"loyalty_redeem_{uuid.uuid4().hex[:8]}@koya.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Redeem Test User"
        })
        token = reg_response.json()["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/loyalty/redeem",
            json={"code": "INVALID-CODE-12345"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400
        print("Invalid loyalty code correctly rejected")


class TestProducts:
    """Tests for product endpoints"""
    
    def test_get_products(self):
        """Test getting products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert len(data["products"]) > 0
        print(f"Products count: {data['total']}")
    
    def test_get_popular_products(self):
        """Test getting popular products"""
        response = requests.get(f"{BASE_URL}/api/products/popular?limit=8")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Popular products: {len(data)}")
    
    def test_get_categories(self):
        """Test getting categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Categories: {len(data)}")


class TestCart:
    """Tests for cart functionality"""
    
    @pytest.fixture
    def auth_token_and_user(self):
        """Get auth token for cart tests"""
        import uuid
        unique_email = f"cart_test_{uuid.uuid4().hex[:8]}@koya.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Cart Test User"
        })
        data = response.json()
        return data["token"], data["user"]
    
    def test_get_empty_cart(self, auth_token_and_user):
        """Test getting empty cart"""
        token, user = auth_token_and_user
        response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "subtotal" in data
        print(f"Empty cart: {data}")
    
    def test_add_to_cart(self, auth_token_and_user):
        """Test adding product to cart"""
        token, user = auth_token_and_user
        
        # Get a product first
        products_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        product = products_response.json()["products"][0]
        
        # Add to cart
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": product["product_id"], "quantity": 2},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0
        assert data["items"][0]["product_id"] == product["product_id"]
        print(f"Added to cart: {product['name']}")
    
    def test_cart_requires_auth(self):
        """Test cart endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401
        print("Cart correctly requires authentication")


class TestRecipes:
    """Tests for recipe endpoints"""
    
    def test_get_recipes(self):
        """Test getting recipes list"""
        response = requests.get(f"{BASE_URL}/api/recipes")
        assert response.status_code == 200
        data = response.json()
        assert "recipes" in data
        assert "total" in data
        print(f"Recipes count: {data['total']}")
    
    def test_get_featured_recipes(self):
        """Test getting featured recipes"""
        response = requests.get(f"{BASE_URL}/api/recipes/featured?limit=4")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Featured recipes: {len(data)}")


class TestFAQ:
    """Tests for FAQ endpoint"""
    
    def test_get_faq(self):
        """Test getting FAQ"""
        response = requests.get(f"{BASE_URL}/api/faq")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"FAQ items: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
