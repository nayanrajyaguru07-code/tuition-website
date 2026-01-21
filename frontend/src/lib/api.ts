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

      // ⛔ Don't attach token to auth routes
      const isAuthRoute =
        config.url?.includes("/login") ||
        config.url?.includes("/register") ||
        config.url?.includes("/auth");

      if (token && !isAuthRoute) {
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
        localStorage.clear();
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  },
);
