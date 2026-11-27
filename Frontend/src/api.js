// src/api.js
import axios from "axios";
import { demoAdapter } from "./demo/mockApi.js";

export const DEMO_MODE = import.meta.env.VITE_DEMO === "true";

// Same-origin "/api": in development Vite forwards it to the backend on :5000 (vite.config.js),
// on Vercel the frontend's vercel.json forwards it to the backend project.
// VITE_API_URL overrides it if the API ever lives somewhere else.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// `npm run demo` serves sample data instead of calling the backend
if (DEMO_MODE) API.defaults.adapter = demoAdapter;

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    // ensure header format matches authMiddleware expectation "Bearer <token>"
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// A login that has expired (or an account that was removed) answers 401:
// clear it and go back to the sign-in page instead of leaving every page half-broken.
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    if (err.response?.status === 401 && localStorage.getItem("token") && !url.startsWith("/auth/login")) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_user");
      } catch {
        /* ignore */
      }
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export default API;
