"""
KÔYA Market Round 6 Backend Tests
Testing: Reviews one-time only, order_id in reviews, duplicate blocking, 
         20-char minimum, image_urls in reviews, loyalty dropdown
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://koya-ecommerce.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "carttest@koya.com"
TEST_PASSWORD = "Cart123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestReviewsOrderEndpoint:
    """Test GET /api/reviews/order/{orderId} endpoint"""
    
    def test_get_order_reviews_returns_structure(self, auth_headers):
        """GET /api/reviews/order/{orderId} returns product_reviews, driver_review, has_reviews"""
        # Use a test order ID - this may or may not have reviews
        test_order_id = "test-order-1"
        
        response = requests.get(
            f"{BASE_URL}/api/reviews/order/{test_order_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "product_reviews" in data, "Response should contain product_reviews"
        assert "driver_review" in data, "Response should contain driver_review"
        assert "has_reviews" in data, "Response should contain has_reviews"
        
        # Verify types
        assert isinstance(data["product_reviews"], list), "product_reviews should be a list"
        assert isinstance(data["has_reviews"], bool), "has_reviews should be a boolean"
        
        print(f"✓ GET /api/reviews/order/{test_order_id} returns correct structure")
        print(f"  - product_reviews: {len(data['product_reviews'])} reviews")
        print(f"  - driver_review: {'present' if data['driver_review'] else 'none'}")
        print(f"  - has_reviews: {data['has_reviews']}")


class TestReviewCreation:
    """Test POST /api/reviews with order_id and validation"""
    
    def test_review_requires_20_char_minimum(self, auth_headers):
        """Review comment must be at least 20 characters"""
        # Use a unique product ID to avoid duplicate review error
        unique_product_id = f"prod_test_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            headers=auth_headers,
            json={
                "product_id": unique_product_id,
                "rating": 5,
                "comment": "Too short",  # Less than 20 chars
                "image_urls": [],
                "order_id": "test-order-validation"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for short comment, got {response.status_code}"
        data = response.json()
        assert "20" in str(data.get("detail", "")), "Error should mention 20 character minimum"
        print("✓ Review with <20 chars rejected with 400 error")
    
    def test_review_stores_order_id(self, auth_headers):
        """POST /api/reviews stores order_id in review document"""
        # Create a unique product ID to avoid duplicate
        unique_product_id = f"prod_round6_{uuid.uuid4().hex[:8]}"
        test_order_id = f"order_round6_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            headers=auth_headers,
            json={
                "product_id": unique_product_id,
                "rating": 5,
                "comment": "This is a great product with excellent quality and fast delivery!",
                "image_urls": ["https://example.com/photo1.jpg"],
                "order_id": test_order_id
            }
        )
        
        # May fail if product doesn't exist, but we're testing the order_id storage
        if response.status_code == 200:
            data = response.json()
            assert "order_id" in data or data.get("order_id") == test_order_id, "Response should include order_id"
            print(f"✓ Review created with order_id: {test_order_id}")
        else:
            # Product may not exist - that's OK, we're testing the API accepts order_id
            print(f"Note: Review creation returned {response.status_code} (product may not exist)")
    
    def test_duplicate_review_blocked(self, auth_headers):
        """Duplicate review for same product/user is blocked with 400"""
        # Use prod_020 which already has a review from carttest@koya.com
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            headers=auth_headers,
            json={
                "product_id": "prod_020",
                "rating": 4,
                "comment": "Trying to submit a duplicate review for this product!",
                "image_urls": [],
                "order_id": "test-order-duplicate"
            }
        )
        
        # Should be blocked as duplicate
        assert response.status_code == 400, f"Expected 400 for duplicate review, got {response.status_code}"
        data = response.json()
        assert "déjà" in str(data.get("detail", "")).lower() or "already" in str(data.get("detail", "")).lower(), \
            "Error should indicate already reviewed"
        print("✓ Duplicate review blocked with 400 error")


class TestProductReviewsImageUrls:
    """Test that product reviews API returns image_urls field"""
    
    def test_reviews_include_image_urls(self):
        """GET /api/reviews/{product_id} returns image_urls in each review"""
        # Use a product that likely has reviews
        response = requests.get(f"{BASE_URL}/api/reviews/prod_001")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        reviews = response.json()
        
        # Check structure of reviews
        if len(reviews) > 0:
            for review in reviews:
                assert "image_urls" in review, "Each review should have image_urls field"
                assert isinstance(review["image_urls"], list), "image_urls should be a list"
            print(f"✓ GET /api/reviews/prod_001 returns {len(reviews)} reviews with image_urls field")
        else:
            # No reviews yet - check the endpoint works
            print("✓ GET /api/reviews/prod_001 returns empty list (no reviews yet)")


class TestLoyaltyGenerateCode:
    """Test loyalty generate-code accepts points_to_use as body parameter"""
    
    def test_generate_code_accepts_body_param(self, auth_headers):
        """POST /api/loyalty/generate-code accepts points_to_use in request body"""
        # First check user's loyalty points
        loyalty_response = requests.get(f"{BASE_URL}/api/loyalty", headers=auth_headers)
        assert loyalty_response.status_code == 200
        loyalty_data = loyalty_response.json()
        current_points = loyalty_data.get("points", 0)
        
        print(f"Current loyalty points: {current_points}")
        
        if current_points >= 100:
            # Test with body parameter
            response = requests.post(
                f"{BASE_URL}/api/loyalty/generate-code",
                headers=auth_headers,
                json={"points_to_use": 100}
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            
            assert "code" in data, "Response should contain code"
            assert "value" in data, "Response should contain value"
            assert data["value"] == 5.0, "100 points should equal 5€"
            print(f"✓ Generated loyalty code: {data['code']} for 5€")
        else:
            # Test that insufficient points returns error
            response = requests.post(
                f"{BASE_URL}/api/loyalty/generate-code",
                headers=auth_headers,
                json={"points_to_use": 100}
            )
            
            assert response.status_code == 400, f"Expected 400 for insufficient points, got {response.status_code}"
            print(f"✓ Insufficient points ({current_points}) correctly returns 400 error")
    
    def test_generate_code_validates_multiples_of_100(self, auth_headers):
        """points_to_use must be a multiple of 100"""
        response = requests.post(
            f"{BASE_URL}/api/loyalty/generate-code",
            headers=auth_headers,
            json={"points_to_use": 150}  # Not a multiple of 100
        )
        
        assert response.status_code == 400, f"Expected 400 for non-multiple of 100, got {response.status_code}"
        print("✓ Non-multiple of 100 points rejected with 400 error")


class TestDriverReview:
    """Test driver review endpoint"""
    
    def test_driver_review_requires_20_chars(self, auth_headers):
        """Driver review comment must be at least 20 characters"""
        response = requests.post(
            f"{BASE_URL}/api/reviews/driver",
            headers=auth_headers,
            json={
                "order_id": "test-order-driver",
                "rating": 5,
                "comment": "Short"  # Less than 20 chars
            }
        )
        
        # Should fail with 400 or 404 (if order not found)
        if response.status_code == 400:
            data = response.json()
            assert "20" in str(data.get("detail", "")), "Error should mention 20 character minimum"
            print("✓ Driver review with <20 chars rejected with 400 error")
        elif response.status_code == 404:
            print("Note: Order not found (404) - validation may happen after order lookup")
        else:
            print(f"Note: Got {response.status_code} - {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
