"""
KÔYA Market Round 11 Backend Tests
Tests for guest cart persistence: /api/cart/compute and /api/cart/merge endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCartComputeEndpoint:
    """Tests for POST /api/cart/compute (public, no auth required)"""
    
    def test_compute_empty_cart(self):
        """Empty items list should return empty cart with 50€ minimum"""
        response = requests.post(f"{BASE_URL}/api/cart/compute", json={"items": []})
        assert response.status_code == 200
        data = response.json()
        assert data["cart_id"] == "guest"
        assert data["user_id"] is None
        assert data["items"] == []
        assert data["subtotal"] == 0.0
        assert data["minimum_reached"] is False
        assert data["amount_to_minimum"] == 50.0
        print("PASS: Empty cart compute returns correct structure")
    
    def test_compute_with_valid_product(self):
        """Valid product_id should return enriched cart with product details"""
        response = requests.post(f"{BASE_URL}/api/cart/compute", json={
            "items": [{"product_id": "prod_001", "quantity": 2}]
        })
        assert response.status_code == 200
        data = response.json()
        assert data["cart_id"] == "guest"
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert item["product_id"] == "prod_001"
        assert item["quantity"] == 2
        assert "product" in item
        assert item["product"]["name"] == "Plantain Mûr"
        assert item["total"] == item["product"]["price"] * 2
        assert data["subtotal"] == item["total"]
        print(f"PASS: Compute with valid product returns enriched cart (subtotal: {data['subtotal']}€)")
    
    def test_compute_with_unknown_product_skipped(self):
        """Unknown product_ids should be silently skipped"""
        response = requests.post(f"{BASE_URL}/api/cart/compute", json={
            "items": [
                {"product_id": "prod_001", "quantity": 1},
                {"product_id": "unknown_product_xyz", "quantity": 5}
            ]
        })
        assert response.status_code == 200
        data = response.json()
        # Only prod_001 should be in the cart, unknown skipped
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == "prod_001"
        print("PASS: Unknown product_ids are silently skipped")
    
    def test_compute_minimum_reached(self):
        """Cart >= 50€ should have minimum_reached=True"""
        # Get products to find enough to reach 50€
        products_resp = requests.get(f"{BASE_URL}/api/products?limit=10")
        products = products_resp.json()["products"]
        
        # Build cart with enough items to exceed 50€
        items = []
        total = 0
        for p in products:
            qty = max(1, int(20 / p["price"]))  # Add enough of each product
            items.append({"product_id": p["product_id"], "quantity": qty})
            total += p["price"] * qty
            if total >= 60:
                break
        
        response = requests.post(f"{BASE_URL}/api/cart/compute", json={"items": items})
        assert response.status_code == 200
        data = response.json()
        assert data["subtotal"] >= 50
        assert data["minimum_reached"] is True
        assert data["amount_to_minimum"] == 0.0
        print(f"PASS: Cart with {data['subtotal']}€ has minimum_reached=True")
    
    def test_compute_no_auth_required(self):
        """Endpoint should work without any authentication"""
        # No Authorization header, no cookies
        response = requests.post(
            f"{BASE_URL}/api/cart/compute",
            json={"items": [{"product_id": "prod_001", "quantity": 1}]},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        print("PASS: /api/cart/compute works without authentication")


class TestCartMergeEndpoint:
    """Tests for POST /api/cart/merge (auth required)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client@koyamarket.com",
            "password": "Koya2026"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def clear_cart(self, auth_token):
        """Clear user's cart before test"""
        requests.delete(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {auth_token}"})
        yield
        # Cleanup after test
        requests.delete(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {auth_token}"})
    
    def test_merge_requires_auth(self):
        """Merge endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/cart/merge", json={
            "items": [{"product_id": "prod_001", "quantity": 1}]
        })
        assert response.status_code == 401
        print("PASS: /api/cart/merge requires authentication")
    
    def test_merge_empty_items(self, auth_token, clear_cart):
        """Empty items list should return current cart unchanged"""
        response = requests.post(
            f"{BASE_URL}/api/cart/merge",
            json={"items": []},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "subtotal" in data
        print("PASS: Merge with empty items returns current cart")
    
    def test_merge_adds_new_items(self, auth_token, clear_cart):
        """Merging new items should add them to cart"""
        response = requests.post(
            f"{BASE_URL}/api/cart/merge",
            json={"items": [{"product_id": "prod_002", "quantity": 3}]},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find the merged item
        merged_item = next((i for i in data["items"] if i["product_id"] == "prod_002"), None)
        assert merged_item is not None
        assert merged_item["quantity"] >= 3
        print(f"PASS: Merge adds new items to cart (prod_002 qty: {merged_item['quantity']})")
    
    def test_merge_adds_quantities_for_duplicates(self, auth_token, clear_cart):
        """Merging duplicate product_ids should ADD quantities, not replace"""
        # First, add item to cart
        requests.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": "prod_003", "quantity": 2},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Get current cart to verify initial quantity
        cart_before = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"}
        ).json()
        initial_qty = next((i["quantity"] for i in cart_before["items"] if i["product_id"] == "prod_003"), 0)
        
        # Now merge with same product
        response = requests.post(
            f"{BASE_URL}/api/cart/merge",
            json={"items": [{"product_id": "prod_003", "quantity": 5}]},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Quantity should be ADDED (initial + 5)
        merged_item = next((i for i in data["items"] if i["product_id"] == "prod_003"), None)
        assert merged_item is not None
        expected_qty = initial_qty + 5
        assert merged_item["quantity"] == expected_qty, f"Expected {expected_qty}, got {merged_item['quantity']}"
        print(f"PASS: Merge ADDS quantities for duplicates ({initial_qty} + 5 = {merged_item['quantity']})")
    
    def test_merge_returns_enriched_cart(self, auth_token, clear_cart):
        """Merge should return fully enriched cart with product details"""
        response = requests.post(
            f"{BASE_URL}/api/cart/merge",
            json={"items": [{"product_id": "prod_001", "quantity": 1}]},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "cart_id" in data
        assert "user_id" in data
        assert "items" in data
        assert "subtotal" in data
        assert "minimum_reached" in data
        assert "amount_to_minimum" in data
        
        # Check items are enriched with product details
        if data["items"]:
            item = data["items"][0]
            assert "product" in item
            assert "name" in item["product"]
            assert "price" in item["product"]
            assert "total" in item
        print("PASS: Merge returns fully enriched cart")
    
    def test_merge_skips_invalid_products(self, auth_token, clear_cart):
        """Merge should skip invalid product_ids"""
        response = requests.post(
            f"{BASE_URL}/api/cart/merge",
            json={"items": [
                {"product_id": "prod_001", "quantity": 1},
                {"product_id": "invalid_product_xyz", "quantity": 10}
            ]},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Only valid product should be in cart
        product_ids = [i["product_id"] for i in data["items"]]
        assert "prod_001" in product_ids
        assert "invalid_product_xyz" not in product_ids
        print("PASS: Merge skips invalid product_ids")


class TestDeliveryZoneRemoval:
    """Verify /zones-livraison route is removed"""
    
    def test_zones_livraison_route_removed(self):
        """Navigating to /zones-livraison should redirect to home (fallback route)"""
        # This is a frontend route test - we just verify the backend doesn't have this endpoint
        response = requests.get(f"{BASE_URL}/api/delivery-zones")
        # Should be 404 or similar - no dedicated endpoint
        assert response.status_code in [404, 405, 422]
        print("PASS: No /api/delivery-zones endpoint exists")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
