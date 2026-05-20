@echo off
REM Test the recommendation engine directly

echo.
echo ════════════════════════════════════════════════════════
echo  Testing Recommendation Engine
echo ════════════════════════════════════════════════════════
echo.

python -c "
import sys
sys.path.insert(0, r'C:\Users\shivi\Downloads\glow10')

print('Loading recommendation engine...')
from recommendation_engine import load_data, build_recommendation_payload, init_click_db
import os

csv_path = r'C:\Users\shivi\Downloads\glow10\Skin_Care.csv'
if not os.path.exists(csv_path):
    print(f'❌ CSV file not found: {csv_path}')
    sys.exit(1)

try:
    df = load_data(csv_path)
    print(f'✅ Loaded {len(df)} products from CSV')
    print(f'   Columns: {list(df.columns)[:5]}...')
    
    init_click_db()
    print('✅ Click tracking database initialized')
    
    payload = build_recommendation_payload(df, session_id='test_session')
    print(f'✅ Recommendation payload generated:')
    print(f'   - Season: {payload[\"current_season\"]}')
    print(f'   - Seasonal recommendations: {len(payload[\"seasonal_recommendations\"])} products')
    print(f'   - Low-selling samples: {len(payload[\"low_selling_samples\"])} products')
    print(f'   - Near-expiry offers: {len(payload[\"near_expiry_offers\"])} products')
    print(f'   - Top-clicked products: {len(payload[\"top_clicked_products\"])} products')
    
    print('✅ Recommendation engine is working perfectly!')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Recommendation engine test FAILED
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════
echo  ✅ Recommendation engine verified!
echo ════════════════════════════════════════════════════════
echo.
pause
