# server.py
# ─────────────────────────────────────────────────────────────────────────────
# GlowIQ FastAPI Backend with Authentication
# Place this file in: C:\Users\shivi\Downloads\glow10\
# (same folder as recommendation_engine.py and Skin_Care.csv)
#
# Install dependencies (run once in terminal):
#   pip install fastapi uvicorn pandas numpy pydantic
#
# Start the server:
#   cd C:\Users\shivi\Downloads\glow10
#   python server.py
#
# Then open: http://localhost:8000/health  ← confirm it's running
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import sqlite3
import json
from datetime import datetime

# ── Import your existing Python engine ───────────────────────────────────────
try:
    from recommendation_engine import (
        load_data,
        build_recommendation_payload,
        record_click,
        init_click_db,
    )
except ImportError as e:
    raise RuntimeError(
        "\n\n❌ Could not import recommendation_engine.py\n"
        f"   Error: {e}\n"
        "   Make sure server.py is in the same folder as recommendation_engine.py\n"
    )

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="GlowIQ API", version="1.0.0")

# Allow your React dev server to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://localhost:3000",   # Create React App
        "http://localhost:3001",   # Also allow port 3001
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load data once at startup ─────────────────────────────────────────────────
# Looks for Skin_Care.csv in the same folder as server.py
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Skin_Care.csv")

try:
    print(f"📦 Loading data from: {CSV_PATH}")
    df = load_data(CSV_PATH)
    print(f"✅ Loaded {len(df)} products successfully")
except FileNotFoundError:
    raise RuntimeError(
        "\n\n❌ Skin_Care.csv not found!\n"
        f"   Expected location: {CSV_PATH}\n"
        "   Make sure Skin_Care.csv is in the same folder as server.py\n"
    )

init_click_db()
print("✅ Click tracking database ready")

# ── AUTH DATABASE SETUP ────────────────────────────────────────────────────────
AUTH_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")

def init_auth_db():
    """Initialize authentication database with admin user."""
    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Create users table if it doesn't exist
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create login logs table
    c.execute("""
        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            success INTEGER NOT NULL,
            logged_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Seed admin if doesn't exist
    c.execute("SELECT id FROM users WHERE email = ?", ("shivi5035singh@gmail.com",))
    if not c.fetchone():
        c.execute(
            "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
            ("shivi5035singh@gmail.com", "QWERTY@123", "Shivi Singh", "admin")
        )
        conn.commit()
        print("✅ Admin account created: shivi5035singh@gmail.com / QWERTY@123")
    else:
        print("✅ Admin account already exists")
    
    conn.close()

init_auth_db()

# ── Request/Response models ───────────────────────────────────────────────────
class ClickPayload(BaseModel):
    session_id:   str
    product_id:   str
    product_name: str

class LoginPayload(BaseModel):
    email: str
    password: str

class RegisterPayload(BaseModel):
    email: str
    password: str
    name: str

class AdminRegisterPayload(BaseModel):
    email: str
    password: str
    name: str
    admin_email: str
    admin_password: str

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: LoginPayload):
    """Login endpoint - connects to backend database."""
    try:
        if not body.email or not body.password:
            raise HTTPException(status_code=400, detail="Email and password are required")
        
        conn = sqlite3.connect(AUTH_DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # Find user (case-insensitive email)
        c.execute(
            "SELECT id, email, name, role FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (body.email.strip(), body.password)
        )
        row = c.fetchone()
        
        if not row:
            c.execute("INSERT INTO login_logs (email, success) VALUES (?, ?)", (body.email, 0))
            conn.commit()
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Log successful login
        c.execute("INSERT INTO login_logs (email, success) VALUES (?, ?)", (body.email, 1))
        conn.commit()
        conn.close()
        
        return {
            "ok": True,
            "user": {
                "id": row["id"],
                "email": row["email"],
                "name": row["name"],
                "role": row["role"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/api/auth/register")
def register(body: RegisterPayload):
    """Register a new user."""
    try:
        if not body.email or not body.password or not body.name:
            raise HTTPException(status_code=400, detail="Email, password, and name are required")
        
        if len(body.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        conn = sqlite3.connect(AUTH_DB_PATH)
        c = conn.cursor()
        
        c.execute(
            "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
            (body.email.strip(), body.password, body.name.strip(), "user")
        )
        conn.commit()
        conn.close()
        
        return {"ok": True, "message": "User registered successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Register error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/api/auth/admin-register")
def admin_register(body: AdminRegisterPayload):
    """Register a new admin (only authenticated admins can do this)."""
    try:
        if not body.email or not body.password or not body.name or not body.admin_email or not body.admin_password:
            raise HTTPException(status_code=400, detail="All fields are required")
        
        conn = sqlite3.connect(AUTH_DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # Verify the requesting admin credentials first
        c.execute(
            "SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (body.admin_email.strip(), body.admin_password)
        )
        admin_row = c.fetchone()
        
        if not admin_row or admin_row["role"] != "admin":
            conn.close()
            raise HTTPException(status_code=403, detail="Only admins can register new admins")
        
        # Validate new admin credentials
        if len(body.password) < 6:
            conn.close()
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Register the new admin
        c.execute(
            "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
            (body.email.strip(), body.password, body.name.strip(), "admin")
        )
        conn.commit()
        conn.close()
        
        return {"ok": True, "message": "Admin registered successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Admin register error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get("/health")
def health():
    """Quick check — visit http://localhost:8000/health in your browser."""
    return {
        "status":   "running",
        "products": len(df),
        "message":  f"GlowIQ API is live with {len(df)} products loaded",
    }


@app.get("/api/recommendations")
def get_recommendations(session_id: str = "guest"):
    """
    Returns the full recommendation payload for the React storefront.
    Called by skincare_recommender.jsx on page load.

    Response shape:
      {
        current_season: str,
        seasonal_recommendations: [...],
        low_selling_samples: [...],
        near_expiry_offers: [...],
        top_clicked_products: [...],
        generated_at: str,
      }
    """
    try:
        payload = build_recommendation_payload(df, session_id=session_id)
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/click")
def post_click(body: ClickPayload):
    """
    Records a product click for the session.
    Called by skincare_recommender.jsx whenever a product card is clicked.
    Used to surface 'top clicked products' and the hot-product reminder banner.
    """
    try:
        record_click(body.session_id, body.product_id, body.product_name)
        return {"ok": True, "product_id": body.product_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "─" * 50)
    print("🚀 GlowIQ API starting...")
    print("─" * 50)
    print("📡 API:    http://localhost:8000")
    print("❤️  Health: http://localhost:8000/health")
    print("📋 Docs:   http://localhost:8000/docs")
    print("─" * 50)
    print("Keep this terminal open while using the React app.")
    print("Stop with Ctrl+C\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)