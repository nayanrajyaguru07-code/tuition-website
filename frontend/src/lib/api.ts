import axios from "axios";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  withCredentials: true,
});

/* ================================
   REQUEST INTERCEPTOR
================================ */
API.interceptors.request.use(
  (config) => {
    // ⚠ Prevent SSR crash
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const url = config.url || "";

      // ⛔ Don't attach token to auth routes
      const isAuthRoute =
        url.includes("/login") ||
        url.includes("/signup") ||
        url.includes("/auth") ||
        url.includes("/register");

      if (token && !isAuthRoute) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* ================================
   RESPONSE INTERCEPTOR
================================ */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        // 🔐 Auto logout on token expiry
        localStorage.removeItem("token"); // safer than clear()
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  },
);
