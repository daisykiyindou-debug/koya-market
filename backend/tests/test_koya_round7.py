"""
KÔYA Market Round 7 Tests
Features tested:
1. Orders pagination (page=1 vs page=2 return different orders)
2. Order cancel deducts loyalty points from user
3. Order cancel stores points_deducted and cancelled_at in order
4. Cancelled order has status 'cancelled'
5. Payment simulation: checkout page shows card form with 4242...
6. After order submission, cart is cleared
7. Address edit dialog in AccountPage (not browser prompt)
8. Cancel popup shows points to be lost
9. OrderTrackingPage shows cancelled state for cancelled orders
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://koya-ecommerce.preview.emergentagent.com')

# Test credentials
CANCEL_TEST_EMAIL = "cancel_test@koya.com"
CANCEL_TEST_PASSWORD = "Cancel123"
CART_TEST_EMAIL = "carttest@koya.com"
CART_TEST_PASSWORD = "Cart123456"


class TestOrdersPagination:
    """Test orders pagination returns different orders per page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as cancel_test user who should have orders"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Try to login as cancel_test user
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CANCEL_TEST_EMAIL,
            "password": CANCEL_TEST_PASSWORD
        })
        
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user_exists = True
        else:
            # User doesn't exist, create it
            reg_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
                "email": CANCEL_TEST_EMAIL,
                "password": CANCEL_TEST_PASSWORD,
                "name": "Cancel Test User"
            })
            if reg_resp.status_code == 200:
                self.token = reg_resp.json().get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                self.user_exists = True
            else:
                self.user_exists = False
                pytest.skip("Could not create/login cancel_test user")
    
    def test_pagination_returns_different_orders_per_page(self):
        """Test that page=1 and page=2 return different orders"""
        # Get page 1
        page1_resp = self.session.get(f"{BASE_URL}/api/orders?page=1&per_page=5")
        assert page1_resp.status_code == 200, f"Page 1 failed: {page1_resp.text}"
        page1_data = page1_resp.json()
        
        # Get page 2
        page2_resp = self.session.get(f"{BASE_URL}/api/orders?page=2&per_page=5")
        assert page2_resp.status_code == 200, f"Page 2 failed: {page2_resp.text}"
        page2_data = page2_resp.json()
        
        # Verify pagination structure
        assert "orders" in page1_data, "Page 1 should have 'orders' key"
        assert "total" in page1_data, "Page 1 should have 'total' key"
        assert "page" in page1_data, "Page 1 should have 'page' key"
        assert "total_pages" in page1_data, "Page 1 should have 'total_pages' key"
        
        assert page1_data["page"] == 1, "Page 1 should return page=1"
        assert page2_data["page"] == 2, "Page 2 should return page=2"
        
        # If there are enough orders, page 1 and page 2 should have different order IDs
        page1_order_ids = [o["order_id"] for o in page1_data["orders"]]
        page2_order_ids = [o["order_id"] for o in page2_data["orders"]]
        
        # No overlap between pages (if both have orders)
        if page1_order_ids and page2_order_ids:
            overlap = set(page1_order_ids) & set(page2_order_ids)
            assert len(overlap) == 0, f"Pages should not have overlapping orders: {overlap}"
        
        print(f"PASS: Pagination works - Page 1 has {len(page1_order_ids)} orders, Page 2 has {len(page2_order_ids)} orders")


class TestOrderCancelWithPoints:
    """Test order cancellation deducts loyalty points"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a fresh test user for cancel testing"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create a unique test user for this test
        unique_email = f"cancel_test_{uuid.uuid4().hex[:8]}@koya.com"
        reg_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Cancel Points Test"
        })
        
        if reg_resp.status_code != 200:
            pytest.skip(f"Could not create test user: {reg_resp.text}")
        
        self.token = reg_resp.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.user_id = reg_resp.json().get("user", {}).get("user_id")
    
    def test_cancel_order_deducts_loyalty_points(self):
        """Test that cancelling an order deducts loyalty points earned from that order"""
        # Step 1: Add address
        addr_resp = self.session.post(f"{BASE_URL}/api/users/addresses", json={
            "label": "Test Home",
            "street": "123 Test Street",
            "city": "Paris",
            "postal_code": "75001",
            "is_default": True
        })
        assert addr_resp.status_code == 200, f"Add address failed: {addr_resp.text}"
        address_id = addr_resp.json()["address_id"]
        
        # Step 2: Add items to cart (need minimum 50€)
        # Get products first
        products_resp = self.session.get(f"{BASE_URL}/api/products?limit=5")
        assert products_resp.status_code == 200
        products = products_resp.json()["products"]
        
        # Add enough products to reach 50€ minimum
        total_added = 0
        for product in products:
            qty = max(1, int(60 / product["price"]))  # Ensure we exceed 50€
            add_resp = self.session.post(f"{BASE_URL}/api/cart/add", json={
                "product_id": product["product_id"],
                "quantity": qty
            })
            assert add_resp.status_code == 200, f"Add to cart failed: {add_resp.text}"
            total_added += product["price"] * qty
            if total_added >= 55:
                break
        
        # Step 3: Check loyalty points before order
        loyalty_before = self.session.get(f"{BASE_URL}/api/loyalty").json()
        points_before = loyalty_before.get("points", 0)
        
        # Step 4: Create order
        from datetime import datetime, timedelta
        delivery_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        
        order_resp = self.session.post(f"{BASE_URL}/api/orders", json={
            "address_id": address_id,
            "delivery_date": delivery_date,
            "delivery_slot": "14h-17h",
            "use_loyalty_points": False
        })
        assert order_resp.status_code == 200, f"Create order failed: {order_resp.text}"
        order_data = order_resp.json()
        order_id = order_data["order"]["order_id"]
        points_earned = order_data.get("points_earned", 0)
        subtotal = order_data["order"]["subtotal"]
        
        # Step 5: Check loyalty points after order (should have increased)
        loyalty_after_order = self.session.get(f"{BASE_URL}/api/loyalty").json()
        points_after_order = loyalty_after_order.get("points", 0)
        assert points_after_order >= points_before + points_earned, \
            f"Points should increase after order: before={points_before}, after={points_after_order}, earned={points_earned}"
        
        # Step 6: Cancel the order
        cancel_resp = self.session.post(f"{BASE_URL}/api/orders/{order_id}/cancel")
        assert cancel_resp.status_code == 200, f"Cancel order failed: {cancel_resp.text}"
        cancel_data = cancel_resp.json()
        
        # Verify cancel response has points_deducted
        assert "points_deducted" in cancel_data, "Cancel response should include points_deducted"
        points_deducted = cancel_data["points_deducted"]
        assert points_deducted == int(subtotal), f"Points deducted should equal subtotal: {points_deducted} vs {int(subtotal)}"
        
        # Step 7: Check loyalty points after cancel (should have decreased)
        loyalty_after_cancel = self.session.get(f"{BASE_URL}/api/loyalty").json()
        points_after_cancel = loyalty_after_cancel.get("points", 0)
        
        # Points should be deducted (but not go below 0)
        expected_points = max(0, points_after_order - points_deducted)
        assert points_after_cancel <= points_after_order, \
            f"Points should decrease after cancel: before={points_after_order}, after={points_after_cancel}"
        
        print(f"PASS: Cancel deducts points - Before order: {points_before}, After order: {points_after_order}, After cancel: {points_after_cancel}, Deducted: {points_deducted}")
    
    def test_cancelled_order_has_correct_fields(self):
        """Test that cancelled order has status='cancelled', cancelled_at, and points_deducted"""
        # Setup: Create and cancel an order
        # Add address
        addr_resp = self.session.post(f"{BASE_URL}/api/users/addresses", json={
            "label": "Test Home 2",
            "street": "456 Test Ave",
            "city": "Paris",
            "postal_code": "75002",
            "is_default": True
        })
        assert addr_resp.status_code == 200
        address_id = addr_resp.json()["address_id"]
        
        # Add items to cart
        products_resp = self.session.get(f"{BASE_URL}/api/products?limit=3")
        products = products_resp.json()["products"]
        for product in products:
            qty = max(1, int(60 / product["price"]))
            self.session.post(f"{BASE_URL}/api/cart/add", json={
                "product_id": product["product_id"],
                "quantity": qty
            })
        
        # Create order
        from datetime import datetime, timedelta
        delivery_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        order_resp = self.session.post(f"{BASE_URL}/api/orders", json={
            "address_id": address_id,
            "delivery_date": delivery_date,
            "delivery_slot": "17h-20h",
            "use_loyalty_points": False
        })
        assert order_resp.status_code == 200
        order_id = order_resp.json()["order"]["order_id"]
        
        # Cancel order
        cancel_resp = self.session.post(f"{BASE_URL}/api/orders/{order_id}/cancel")
        assert cancel_resp.status_code == 200
        
        # Fetch the order and verify fields
        order_resp = self.session.get(f"{BASE_URL}/api/orders/{order_id}")
        assert order_resp.status_code == 200
        order = order_resp.json()
        
        # Verify cancelled order fields
        assert order["status"] == "cancelled", f"Order status should be 'cancelled', got: {order['status']}"
        assert "cancelled_at" in order, "Cancelled order should have 'cancelled_at' field"
        assert order["cancelled_at"] is not None, "cancelled_at should not be None"
        assert "points_deducted" in order, "Cancelled order should have 'points_deducted' field"
        
        print(f"PASS: Cancelled order has correct fields - status={order['status']}, cancelled_at={order['cancelled_at']}, points_deducted={order['points_deducted']}")


class TestCartClearedAfterOrder:
    """Test that cart is cleared after successful order"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a fresh test user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        unique_email = f"cart_clear_test_{uuid.uuid4().hex[:8]}@koya.com"
        reg_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Cart Clear Test"
        })
        
        if reg_resp.status_code != 200:
            pytest.skip(f"Could not create test user: {reg_resp.text}")
        
        self.token = reg_resp.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_cart_cleared_after_order_submission(self):
        """Test that cart items are cleared after order is placed"""
        # Add address
        addr_resp = self.session.post(f"{BASE_URL}/api/users/addresses", json={
            "label": "Cart Clear Test",
            "street": "789 Clear St",
            "city": "Paris",
            "postal_code": "75003",
            "is_default": True
        })
        assert addr_resp.status_code == 200
        address_id = addr_resp.json()["address_id"]
        
        # Add items to cart
        products_resp = self.session.get(f"{BASE_URL}/api/products?limit=3")
        products = products_resp.json()["products"]
        for product in products:
            qty = max(1, int(60 / product["price"]))
            self.session.post(f"{BASE_URL}/api/cart/add", json={
                "product_id": product["product_id"],
                "quantity": qty
            })
        
        # Verify cart has items
        cart_before = self.session.get(f"{BASE_URL}/api/cart").json()
        assert len(cart_before["items"]) > 0, "Cart should have items before order"
        
        # Create order
        from datetime import datetime, timedelta
        delivery_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        order_resp = self.session.post(f"{BASE_URL}/api/orders", json={
            "address_id": address_id,
            "delivery_date": delivery_date,
            "delivery_slot": "9h-12h",
            "use_loyalty_points": False
        })
        assert order_resp.status_code == 200, f"Create order failed: {order_resp.text}"
        
        # Verify cart is now empty
        cart_after = self.session.get(f"{BASE_URL}/api/cart").json()
        assert len(cart_after["items"]) == 0, f"Cart should be empty after order, but has {len(cart_after['items'])} items"
        
        print(f"PASS: Cart cleared after order - Before: {len(cart_before['items'])} items, After: {len(cart_after['items'])} items")


class TestCancelledOrderTracking:
    """Test that OrderTrackingPage shows cancelled state correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a fresh user for this test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create a unique test user
        unique_email = f"tracking_test_{uuid.uuid4().hex[:8]}@koya.com"
        reg_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123",
            "name": "Tracking Test User"
        })
        
        if reg_resp.status_code == 200:
            self.token = reg_resp.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Could not create test user")
    
    def test_cancelled_order_tracking_returns_cancelled_status(self):
        """Test that cancelled order has status='cancelled' and cancelled_at field"""
        # Add address
        addr_resp = self.session.post(f"{BASE_URL}/api/users/addresses", json={
            "label": "Tracking Test",
            "street": "111 Track St",
            "city": "Paris",
            "postal_code": "75004",
            "is_default": True
        })
        assert addr_resp.status_code == 200, f"Add address failed: {addr_resp.text}"
        address_id = addr_resp.json()["address_id"]
        
        # Add items to cart
        products_resp = self.session.get(f"{BASE_URL}/api/products?limit=3")
        products = products_resp.json()["products"]
        for product in products:
            qty = max(1, int(60 / product["price"]))
            self.session.post(f"{BASE_URL}/api/cart/add", json={
                "product_id": product["product_id"],
                "quantity": qty
            })
        
        # Create order
        from datetime import datetime, timedelta
        delivery_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        order_resp = self.session.post(f"{BASE_URL}/api/orders", json={
            "address_id": address_id,
            "delivery_date": delivery_date,
            "delivery_slot": "20h-23h",
            "use_loyalty_points": False
        })
        assert order_resp.status_code == 200, f"Create order failed: {order_resp.text}"
        order_id = order_resp.json()["order"]["order_id"]
        
        # Cancel it
        cancel_resp = self.session.post(f"{BASE_URL}/api/orders/{order_id}/cancel")
        assert cancel_resp.status_code == 200, f"Cancel order failed: {cancel_resp.text}"
        
        # Fetch the order and verify it's cancelled
        order_resp = self.session.get(f"{BASE_URL}/api/orders/{order_id}")
        assert order_resp.status_code == 200
        order = order_resp.json()
        
        assert order["status"] == "cancelled", f"Order status should be 'cancelled', got: {order['status']}"
        assert "cancelled_at" in order, "Cancelled order should have 'cancelled_at' field"
        
        print(f"PASS: Cancelled order tracking - Order {order_id} has status='cancelled'")


class TestFrontendCompiles:
    """Test that frontend loads without errors"""
    
    def test_api_health_check(self):
        """Test that API is healthy (frontend test will be done via Playwright)"""
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200, f"API health check failed: {resp.status_code}"
        data = resp.json()
        assert data.get("status") == "healthy", f"API not healthy: {data}"
        print("PASS: API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
