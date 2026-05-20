#!/usr/bin/env python
import sys
sys.path.insert(0, r'C:\Users\shivi\Downloads\glow10')

print("Testing recommendation engine...")
try:
    from recommendation_engine import load_data, build_recommendation_payload, init_click_db
    import os
    
    csv_path = r'C:\Users\shivi\Downloads\glow10\Skin_Care.csv'
    if not os.path.exists(csv_path):
        print(f'CSV file not found: {csv_path}')
        sys.exit(1)
    
    df = load_data(csv_path)
    print(f'✓ Loaded {len(df)} products')
    
    init_click_db()
    print(f'✓ Click DB initialized')
    
    payload = build_recommendation_payload(df, session_id='test')
    print(f"✓ Current season: {payload['current_season']}")
    print(f"✓ Seasonal recs: {len(payload['seasonal_recommendations'])}")
    print(f"✓ Low-sellers: {len(payload['low_selling_samples'])}")
    print(f"✓ Near-expiry: {len(payload['near_expiry_offers'])}")
    print(f"✓ Top-clicked: {len(payload['top_clicked_products'])}")
    print("Recommendation engine working!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
