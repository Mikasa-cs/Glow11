// src/auth/db.js
// ✅ NEW: Backend-based authentication (calls FastAPI server)
// Users are now stored in backend SQLite (users.db)
// Persists across devices and sessions

const BACKEND_URL = "http://localhost:8000";

// --------------------------------------------------------------------------
// Initialise database (now backend)
// --------------------------------------------------------------------------
export async function initDB() {
  // Check if backend is running
  try {
    const resp = await fetch(`${BACKEND_URL}/health`);
    if (!resp.ok) throw new Error("Backend health check failed");
    console.log("✅ Backend connected");
    return true;
  } catch (e) {
    console.error("❌ Backend not responding:", e.message);
    throw new Error("Cannot connect to backend at " + BACKEND_URL);
  }
}

// --------------------------------------------------------------------------
// Login via backend
// --------------------------------------------------------------------------
export async function dbLogin(email, password) {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!resp.ok) {
      try {
        const err = await resp.json();
        return { ok: false, message: err.detail || "Login failed" };
      } catch {
        return { ok: false, message: `Login failed (${resp.status} ${resp.statusText})` };
      }
    }

    const data = await resp.json();
    return {
      ok: true,
      user: data.user,
    };
  } catch (e) {
    console.error("dbLogin error:", e);
    return { ok: false, message: "Network error: " + e.message };
  }
}

// --------------------------------------------------------------------------
// Register via backend
// --------------------------------------------------------------------------
export async function dbRegister(email, password, name) {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        name: name.trim(),
      }),
    });

    if (!resp.ok) {
      try {
        const err = await resp.json();
        return { ok: false, message: err.detail || "Registration failed" };
      } catch {
        return { ok: false, message: `Registration failed (${resp.status} ${resp.statusText})` };
      }
    }

    return { ok: true };
  } catch (e) {
    console.error("dbRegister error:", e);
    return { ok: false, message: "Network error: " + e.message };
  }
}

// --------------------------------------------------------------------------
// Admin registration via backend
// --------------------------------------------------------------------------
export async function dbAdminRegister(email, password, name, adminEmail, adminPassword) {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/auth/admin-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        name: name.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
      }),
    });

    if (!resp.ok) {
      try {
        const err = await resp.json();
        return { ok: false, message: err.detail || "Admin registration failed" };
      } catch {
        return { ok: false, message: `Admin registration failed (${resp.status} ${resp.statusText})` };
      }
    }

    return { ok: true };
  } catch (e) {
    console.error("dbAdminRegister error:", e);
    return { ok: false, message: "Network error: " + e.message };
  }
}

// --------------------------------------------------------------------------
// Admin helpers (mock data for now - could be expanded)
// --------------------------------------------------------------------------

export function dbGetAllUsers() {
  // Would need a new backend endpoint to fetch all users
  return [];
}

export function dbSetRole(userId, newRole) {
  // Would need a new backend endpoint to update user roles
  return { ok: false, message: "Not implemented" };
}

export function dbGetLoginLogs() {
  // Would need a new backend endpoint to fetch login logs
  return [];
}
