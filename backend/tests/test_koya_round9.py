"""
KÔYA Market Round 9 Backend Tests
Testing: Review points (10+20), driver review points, referral code, cancel >48h
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "client@koyamarket.com"
TEST_PASSWORD = "Koya2026"

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")
    
    def test_login_with_test_credentials(self):
        """Test login with client@koyamarket.com / Koya2026"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["token"]


class TestReviewPoints:
    """Test review loyalty points: +10 for review, +20 if photo"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for test user"""
        # Create a unique test user for review tests
        unique_email = f"review_test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "Test1234",
            "name": "Review Test User"
        })
        if response.status_code == 200:
            return response.json()["token"]
        # If registration fails, try login with main test user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_review_gives_10_points_without_photo(self, auth_token):
        """Test that a review without photo gives +10 points (not 5)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get initial loyalty points
        loyalty_before = requests.get(f"{BASE_URL}/api/loyalty", headers=headers).json()
        points_before = loyalty_before.get("points", 0)
        
        # Get a product to review
        products = requests.get(f"{BASE_URL}/api/products?limit=1").json()
        assert len(products["products"]) > 0
        product_id = products["products"][0]["product_id"]
        
        # Create review without photo
        unique_comment = f"Test review without photo {uuid.uuid4().hex[:8]} - great product quality!"
        response = requests.post(f"{BASE_URL}/api/reviews", json={
            "product_id": product_id,
            "rating": 5,
            "comment": unique_comment,
            "image_urls": []  # No photos
        }, headers=headers)
        
        if response.status_code == 400 and "déjà donné un avis" in response.json().get("detail", ""):
            pytest.skip("User already reviewed this product")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify points_earned is 10 (not 5)
        assert data.get("points_earned") == 10, f"Expected 10 points, got {data.get('points_earned')}"
        print(f"✓ Review without photo gives +10 points (verified: {data.get('points_earned')})")
    
    def test_review_gives_30_points_with_photo(self, auth_token):
        """Test that a review with photo gives +30 points (10+20)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get a different product to review
        products = requests.get(f"{BASE_URL}/api/products?limit=10").json()
        assert len(products["products"]) > 1
        product_id = products["products"][1]["product_id"]  # Use second product
        
        # Create review with photo
        unique_comment = f"Test review with photo {uuid.uuid4().hex[:8]} - excellent product with image!"
        response = requests.post(f"{BASE_URL}/api/reviews", json={
            "product_id": product_id,
            "rating": 5,
            "comment": unique_comment,
            "image_urls": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]  # 1x1 pixel image
        }, headers=headers)
        
        if response.status_code == 400 and "déjà donné un avis" in response.json().get("detail", ""):
            pytest.skip("User already reviewed this product")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify points_earned is 30 (10 + 20 for photo)
        assert data.get("points_earned") == 30, f"Expected 30 points (10+20), got {data.get('points_earned')}"
        print(f"✓ Review with photo gives +30 points (10+20) (verified: {data.get('points_earned')})")


class TestDriverReview:
    """Test driver review gives +10 points"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_driver_review_gives_10_points(self, auth_token):
        """Test that driver review gives +10 points"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get user's orders
        orders = requests.get(f"{BASE_URL}/api/orders", headers=headers).json()
        
        if not orders.get("orders") or len(orders["orders"]) == 0:
            pytest.skip("No orders available for driver review test")
        
        # Find a delivered order
        delivered_order = None
        for order in orders["orders"]:
            if order.get("status") == "delivered":
                delivered_order = order
                break
        
        if not delivered_order:
            pytest.skip("No delivered orders available for driver review test")
        
        order_id = delivered_order["order_id"]
        
        # Try to submit driver review
        unique_comment = f"Great driver service {uuid.uuid4().hex[:8]} - very professional!"
        response = requests.post(f"{BASE_URL}/api/reviews/driver", json={
            "order_id": order_id,
            "rating": 5,
            "comment": unique_comment
        }, headers=headers)
        
        if response.status_code == 400 and "déjà noté le livreur" in response.json().get("detail", ""):
            pytest.skip("User already reviewed driver for this order")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify points_earned is 10
        assert data.get("points_earned") == 10, f"Expected 10 points for driver review, got {data.get('points_earned')}"
        print(f"✓ Driver review gives +10 points (verified: {data.get('points_earned')})")


class TestOrderCancellation:
    """Test order cancellation rules: only >48h before delivery"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_cancel_order_within_48h_fails(self, auth_token):
        """Test that cancelling order within 48h of delivery fails"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get user's orders
        orders = requests.get(f"{BASE_URL}/api/orders", headers=headers).json()
        
        if not orders.get("orders"):
            pytest.skip("No orders available for cancellation test")
        
        # Find a pending order with delivery date within 48h
        for order in orders["orders"]:
            if order.get("status") == "pending":
                delivery_date_str = order.get("delivery_date", "")
                try:
                    delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d")
                    hours_until = (delivery_date - datetime.now()).total_seconds() / 3600
                    
                    if hours_until < 48:
                        # Try to cancel - should fail
                        response = requests.post(f"{BASE_URL}/api/orders/{order['order_id']}/cancel", headers=headers)
                        assert response.status_code == 400
                        assert "48h" in response.json().get("detail", "")
                        print(f"✓ Cancel within 48h correctly rejected: {response.json().get('detail')}")
                        return
                except ValueError:
                    continue
        
        pytest.skip("No pending orders within 48h found for test")
    
    def test_cancel_endpoint_exists(self, auth_token):
        """Test that cancel endpoint exists and validates properly"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Try to cancel non-existent order
        response = requests.post(f"{BASE_URL}/api/orders/FAKE-ORDER-123/cancel", headers=headers)
        assert response.status_code == 404
        print("✓ Cancel endpoint exists and returns 404 for non-existent order")


class TestReferralSystem:
    """Test referral code system"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_referral_code(self, auth_token):
        """Test getting user's referral code"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/referral", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "referral_code" in data
        assert data["referral_code"].startswith("KOYA-")
        assert "referrals_count" in data
        assert "points_per_referral" in data
        assert data["points_per_referral"] == 200
        print(f"✓ Referral code retrieved: {data['referral_code']}")
    
    def test_apply_invalid_referral_code(self, auth_token):
        """Test applying invalid referral code fails"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/referral/apply", json={
            "referral_code": "INVALID-CODE-123"
        }, headers=headers)
        
        assert response.status_code == 400
        assert "invalide" in response.json().get("detail", "").lower()
        print("✓ Invalid referral code correctly rejected")
    
    def test_cannot_use_own_referral_code(self, auth_token):
        """Test user cannot use their own referral code"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get user's own referral code
        referral_info = requests.get(f"{BASE_URL}/api/referral", headers=headers).json()
        own_code = referral_info["referral_code"]
        
        # Try to apply own code
        response = requests.post(f"{BASE_URL}/api/referral/apply", json={
            "referral_code": own_code
        }, headers=headers)
        
        assert response.status_code == 400
        assert "propre code" in response.json().get("detail", "").lower()
        print("✓ Cannot use own referral code - correctly rejected")


class TestUserRegistration:
    """Test user registration"""
    
    def test_register_new_user(self):
        """Test registering a new user"""
        unique_email = f"test_user_{uuid.uuid4().hex[:8]}@koyamarket.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Test User Round9"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["loyalty_points"] == 0
        print(f"✓ New user registered: {unique_email}")
    
    def test_register_duplicate_email_fails(self):
        """Test registering with existing email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": "AnyPassword123",
            "name": "Duplicate User"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
        print("✓ Duplicate email registration correctly rejected")


class TestCartAndProducts:
    """Test cart and product endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_products(self):
        """Test getting products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0
        print(f"✓ Products retrieved: {len(data['products'])} products")
    
    def test_get_cart_requires_auth(self):
        """Test that cart endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401
        print("✓ Cart endpoint correctly requires authentication")
    
    def test_get_cart_with_auth(self, auth_token):
        """Test getting cart with authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "subtotal" in data
        assert "minimum_reached" in data
        print(f"✓ Cart retrieved: {len(data['items'])} items, subtotal: {data['subtotal']}€")


class TestRecipes:
    """Test recipes endpoints"""
    
    def test_get_recipes(self):
        """Test getting recipes list"""
        response = requests.get(f"{BASE_URL}/api/recipes")
        assert response.status_code == 200
        data = response.json()
        assert "recipes" in data
        print(f"✓ Recipes retrieved: {len(data['recipes'])} recipes")
    
    def test_recipe_has_ingredients(self):
        """Test that recipes have ingredients with product_id"""
        response = requests.get(f"{BASE_URL}/api/recipes?limit=1")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["recipes"]) > 0:
            recipe = data["recipes"][0]
            assert "ingredients" in recipe
            if len(recipe["ingredients"]) > 0:
                ingredient = recipe["ingredients"][0]
                assert "product_id" in ingredient
                assert "name" in ingredient
                print(f"✓ Recipe '{recipe['name']}' has {len(recipe['ingredients'])} ingredients with product_id")
        else:
            pytest.skip("No recipes available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
