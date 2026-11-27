// src/api.js
import axios from "axios";
import { demoAdapter } from "./demo/mockApi.js";

export const DEMO_MODE = import.meta.env.VITE_DEMO === "true";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // <-- backend port
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

export default API;
