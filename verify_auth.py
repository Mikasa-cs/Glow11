#!/usr/bin/env python3
"""
Quick verification that admin authentication system works
Run this after both servers are started
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_admin_login():
    """Test admin login with default credentials"""
    print("\n" + "="*60)
    print("TEST: Admin Login")
    print("="*60)
    
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "shivi5035singh@gmail.com",
                "password": "QWERTY@123"
            },
            timeout=5
        )
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("user", {}).get("role") == "admin":
                print("✅ PASS: Admin login successful")
                print(f"   User: {data['user']['name']}")
                print(f"   Email: {data['user']['email']}")
                print(f"   Role: {data['user']['role']}")
                return True
            else:
                print(f"❌ FAIL: User is not admin. Role: {data.get('user', {}).get('role')}")
                return False
        else:
            print(f"❌ FAIL: Status {resp.status_code}")
            print(f"   Error: {resp.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ FAIL: Cannot connect to backend")
        print("   Make sure server is running: python server.py")
        return False
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_user_register_and_login():
    """Test user registration and login"""
    print("\n" + "="*60)
    print("TEST: User Registration & Login")
    print("="*60)
    
    test_email = f"testuser_{int(time.time())}@test.com"
    test_password = "TestPass123"
    test_name = "Test User"
    
    try:
        # Register
        print(f"Registering user: {test_email}")
        resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": test_password,
                "name": test_name
            },
            timeout=5
        )
        
        if resp.status_code != 200:
            print(f"❌ FAIL: Registration failed with status {resp.status_code}")
            print(f"   Error: {resp.text}")
            return False
        
        print("✅ User registered")
        
        # Login
        print(f"Logging in user: {test_email}")
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": test_email,
                "password": test_password
            },
            timeout=5
        )
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("user", {}).get("role") == "user":
                print("✅ PASS: User login successful")
                print(f"   User: {data['user']['name']}")
                print(f"   Email: {data['user']['email']}")
                print(f"   Role: {data['user']['role']}")
                return True
            else:
                print(f"❌ FAIL: Wrong role: {data.get('user', {}).get('role')}")
                return False
        else:
            print(f"❌ FAIL: Login failed with status {resp.status_code}")
            print(f"   Error: {resp.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_admin_register():
    """Test admin registration"""
    print("\n" + "="*60)
    print("TEST: Admin Registration (with existing admin auth)")
    print("="*60)
    
    new_admin_email = f"newadmin_{int(time.time())}@test.com"
    new_admin_password = "AdminPass123"
    new_admin_name = "New Admin"
    
    try:
        print(f"Registering new admin: {new_admin_email}")
        resp = requests.post(
            f"{BASE_URL}/api/auth/admin-register",
            json={
                "email": new_admin_email,
                "password": new_admin_password,
                "name": new_admin_name,
                "admin_email": "shivi5035singh@gmail.com",
                "admin_password": "QWERTY@123"
            },
            timeout=5
        )
        
        if resp.status_code == 200:
            print("✅ New admin registered")
            
            # Try to login as new admin
            print(f"Logging in as new admin...")
            resp = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": new_admin_email,
                    "password": new_admin_password
                },
                timeout=5
            )
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get("user", {}).get("role") == "admin":
                    print("✅ PASS: New admin login successful")
                    print(f"   User: {data['user']['name']}")
                    print(f"   Email: {data['user']['email']}")
                    print(f"   Role: {data['user']['role']}")
                    return True
                else:
                    print(f"❌ FAIL: Wrong role: {data.get('user', {}).get('role')}")
                    return False
            else:
                print(f"❌ FAIL: New admin login failed")
                print(f"   Error: {resp.text}")
                return False
        else:
            print(f"❌ FAIL: Admin registration failed with status {resp.status_code}")
            print(f"   Error: {resp.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def test_recommendations():
    """Test recommendation endpoint"""
    print("\n" + "="*60)
    print("TEST: Recommendation Engine")
    print("="*60)
    
    try:
        resp = requests.get(
            f"{BASE_URL}/api/recommendations?session_id=test_session",
            timeout=5
        )
        
        if resp.status_code == 200:
            data = resp.json()
            
            print("✅ Recommendations endpoint responding")
            print(f"   Season: {data.get('current_season')}")
            print(f"   Seasonal products: {len(data.get('seasonal_recommendations', []))}")
            print(f"   Low-sellers: {len(data.get('low_selling_samples', []))}")
            print(f"   Near-expiry: {len(data.get('near_expiry_offers', []))}")
            print(f"   Top-clicked: {len(data.get('top_clicked_products', []))}")
            
            if all([
                data.get('current_season'),
                isinstance(data.get('seasonal_recommendations'), list),
                isinstance(data.get('low_selling_samples'), list),
                isinstance(data.get('near_expiry_offers'), list),
                isinstance(data.get('top_clicked_products'), list),
            ]):
                print("✅ PASS: All recommendation categories present")
                return True
            else:
                print("❌ FAIL: Missing recommendation categories")
                return False
        else:
            print(f"❌ FAIL: Status {resp.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("🚀 GlowIQ - Authentication & Recommendation System Test")
    print("="*60)
    
    print("\nChecking backend is running...")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Backend is running")
            print(f"   Status: {data.get('status')}")
            print(f"   Products loaded: {data.get('products')}")
        else:
            print("❌ Backend health check failed")
            return 1
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:8000")
        print("   Start backend with: python server.py")
        return 1
    
    results = []
    
    # Run tests
    results.append(("Admin Login", test_admin_login()))
    results.append(("User Registration & Login", test_user_register_and_login()))
    results.append(("Admin Registration", test_admin_register()))
    results.append(("Recommendation Engine", test_recommendations()))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    print("\n" + "="*60)
    if passed == total:
        print(f"✅ ALL TESTS PASSED ({passed}/{total})")
        print("\n✨ Your GlowIQ system is fully operational!")
        print("\nYou can now:")
        print("  1. Visit http://localhost:5173")
        print("  2. Sign in with admin credentials")
        print("  3. Register new users and admins")
        print("  4. Browse products and test recommendations")
        print("="*60)
        return 0
    else:
        print(f"❌ SOME TESTS FAILED ({passed}/{total})")
        print("="*60)
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
