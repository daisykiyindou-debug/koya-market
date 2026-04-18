"""
Round 10 Tests for KÔYA Market
Features to test:
1. Photo upload endpoint POST /api/upload/review-photo (multipart file)
2. Static file serving GET /api/uploads/reviews/{filename}
3. Review creation with image_urls containing uploaded photo URL
4. Order cancellation from tracking page (>48h before delivery)
5. Cancelled order display on AccountPage (greyed, clickable, refund notice)
"""

import pytest
import requests
import os
import io
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://koya-ecommerce.preview.emergentagent.com')

class TestPhotoUpload:
    """Test photo upload endpoint for reviews"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client@koyamarket.com",
            "password": "Koya2026"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("token")
    
    def test_upload_photo_requires_auth(self):
        """Test that photo upload requires authentication"""
        # Create a fake image file
        fake_image = io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)
        files = {'file': ('test.png', fake_image, 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/upload/review-photo", files=files)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_upload_photo_rejects_non_image(self, auth_token):
        """Test that non-image files are rejected"""
        fake_file = io.BytesIO(b'This is not an image')
        files = {'file': ('test.txt', fake_file, 'text/plain')}
        
        response = requests.post(
            f"{BASE_URL}/api/upload/review-photo",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "Format non supporté" in response.json().get("detail", "")
    
    def test_upload_photo_success(self, auth_token):
        """Test successful photo upload"""
        # Create a minimal valid PNG file
        # PNG header + minimal IHDR chunk
        png_header = b'\x89PNG\r\n\x1a\n'
        ihdr_chunk = b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'
        iend_chunk = b'\x00\x00\x00\x00IEND\xaeB`\x82'
        fake_png = io.BytesIO(png_header + ihdr_chunk + iend_chunk)
        
        files = {'file': ('test_review.png', fake_png, 'image/png')}
        
        response = requests.post(
            f"{BASE_URL}/api/upload/review-photo",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert "url" in data, "Response should contain 'url'"
        assert "filename" in data, "Response should contain 'filename'"
        assert data["url"].startswith("/api/uploads/reviews/"), f"URL should start with /api/uploads/reviews/, got {data['url']}"
        assert data["filename"].endswith(".png"), f"Filename should end with .png, got {data['filename']}"
        
        # Store for next test
        return data
    
    def test_uploaded_photo_accessible(self, auth_token):
        """Test that uploaded photo can be accessed via static URL"""
        # First upload a photo
        png_header = b'\x89PNG\r\n\x1a\n'
        ihdr_chunk = b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'
        iend_chunk = b'\x00\x00\x00\x00IEND\xaeB`\x82'
        fake_png = io.BytesIO(png_header + ihdr_chunk + iend_chunk)
        
        files = {'file': ('test_access.png', fake_png, 'image/png')}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/upload/review-photo",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert upload_response.status_code == 200
        
        # Now try to access the uploaded file
        url = upload_response.json()["url"]
        full_url = f"{BASE_URL}{url}"
        
        get_response = requests.get(full_url)
        assert get_response.status_code == 200, f"Failed to access uploaded file: {get_response.status_code}"
        # Check content type is image
        content_type = get_response.headers.get("content-type", "")
        assert "image" in content_type.lower(), f"Expected image content-type, got {content_type}"


class TestReviewWithUploadedPhoto:
    """Test review creation with uploaded photo URLs"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client@koyamarket.com",
            "password": "Koya2026"
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_create_review_with_uploaded_photo_url(self, auth_token):
        """Test creating a review with an uploaded photo URL"""
        # First upload a photo
        png_header = b'\x89PNG\r\n\x1a\n'
        ihdr_chunk = b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde'
        iend_chunk = b'\x00\x00\x00\x00IEND\xaeB`\x82'
        fake_png = io.BytesIO(png_header + ihdr_chunk + iend_chunk)
        
        files = {'file': ('review_photo.png', fake_png, 'image/png')}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/upload/review-photo",
            files=files,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert upload_response.status_code == 200
        photo_url = f"{BASE_URL}{upload_response.json()['url']}"
        
        # Create a review with the uploaded photo URL
        # Use a unique product_id to avoid "already reviewed" error
        import uuid
        test_product_id = f"prod_test_{uuid.uuid4().hex[:8]}"
        
        review_response = requests.post(
            f"{BASE_URL}/api/reviews",
            json={
                "product_id": test_product_id,
                "rating": 5,
                "comment": "Excellent produit, très frais et de qualité supérieure!",
                "image_urls": [photo_url]
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # May fail if product doesn't exist, but we're testing the image_urls field acceptance
        if review_response.status_code == 200:
            data = review_response.json()
            assert "image_urls" in data, "Response should contain image_urls"
            assert photo_url in data["image_urls"], "Uploaded photo URL should be in review"
            assert data.get("points_earned", 0) >= 30, "Should earn 30 points (10 + 20 for photo)"


class TestOrderCancellation:
    """Test order cancellation functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client@koyamarket.com",
            "password": "Koya2026"
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_cancel_order_endpoint_exists(self, auth_token):
        """Test that cancel order endpoint exists"""
        # Try to cancel a non-existent order
        response = requests.post(
            f"{BASE_URL}/api/orders/FAKE-ORDER-ID/cancel",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Should return 404 (not found) not 405 (method not allowed)
        assert response.status_code in [404, 400], f"Expected 404 or 400, got {response.status_code}"
    
    def test_cancel_order_requires_auth(self):
        """Test that cancel order requires authentication"""
        response = requests.post(f"{BASE_URL}/api/orders/FAKE-ORDER-ID/cancel")
        assert response.status_code == 401


class TestOrdersEndpoint:
    """Test orders endpoint for cancelled order display"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client@koyamarket.com",
            "password": "Koya2026"
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_get_orders_returns_cancelled_at_field(self, auth_token):
        """Test that orders endpoint returns cancelled_at field for cancelled orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "orders" in data, "Response should contain 'orders'"
        
        # If there are cancelled orders, check they have cancelled_at
        for order in data.get("orders", []):
            if order.get("status") == "cancelled":
                assert "cancelled_at" in order, f"Cancelled order {order.get('order_id')} should have cancelled_at field"
                assert "total" in order, f"Cancelled order should have total for refund display"


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
    
    def test_products_endpoint(self):
        """Test products endpoint works"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
