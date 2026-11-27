import React, { createContext, useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api"; // axios instance

const AuthContext = createContext(null);

// Kept in localStorage (not sessionStorage) so closing the tab or the phone browser
// doesn't log the student out; the token itself expires after 7 days.
const KEY = "auth_user";
const readUser = () => {
  try {
    const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
    return raw && localStorage.getItem("token") ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveUser = (u) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(u));
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the app still works for this visit */
  }
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(readUser);

  // LOGIN — with a roll number (or an email)
  const login = async (identifier, password) => {
    try {
      const { data } = await API.post("/auth/login", { identifier, password });

      const u = {
        token: data.token,
        role: data.role,
        email: data.email,
        name: data.name,
        branch: data.branch,
        batch: data.batch,
        rollNumber: data.rollNumber,
        mustChangePassword: !!data.mustChangePassword,
      };

      setUser(u);
      saveUser(u);
      localStorage.setItem("token", data.token);

      if (u.mustChangePassword) navigate("/change-password", { replace: true });
      else if (u.role === "admin") navigate("/admin", { replace: true });
      else navigate("/", { replace: true });

      return { ok: true, role: u.role };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  };

  // Update the stored user (e.g. after changing the password)
  const updateUser = (changes) => {
    setUser((prev) => {
      const next = { ...prev, ...changes };
      saveUser(next);
      return next;
    });
  };

  // REGISTER (Signup) — everyone signs up as a student; the backend reads the class from the roll number
  const register = async ({ name, email, rollNumber, password }) => {
    try {
      await API.post("/auth/register", { name, email, rollNumber, password });
      navigate("/login", { replace: true, state: { rollNumber } });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Signup failed",
      };
    }
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
      localStorage.removeItem("token");
    } catch {
      /* ignore */
    }
    navigate("/login", { replace: true });
  };

  const value = useMemo(() => ({ user, login, register, logout, updateUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
