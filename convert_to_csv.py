# convert_to_csv.py
# ─────────────────────────────────────────────────────────────────────────────
# Converts src/data/products.js  →  Skin_Care.csv
#
# Place this file in:  C:\Users\shivi\Downloads\glow10\
# Then run:
#   cd C:\Users\shivi\Downloads\glow10
#   python convert_to_csv.py
#
# It will create Skin_Care.csv in the same folder (glow10\).
# After that, run:  python server.py
# ─────────────────────────────────────────────────────────────────────────────

import json
import csv
import os
import re

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
JS_FILE    = os.path.join(BASE_DIR, "src", "data", "products.js")
CSV_OUTPUT = os.path.join(BASE_DIR, "Skin_Care.csv")

# ── Read the JS file ──────────────────────────────────────────────────────────
print(f"📂 Reading: {JS_FILE}")

if not os.path.exists(JS_FILE):
    raise FileNotFoundError(
        f"\n❌ Could not find: {JS_FILE}\n"
        "   Make sure this script is inside the glow10\\ folder."
    )

with open(JS_FILE, "r", encoding="utf-8") as f:
    raw = f.read()

# ── Strip JS wrapper, keep only the JSON array ────────────────────────────────
start = raw.index("[")
end   = raw.rindex("]") + 1
json_str = raw[start:end]

# ── Parse JSON ────────────────────────────────────────────────────────────────
data = json.loads(json_str)
print(f"✅ Parsed {len(data)} products")

# ── Clean up column names (strip whitespace from keys like ' expiry_date ') ──
cleaned = []
for row in data:
    clean_row = {}
    for k, v in row.items():
        clean_key = k.strip()
        # Rename the padded key to the standard name the engine expects
        if clean_key == "expiry_date":
            clean_key = "expiry_date"
        # Also normalise demand_jun (has trailing space in source)
        if clean_key == "demand_jun":
            clean_key = "demand_jun"
        clean_row[clean_key] = v
    cleaned.append(clean_row)

# ── Write CSV ─────────────────────────────────────────────────────────────────
fieldnames = list(cleaned[0].keys())

with open(CSV_OUTPUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(cleaned)

print(f"✅ CSV saved to: {CSV_OUTPUT}")
print(f"   Rows    : {len(cleaned)}")
print(f"   Columns : {len(fieldnames)}")
print(f"\n🚀 Now run:  python server.py")