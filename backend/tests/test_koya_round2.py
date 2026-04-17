"""
KOYA Market Backend Tests - Round 2
Tests for: Jobs API, Referral system, Order tracking, Reviews, Categories (11 including new ones)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://koya-ecommerce.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_USER_EMAIL = "carttest@koya.com"
TEST_USER_PASSWORD = "Cart123456"


class TestJobsAPI:
    """Tests for Jobs API - /api/jobs and /api/jobs/{jobId}"""
    
    def test_get_all_jobs(self):
        """Test /api/jobs returns 5 jobs with full details"""
        response = requests.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5, f"Expected 5 jobs, got {len(data)}"
        
        # Verify each job has required fields
        for job in data:
            assert "id" in job
            assert "title" in job
            assert "location" in job
            assert "type" in job
            assert "salary" in job
            assert "department" in job
            assert "description" in job
            assert "missions" in job
            assert "requirements" in job
            assert "benefits" in job
        
        print(f"Jobs API returned {len(data)} jobs with full details")
    
    def test_get_job_by_id_dev(self):
        """Test /api/jobs/dev returns full job details for developer position"""
        response = requests.get(f"{BASE_URL}/api/jobs/dev")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "dev"
        assert "Développeur" in data["title"]
        assert data["location"] == "Remote"
        assert "missions" in data and len(data["missions"]) > 0
        assert "requirements" in data and len(data["requirements"]) > 0
        assert "benefits" in data and len(data["benefits"]) > 0
        assert "salary" in data
        
        print(f"Job dev: {data['title']} - {data['salary']}")
    
    def test_get_job_by_id_livreur(self):
        """Test /api/jobs/livreur returns full job details"""
        response = requests.get(f"{BASE_URL}/api/jobs/livreur")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "livreur"
        assert "Livreur" in data["title"]
        assert "missions" in data
        assert "requirements" in data
        assert "benefits" in data
        
        print(f"Job livreur: {data['title']}")
    
    def test_get_job_not_found(self):
        """Test /api/jobs/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/jobs/nonexistent")
        assert response.status_code == 404
        print("Invalid job ID correctly returns 404")


class TestReferralSystem:
    """Tests for Referral API - /api/referral"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for referral tests"""
        unique_email = f"referral_test_{uuid.uuid4().hex[:8]}@koya.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Referral Test User"
        })
        return response.json()["token"]
    
    def test_get_referral_info(self, auth_token):
        """Test /api/referral returns referral code for authenticated user"""
        response = requests.get(
            f"{BASE_URL}/api/referral",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "referral_code" in data
        assert data["referral_code"].startswith("KOYA-")
        assert "referrals_count" in data
        assert "points_per_referral" in data
        assert data["points_per_referral"] == 10
        
        print(f"Referral code: {data['referral_code']}, count: {data['referrals_count']}")
    
    def test_referral_requires_auth(self):
        """Test /api/referral requires authentication"""
        response = requests.get(f"{BASE_URL}/api/referral")
        assert response.status_code == 401
        print("Referral endpoint correctly requires auth")
    
    def test_apply_invalid_referral_code(self, auth_token):
        """Test applying invalid referral code returns error"""
        response = requests.post(
            f"{BASE_URL}/api/referral/apply",
            json={"referral_code": "INVALID-CODE"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print("Invalid referral code correctly rejected")
    
    def test_apply_own_referral_code(self, auth_token):
        """Test user cannot apply their own referral code"""
        # First get user's own referral code
        ref_response = requests.get(
            f"{BASE_URL}/api/referral",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        own_code = ref_response.json()["referral_code"]
        
        # Try to apply own code
        response = requests.post(
            f"{BASE_URL}/api/referral/apply",
            json={"referral_code": own_code},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print("User correctly cannot apply own referral code")


class TestCategoriesAPI:
    """Tests for Categories API - should return 11 categories including new ones"""
    
    def test_get_categories_count(self):
        """Test /api/categories returns 11 categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 11, f"Expected 11 categories, got {len(data)}"
        
        print(f"Categories count: {len(data)}")
    
    def test_categories_include_epicerie_africaine(self):
        """Test categories include 'Épicerie Africaine'"""
        response = requests.get(f"{BASE_URL}/api/categories")
        data = response.json()
        
        category_names = [c["name"] for c in data]
        assert "Épicerie Africaine" in category_names, f"Missing 'Épicerie Africaine'. Found: {category_names}"
        
        print("Épicerie Africaine category found")
    
    def test_categories_include_epicerie_caribeenne(self):
        """Test categories include 'Épicerie Caribéenne'"""
        response = requests.get(f"{BASE_URL}/api/categories")
        data = response.json()
        
        category_names = [c["name"] for c in data]
        assert "Épicerie Caribéenne" in category_names, f"Missing 'Épicerie Caribéenne'. Found: {category_names}"
        
        print("Épicerie Caribéenne category found")


class TestReviewsAPI:
    """Tests for Reviews API - /api/reviews/{product_id}"""
    
    def test_get_reviews_for_product(self):
        """Test /api/reviews/prod_001 returns reviews"""
        response = requests.get(f"{BASE_URL}/api/reviews/prod_001")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        # Reviews may be empty if not seeded, but endpoint should work
        print(f"Reviews for prod_001: {len(data)} reviews")
    
    def test_get_reviews_for_nonexistent_product(self):
        """Test /api/reviews for nonexistent product returns empty list"""
        response = requests.get(f"{BASE_URL}/api/reviews/nonexistent_product")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        print("Nonexistent product returns empty reviews list")


class TestOrderTrackingAPI:
    """Tests for Order Tracking API - /api/orders/{orderId}/tracking"""
    
    @pytest.fixture
    def auth_token_with_order(self):
        """Create user, add items to cart, and create an order"""
        unique_email = f"tracking_test_{uuid.uuid4().hex[:8]}@koya.com"
        
        # Register user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Tracking Test User"
        })
        token = reg_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Add products to cart to reach minimum (50€)
        products_response = requests.get(f"{BASE_URL}/api/products?limit=5")
        products = products_response.json()["products"]
        
        total = 0
        for product in products:
            qty = max(1, int(15 / product["price"]))  # Add enough to reach ~15€ per product
            requests.post(
                f"{BASE_URL}/api/cart/add",
                json={"product_id": product["product_id"], "quantity": qty},
                headers=headers
            )
            total += product["price"] * qty
            if total >= 55:
                break
        
        # Add address
        address_response = requests.post(
            f"{BASE_URL}/api/users/addresses",
            json={
                "label": "Test Address",
                "street": "123 Test Street",
                "city": "Paris",
                "postal_code": "75011",
                "country": "France",
                "is_default": True
            },
            headers=headers
        )
        address_id = address_response.json()["address_id"]
        
        # Create order
        order_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "address_id": address_id,
                "delivery_date": "2026-01-20",
                "delivery_slot": "14h-16h",
                "use_loyalty_points": False
            },
            headers=headers
        )
        
        if order_response.status_code != 200:
            pytest.skip(f"Could not create order: {order_response.text}")
        
        order_id = order_response.json()["order"]["order_id"]
        return token, order_id
    
    def test_order_tracking_returns_data(self, auth_token_with_order):
        """Test /api/orders/{orderId}/tracking returns tracking data"""
        token, order_id = auth_token_with_order
        
        response = requests.get(
            f"{BASE_URL}/api/orders/{order_id}/tracking",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify tracking data structure
        assert "order_id" in data
        assert "status" in data
        assert "driver_name" in data
        assert "driver_phone" in data
        assert "steps" in data
        assert "estimated_arrival" in data
        assert "driver_lat" in data
        assert "driver_lng" in data
        
        print(f"Order tracking: {data['status']}, driver: {data['driver_name']}, ETA: {data['estimated_arrival']}")
    
    def test_order_tracking_requires_auth(self):
        """Test order tracking requires authentication"""
        response = requests.get(f"{BASE_URL}/api/orders/ORD-12345678/tracking")
        assert response.status_code == 401
        print("Order tracking correctly requires auth")
    
    def test_order_tracking_not_found(self):
        """Test tracking for nonexistent order returns 404"""
        # Create a user first
        unique_email = f"tracking_404_{uuid.uuid4().hex[:8]}@koya.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "404 Test User"
        })
        token = reg_response.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/orders/ORD-NONEXISTENT/tracking",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404
        print("Nonexistent order tracking correctly returns 404")


class TestDeliveryZonePageAPI:
    """Tests for delivery zone check API used by the new Zones de livraison page"""
    
    def test_zone_check_75011_eligible(self):
        """Test 75011 (Paris) is eligible with complete coverage"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "75011"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
        assert data["coverage"] == "complete"
        print(f"75011: eligible={data['eligible']}, coverage={data['coverage']}")
    
    def test_zone_check_13001_not_eligible(self):
        """Test 13001 (Marseille) is not eligible"""
        response = requests.post(f"{BASE_URL}/api/delivery-zone/check", json={"postcode": "13001"})
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        print(f"13001: eligible={data['eligible']}")


class TestExistingUserLogin:
    """Test login with existing test user"""
    
    def test_login_test_user(self):
        """Test login with carttest@koya.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        # User may or may not exist, so we check for either success or 401
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            assert "user" in data
            print(f"Login successful for {TEST_USER_EMAIL}")
        else:
            # User doesn't exist, register them
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Cart Test User"
            })
            assert reg_response.status_code == 200
            print(f"Registered new test user: {TEST_USER_EMAIL}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
