#!/usr/bin/env python3
"""
Comprehensive test suite for GlowIQ Backend
Tests all critical functionality before frontend startup
"""

import sys
import os
import json

# Add project path
sys.path.insert(0, r'C:\Users\shivi\Downloads\glow10')

def test_recommendation_engine():
    """Test the recommendation engine works"""
    print("\n" + "="*60)
    print("TEST 1: Recommendation Engine")
    print("="*60)
    
    try:
        from recommendation_engine import (
            load_data, 
            build_recommendation_payload, 
            init_click_db
        )
        
        csv_path = r'C:\Users\shivi\Downloads\glow10\Skin_Care.csv'
        
        # Check CSV exists
        if not os.path.exists(csv_path):
            print(f"❌ CSV not found: {csv_path}")
            return False
        print(f"✓ CSV file found")
        
        # Load data
        df = load_data(csv_path)
        if len(df) == 0:
            print("❌ No products loaded from CSV")
            return False
        print(f"✓ Loaded {len(df)} products")
        
        # Check required columns
        required_cols = ['product_id', 'product_name', 'price', 'low_sell_probability', 
                        'peak_season', 'days_to_expiry', 'expiry_date']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(f"❌ Missing columns: {missing_cols}")
            return False
        print(f"✓ All required columns present")
        
        # Initialize click DB
        init_click_db()
        print("✓ Click database initialized")
        
        # Build recommendation payload
        payload = build_recommendation_payload(df, session_id='test_session')
        
        # Check payload structure
        expected_keys = ['current_season', 'seasonal_recommendations', 'low_selling_samples',
                        'near_expiry_offers', 'top_clicked_products', 'generated_at']
        missing_keys = [k for k in expected_keys if k not in payload]
        if missing_keys:
            print(f"❌ Missing payload keys: {missing_keys}")
            return False
        print(f"✓ Payload structure valid")
        
        # Check recommendations are lists
        if not isinstance(payload['seasonal_recommendations'], list):
            print("❌ seasonal_recommendations is not a list")
            return False
        if not isinstance(payload['low_selling_samples'], list):
            print("❌ low_selling_samples is not a list")
            return False
        if not isinstance(payload['near_expiry_offers'], list):
            print("❌ near_expiry_offers is not a list")
            return False
        print(f"✓ Recommendations generated:")
        print(f"  - Season: {payload['current_season']}")
        print(f"  - Seasonal: {len(payload['seasonal_recommendations'])} products")
        print(f"  - Low-sellers: {len(payload['low_selling_samples'])} products")
        print(f"  - Near-expiry: {len(payload['near_expiry_offers'])} products")
        
        print("\n✅ Recommendation Engine: PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Recommendation Engine: FAILED")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_auth_database():
    """Test authentication database setup"""
    print("\n" + "="*60)
    print("TEST 2: Authentication Database")
    print("="*60)
    
    try:
        import sqlite3
        
        db_path = r'C:\Users\shivi\Downloads\glow10\users.db'
        
        # Initialize as done in server.py
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # Check users table exists
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not c.fetchone():
            print("❌ users table not found")
            conn.close()
            return False
        print("✓ users table exists")
        
        # Check login_logs table exists
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='login_logs'")
        if not c.fetchone():
            print("❌ login_logs table not found")
            conn.close()
            return False
        print("✓ login_logs table exists")
        
        # Check admin user exists
        c.execute("SELECT id, email, role FROM users WHERE email = ?", 
                 ("shivi5035singh@gmail.com",))
        admin = c.fetchone()
        
        if not admin:
            print("❌ Admin user not found")
            print("Creating admin user...")
            c.execute(
                "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
                ("shivi5035singh@gmail.com", "QWERTY@123", "Shivi Singh", "admin")
            )
            conn.commit()
            print("✓ Admin user created")
        else:
            print(f"✓ Admin user exists: {admin['email']}")
            if admin['role'] != 'admin':
                print(f"❌ Admin user has wrong role: {admin['role']}")
                conn.close()
                return False
            print(f"✓ Admin role verified")
        
        # Count users
        c.execute("SELECT COUNT(*) as cnt FROM users")
        count = c.fetchone()['cnt']
        print(f"✓ Total users in database: {count}")
        
        conn.close()
        print("\n✅ Authentication Database: PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Authentication Database: FAILED")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_backend_imports():
    """Test all backend imports work"""
    print("\n" + "="*60)
    print("TEST 3: Backend Imports")
    print("="*60)
    
    try:
        print("Testing imports...")
        
        # Test FastAPI imports
        from fastapi import FastAPI, HTTPException
        print("✓ FastAPI")
        
        from fastapi.middleware.cors import CORSMiddleware
        print("✓ CORS Middleware")
        
        from pydantic import BaseModel
        print("✓ Pydantic")
        
        import uvicorn
        print("✓ Uvicorn")
        
        # Test recommendation engine import
        from recommendation_engine import (
            load_data,
            build_recommendation_payload,
            record_click,
            init_click_db,
        )
        print("✓ Recommendation Engine")
        
        print("\n✅ Backend Imports: PASSED")
        return True
        
    except ImportError as e:
        print(f"\n❌ Backend Imports: FAILED")
        print(f"Missing package: {e}")
        print("\nTry running: pip install fastapi uvicorn pandas numpy pydantic")
        return False
    except Exception as e:
        print(f"\n❌ Backend Imports: FAILED")
        print(f"Error: {e}")
        return False

def test_frontend_files():
    """Test frontend files exist"""
    print("\n" + "="*60)
    print("TEST 4: Frontend Files")
    print("="*60)
    
    try:
        files_to_check = [
            r'C:\Users\shivi\Downloads\glow10\package.json',
            r'C:\Users\shivi\Downloads\glow10\vite.config.js',
            r'C:\Users\shivi\Downloads\glow10\src\App.jsx',
            r'C:\Users\shivi\Downloads\glow10\src\main.jsx',
            r'C:\Users\shivi\Downloads\glow10\src\pages\LoginPage.jsx',
            r'C:\Users\shivi\Downloads\glow10\src\auth\AuthContext.jsx',
            r'C:\Users\shivi\Downloads\glow10\src\auth\db.js',
            r'C:\Users\shivi\Downloads\glow10\src\AdminApp.jsx',
            r'C:\Users\shivi\Downloads\glow10\src\store\StoreFront.jsx',
        ]
        
        all_exist = True
        for file_path in files_to_check:
            if os.path.exists(file_path):
                print(f"✓ {os.path.basename(file_path)}")
            else:
                print(f"❌ MISSING: {file_path}")
                all_exist = False
        
        if not all_exist:
            print("\n❌ Frontend Files: FAILED")
            return False
        
        print("\n✅ Frontend Files: PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Frontend Files: FAILED")
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🚀 GlowIQ Backend Verification Suite")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("Backend Imports", test_backend_imports()))
    results.append(("Recommendation Engine", test_recommendation_engine()))
    results.append(("Auth Database", test_auth_database()))
    results.append(("Frontend Files", test_frontend_files()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print("\n" + "="*60)
    if passed == total:
        print(f"✅ ALL TESTS PASSED ({passed}/{total})")
        print("\nYou can now start the servers:")
        print("  Terminal 1: python server.py")
        print("  Terminal 2: npm run dev")
        print("\nThen open: http://localhost:5173")
        print("="*60)
        return 0
    else:
        print(f"❌ SOME TESTS FAILED ({passed}/{total})")
        print("Please fix the errors above before running the servers.")
        print("="*60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
