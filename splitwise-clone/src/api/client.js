import axios from "axios";

// In development the Vite dev server proxies /api → backend, avoiding CORS.
// In production, set VITE_API_BASE_URL to the real backend URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Lazy import to avoid circular dependency: store imports client, client imports store
client.interceptors.request.use((config) => {
  // Read token directly from localStorage (where Zustand persist stores it)
  const stored = localStorage.getItem("auth-storage");
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch {
      // malformed storage — ignore
    }
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default client;
