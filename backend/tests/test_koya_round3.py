"""
KOYA Market Round 3 Backend Tests
Tests for:
1. Header does NOT contain 'Zones de livraison' link (frontend check)
2. Footer still has 'Zones de livraison' link (frontend check)
3. Categories API returns Épicerie Africaine and Caribéenne as first two categories
4. New products exist: Manioc (kwanga), Foufou, Semoule de maïs, Chips de plantain, Bonbons tropicaux, Sucre de canne
5. Products API returns 22 products total
6. Reviews exist for all products (1 per product)
7. Careers page shows jobs in grid without spontaneous application form (frontend check)
8. Job detail page has CV upload field (frontend check)
9. Driver review endpoint POST /api/reviews/driver works
10. Driver info endpoint GET /api/driver/{name}/info returns profile
11. Post-review gives +5 loyalty points
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "carttest@koya.com"
TEST_PASSWORD = "Cart123456"


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")


class TestCategoriesOrder:
    """Test that categories are ordered correctly with Épicerie Africaine and Caribéenne first"""
    
    def test_categories_order(self):
        """Categories should have Épicerie Africaine and Caribéenne as first two"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        
        # Should have at least 2 categories
        assert len(categories) >= 2, f"Expected at least 2 categories, got {len(categories)}"
        
        # Get category names
        category_names = [cat["name"] for cat in categories]
        print(f"Categories order: {category_names}")
        
        # First two should be Épicerie Africaine and Épicerie Caribéenne
        assert categories[0]["name"] == "Épicerie Africaine", f"First category should be 'Épicerie Africaine', got '{categories[0]['name']}'"
        assert categories[1]["name"] == "Épicerie Caribéenne", f"Second category should be 'Épicerie Caribéenne', got '{categories[1]['name']}'"
        
        print("✓ Categories order correct: Épicerie Africaine and Caribéenne are first")


class TestNewProducts:
    """Test new products added in Round 3"""
    
    def test_products_total_count(self):
        """Products API should return 22 products total"""
        response = requests.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        data = response.json()
        
        total = data.get("total", len(data.get("products", [])))
        print(f"Total products: {total}")
        assert total == 22, f"Expected 22 products, got {total}"
        print("✓ Products count is 22")
    
    def test_new_african_products_exist(self):
        """New Épicerie Africaine products should exist: Manioc, Foufou, Semoule de maïs"""
        response = requests.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        products = response.json()["products"]
        
        product_names = [p["name"] for p in products]
        
        # Check for new African products
        expected_african = ["Manioc (Kwanga)", "Foufou / Farine de Manioc", "Semoule de Maïs"]
        for expected in expected_african:
            assert expected in product_names, f"Product '{expected}' not found in products"
            print(f"✓ Found product: {expected}")
        
        # Verify they are in epicerie-africaine category
        for product in products:
            if product["name"] in expected_african:
                assert product["category"] == "epicerie-africaine", f"Product '{product['name']}' should be in 'epicerie-africaine' category, got '{product['category']}'"
        
        print("✓ All new Épicerie Africaine products exist with correct category")
    
    def test_new_caribbean_products_exist(self):
        """New Épicerie Caribéenne products should exist: Chips de plantain, Bonbons tropicaux, Sucre de canne"""
        response = requests.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        products = response.json()["products"]
        
        product_names = [p["name"] for p in products]
        
        # Check for new Caribbean products
        expected_caribbean = ["Chips de Plantain", "Bonbons Tropicaux", "Sucre de Canne"]
        for expected in expected_caribbean:
            assert expected in product_names, f"Product '{expected}' not found in products"
            print(f"✓ Found product: {expected}")
        
        # Verify they are in epicerie-caribeenne category
        for product in products:
            if product["name"] in expected_caribbean:
                assert product["category"] == "epicerie-caribeenne", f"Product '{product['name']}' should be in 'epicerie-caribeenne' category, got '{product['category']}'"
        
        print("✓ All new Épicerie Caribéenne products exist with correct category")


class TestProductReviews:
    """Test that reviews exist for all products"""
    
    def test_reviews_exist_for_products(self):
        """Each product should have at least 1 review seeded"""
        # Get all products
        response = requests.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        products = response.json()["products"]
        
        products_with_reviews = 0
        products_without_reviews = []
        
        for product in products:
            product_id = product["product_id"]
            reviews_response = requests.get(f"{BASE_URL}/api/reviews/{product_id}")
            assert reviews_response.status_code == 200
            reviews = reviews_response.json()
            
            if len(reviews) > 0:
                products_with_reviews += 1
            else:
                products_without_reviews.append(product["name"])
        
        print(f"Products with reviews: {products_with_reviews}/{len(products)}")
        if products_without_reviews:
            print(f"Products without reviews: {products_without_reviews}")
        
        # All 22 products should have reviews
        assert products_with_reviews == 22, f"Expected 22 products with reviews, got {products_with_reviews}. Missing: {products_without_reviews}"
        print("✓ All 22 products have at least 1 review")


class TestDriverReviewEndpoint:
    """Test driver review endpoint POST /api/reviews/driver"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_driver_review_requires_auth(self):
        """Driver review endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/reviews/driver", json={
            "order_id": "ORD-TEST123",
            "rating": 5,
            "comment": "Great driver!"
        })
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
        print("✓ Driver review endpoint requires authentication")
    
    def test_driver_review_invalid_order(self, auth_token):
        """Driver review should fail for non-existent order"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/reviews/driver", json={
            "order_id": "ORD-NONEXISTENT",
            "rating": 5,
            "comment": "Great driver!"
        }, headers=headers)
        assert response.status_code == 404, f"Expected 404 for non-existent order, got {response.status_code}"
        print("✓ Driver review returns 404 for non-existent order")


class TestDriverInfoEndpoint:
    """Test driver info endpoint GET /api/driver/{name}/info"""
    
    def test_driver_info_returns_profile(self):
        """Driver info endpoint should return driver profile"""
        # Test with a known driver name from the seed data
        driver_name = "Mamadou D."
        response = requests.get(f"{BASE_URL}/api/driver/{driver_name}/info")
        assert response.status_code == 200
        
        data = response.json()
        assert "name" in data, "Driver info should contain 'name'"
        assert "photo" in data, "Driver info should contain 'photo'"
        assert "rating" in data, "Driver info should contain 'rating'"
        assert "total_reviews" in data, "Driver info should contain 'total_reviews'"
        assert "total_deliveries" in data, "Driver info should contain 'total_deliveries'"
        assert "recent_reviews" in data, "Driver info should contain 'recent_reviews'"
        
        assert data["name"] == driver_name
        assert isinstance(data["rating"], (int, float))
        assert isinstance(data["total_deliveries"], int)
        
        print(f"✓ Driver info returned for {driver_name}: rating={data['rating']}, deliveries={data['total_deliveries']}")
    
    def test_driver_info_different_drivers(self):
        """Test driver info for different driver names"""
        driver_names = ["Ibrahim K.", "Fatou S.", "Abdoulaye M."]
        
        for driver_name in driver_names:
            response = requests.get(f"{BASE_URL}/api/driver/{driver_name}/info")
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == driver_name
            print(f"✓ Driver info returned for {driver_name}")


class TestJobsEndpoint:
    """Test jobs endpoint for careers page"""
    
    def test_jobs_list(self):
        """Jobs endpoint should return list of jobs"""
        response = requests.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        jobs = response.json()
        
        assert len(jobs) >= 5, f"Expected at least 5 jobs, got {len(jobs)}"
        
        # Check job structure
        for job in jobs:
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
        
        print(f"✓ Jobs endpoint returns {len(jobs)} jobs with full details")
    
    def test_job_detail(self):
        """Job detail endpoint should return full job info"""
        response = requests.get(f"{BASE_URL}/api/jobs/dev")
        assert response.status_code == 200
        job = response.json()
        
        assert job["id"] == "dev"
        assert job["title"] == "Développeur / Développeuse Full Stack"
        assert "missions" in job and len(job["missions"]) > 0
        assert "requirements" in job and len(job["requirements"]) > 0
        assert "benefits" in job and len(job["benefits"]) > 0
        
        print(f"✓ Job detail for 'dev' returned with missions, requirements, benefits")


class TestLoyaltyPointsForReviews:
    """Test that reviews give +5 loyalty points"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authentication token and initial loyalty points"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        
        token = response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get initial loyalty points
        loyalty_response = requests.get(f"{BASE_URL}/api/loyalty", headers=headers)
        initial_points = loyalty_response.json().get("points", 0) if loyalty_response.status_code == 200 else 0
        
        return {"token": token, "headers": headers, "initial_points": initial_points}
    
    def test_product_review_gives_5_points(self, auth_session):
        """Creating a product review should give +5 loyalty points"""
        headers = auth_session["headers"]
        initial_points = auth_session["initial_points"]
        
        # Create a review
        review_response = requests.post(f"{BASE_URL}/api/reviews", json={
            "product_id": "prod_001",
            "rating": 5,
            "comment": "Test review for loyalty points verification",
            "image_urls": []
        }, headers=headers)
        
        assert review_response.status_code == 200
        review_data = review_response.json()
        
        # Check points_earned in response
        assert "points_earned" in review_data, "Review response should contain 'points_earned'"
        assert review_data["points_earned"] == 5, f"Expected 5 points earned, got {review_data['points_earned']}"
        
        # Verify loyalty points increased
        loyalty_response = requests.get(f"{BASE_URL}/api/loyalty", headers=headers)
        assert loyalty_response.status_code == 200
        new_points = loyalty_response.json().get("points", 0)
        
        assert new_points >= initial_points + 5, f"Expected points to increase by at least 5 (from {initial_points} to {new_points})"
        
        print(f"✓ Product review gives +5 loyalty points (points: {initial_points} -> {new_points})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
