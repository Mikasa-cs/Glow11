// src/auth/AuthContext.jsx
// Auth context backed by FastAPI backend (server.py).
// Users are stored in backend SQLite database (users.db).

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { initDB, dbLogin } from "./db";

const STORAGE_SESSION = "glowiq_session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [error,   setError]   = useState(null);
  const initDone = useRef(false);

  // ── Initialise backend connection once on mount ────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    (async () => {
      try {
        await initDB();
        // Restore session from localStorage after backend is ready
        try {
          const saved = localStorage.getItem(STORAGE_SESSION);
          if (saved) setUser(JSON.parse(saved));
        } catch {
          // ignore corrupt session
        }
        setDbReady(true);
      } catch (e) {
        console.error("Failed to connect to backend:", e.message);
        setError(e.message);
        setDbReady(true); // Still mark ready to avoid endless waiting
      }
    })();
  }, []);

  // ── Keep session in localStorage in sync ────────────────────────────────
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_SESSION);
    }
  }, [user]);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    if (!dbReady) return { ok: false, message: "Database not ready yet." };
    const result = await dbLogin(email, password);
    if (result.ok) setUser(result.user);
    return result;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, dbReady, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
