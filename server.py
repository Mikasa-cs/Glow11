
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import sqlite3
import json
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

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
        "\n\nERROR: Could not import recommendation_engine.py\n"
        f"   Error: {e}\n"
        "   Make sure server.py is in the same folder as recommendation_engine.py\n"
    )

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="GlowIQ API", version="1.0.0")

# Allow your React dev server to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.devtunnels\.ms",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load data once at startup ─────────────────────────────────────────────────
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Skin_Care.csv")

try:
    print(f"Loading data from: {CSV_PATH}")
    df = load_data(CSV_PATH)
    print(f"Loaded {len(df)} products successfully")
except FileNotFoundError:
    raise RuntimeError(
        "\n\nERROR: Skin_Care.csv not found!\n"
        f"   Expected location: {CSV_PATH}\n"
        "   Make sure Skin_Care.csv is in the same folder as server.py\n"
    )

init_click_db()
print("Click tracking database ready")

# ── AUTH DATABASE SETUP ────────────────────────────────────────────────────────
AUTH_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")

def get_conn():
    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_auth_db():
    """Initialize authentication database with admin user."""
    conn = get_conn()
    c = conn.cursor()

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

    c.execute("""
        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            success INTEGER NOT NULL,
            logged_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE NOT NULL,
            user_email TEXT NOT NULL,
            user_name TEXT DEFAULT '',
            items TEXT DEFAULT '[]',
            subtotal REAL DEFAULT 0,
            shipping REAL DEFAULT 0,
            tax REAL DEFAULT 0,
            total REAL DEFAULT 0,
            payment_method TEXT DEFAULT '',
            shipping_method TEXT DEFAULT '',
            address TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
        print("Admin account created: shivi5035singh@gmail.com / QWERTY@123")
    else:
        print("Admin account already exists")

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

class SetRolePayload(BaseModel):
    user_id: int
    new_role: str
    admin_email: str
    admin_password: str

# ── Auth Endpoints ─────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(body: LoginPayload):
    try:
        if not body.email or not body.password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        conn = get_conn()
        c = conn.cursor()
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
    try:
        if not body.email or not body.password or not body.name:
            raise HTTPException(status_code=400, detail="Email, password, and name are required")
        if len(body.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        conn = get_conn()
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
    try:
        if not all([body.email, body.password, body.name, body.admin_email, body.admin_password]):
            raise HTTPException(status_code=400, detail="All fields are required")

        conn = get_conn()
        c = conn.cursor()

        c.execute(
            "SELECT id, role FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (body.admin_email.strip(), body.admin_password)
        )
        admin_row = c.fetchone()

        if not admin_row or admin_row["role"] != "admin":
            conn.close()
            raise HTTPException(status_code=403, detail="Only admins can register new admins")

        if len(body.password) < 6:
            conn.close()
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

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


# ── Admin User Management Endpoints ───────────────────────────────────────────

@app.get("/api/admin/users")
def get_all_users(admin_email: str, admin_password: str):
    """Return all users — admin only."""
    try:
        conn = get_conn()
        c = conn.cursor()

        # Verify admin
        c.execute(
            "SELECT role FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (admin_email.strip(), admin_password)
        )
        row = c.fetchone()
        if not row or row["role"] != "admin":
            conn.close()
            raise HTTPException(status_code=403, detail="Admin credentials required")

        c.execute("SELECT id, email, name, role, created_at FROM users ORDER BY id ASC")
        users = [dict(r) for r in c.fetchall()]
        conn.close()
        return {"ok": True, "users": users}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/login-logs")
def get_login_logs(admin_email: str, admin_password: str):
    """Return login logs — admin only."""
    try:
        conn = get_conn()
        c = conn.cursor()

        c.execute(
            "SELECT role FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (admin_email.strip(), admin_password)
        )
        row = c.fetchone()
        if not row or row["role"] != "admin":
            conn.close()
            raise HTTPException(status_code=403, detail="Admin credentials required")

        c.execute("SELECT id, email, success, logged_at FROM login_logs ORDER BY id DESC LIMIT 200")
        logs = [dict(r) for r in c.fetchall()]
        conn.close()
        return {"ok": True, "logs": logs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/set-role")
def set_role(body: SetRolePayload):
    """Promote or demote a user — admin only."""
    try:
        if body.new_role not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")

        conn = get_conn()
        c = conn.cursor()

        # Verify admin
        c.execute(
            "SELECT role FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (body.admin_email.strip(), body.admin_password)
        )
        row = c.fetchone()
        if not row or row["role"] != "admin":
            conn.close()
            raise HTTPException(status_code=403, detail="Admin credentials required")

        # Protect master admin
        c.execute("SELECT email FROM users WHERE id = ?", (body.user_id,))
        target = c.fetchone()
        if not target:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        if target["email"].lower() == "shivi5035singh@gmail.com":
            conn.close()
            raise HTTPException(status_code=403, detail="Master admin role cannot be changed")

        c.execute("UPDATE users SET role = ? WHERE id = ?", (body.new_role, body.user_id))
        conn.commit()
        conn.close()

        return {"ok": True, "message": f"User {body.user_id} is now {body.new_role}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Recommendation Endpoints ───────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status":   "running",
        "products": len(df),
        "message":  f"GlowIQ API is live with {len(df)} products loaded",
    }


@app.get("/api/recommendations")
def get_recommendations(session_id: str = "guest"):
    try:
        payload = build_recommendation_payload(df, session_id=session_id)
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/click")
def post_click(body: ClickPayload):
    try:
        record_click(body.session_id, body.product_id, body.product_name)
        return {"ok": True, "product_id": body.product_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Orders Endpoints ───────────────────────────────────────────────────────────

class OrderPayload(BaseModel):
    order_id: str
    user_email: str
    user_name: str = ""
    items: list = []
    subtotal: float = 0
    shipping: float = 0
    tax: float = 0
    total: float = 0
    payment_method: str = ""
    shipping_method: str = ""
    address: str = ""


@app.post("/api/orders")
def create_order(body: OrderPayload):
    try:
        conn = get_conn()
        c = conn.cursor()
        now_ist = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")
        c.execute("""
            INSERT INTO orders
              (order_id, user_email, user_name, items, subtotal, shipping, tax,
               total, payment_method, shipping_method, address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            body.order_id, body.user_email, body.user_name,
            json.dumps(body.items),
            body.subtotal, body.shipping, body.tax, body.total,
            body.payment_method, body.shipping_method, body.address,
            now_ist,
        ))
        conn.commit()
        conn.close()
        return {"ok": True, "order_id": body.order_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/orders")
def get_orders(email: str = ""):
    try:
        conn = get_conn()
        c = conn.cursor()
        c.execute("""
            SELECT order_id, user_name, user_email, items, subtotal, shipping,
                   tax, total, payment_method, shipping_method, address, created_at
            FROM orders
            WHERE user_email = ?
            ORDER BY created_at DESC
        """, (email,))
        rows = c.fetchall()
        conn.close()
        orders = []
        for row in rows:
            o = dict(row)
            try:
                o["items"] = json.loads(o["items"] or "[]")
            except Exception:
                o["items"] = []
            orders.append(o)
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.get("/api/admin/orders")
def admin_get_orders(admin_email: str = "", admin_password: str = ""):
    """Admin endpoint to get all orders with user info."""
    try:
        conn = get_conn()
        c = conn.cursor()
        # Verify admin
        c.execute(
            "SELECT role FROM users WHERE LOWER(email) = LOWER(?) AND password = ?",
            (admin_email.strip(), admin_password)
        )
        row = c.fetchone()
        if not row or row["role"] != "admin":
            conn.close()
            raise HTTPException(status_code=403, detail="Admin credentials required")

        c.execute("""
            SELECT o.order_id, o.user_email, o.user_name, o.items,
                   o.subtotal, o.shipping, o.tax, o.total,
                   o.payment_method, o.shipping_method, o.address, o.created_at
            FROM orders o
            ORDER BY o.created_at DESC
            LIMIT 500
        """)
        rows = c.fetchall()
        conn.close()
        orders = []
        for row in rows:
            o = dict(row)
            try:
                o["items"] = json.loads(o["items"] or "[]")
            except Exception:
                o["items"] = []
            orders.append(o)
        return {"orders": orders}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "-" * 50)
    print("GlowIQ API starting...")
    print("-" * 50)
    print("API:    http://localhost:8000")
    print("Health: http://localhost:8000/health")
    print("Docs:   http://localhost:8000/docs")
    print("-" * 50)
    print("Keep this terminal open while using the React app.")
    print("Stop with Ctrl+C\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
