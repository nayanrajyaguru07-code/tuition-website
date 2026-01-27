"use client";

import { useState, FormEvent } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthSlider() {
  const [activeView, setActiveView] = useState<"login" | "admin">("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // LOGIN STATE
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ADMIN LOGIN STATE
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("hostel", JSON.stringify(res.data.hostel));
      toast.success("Login successful");
      window.location.href = "/home";
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/api/auth/login", {
        email: adminEmail,
        password: adminPassword,
        secret: adminSecret,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("hostel", JSON.stringify(res.data.hostel));
      toast.success("Admin login successful");
      router.push("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  // HELPERS FOR SLIDING
  // order: Admin (0) | Login (1)
  // width: 200%
  // 0% -> Admin
  // -50% -> Login

  const getTranslateData = () => {
    if (activeView === "admin") return "translate-x-0";
    if (activeView === "login") return "-translate-x-1/2";
    return "-translate-x-1/2";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 overflow-hidden p-6">
      <div className="relative w-full max-w-4xl h-[580px] rounded-3xl shadow-2xl bg-white/70 backdrop-blur border border-orange-100 overflow-hidden">
        {/* SLIDER WRAPPER */}
        <div
          className={`absolute top-0 left-0 w-[200%] h-full flex transition-transform duration-700 ease-in-out ${getTranslateData()}`}
        >
          {/* 1. ADMIN LOGIN PANEL */}
          <div className="w-1/2 flex items-center justify-center px-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-7">
              <div className="flex flex-col items-center mb-4">
                <div 
                   className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-2 text-orange-600"
                >
                   {/* ShieldCheck icon removed import above? No, kept Loader2. Need ShieldCheck too */}
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">Admin Portal</h2>
              </div>

              <form onSubmit={handleAdminLogin}>
                <input
                  required
                  type="text"
                  placeholder="Admin Email / ID"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-3"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
                <input
                  required
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-3"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Secret Key"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-3"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                />

                <button
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-xl font-semibold shadow-md transition disabled:opacity-60 mb-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Admin Login"}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setActiveView("login")}
                  className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
                >
                  &larr; Back to User Login
                </button>
              </div>
            </div>
          </div>

          {/* 2. USER LOGIN PANEL */}
          <div className="w-1/2 flex items-center justify-center px-6">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-orange-100 p-7"
            >
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Login to manage your hostel
              </p>

              <input
                required
                type="email"
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-3"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />

              <input
                required
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-4"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />

              <button
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2.5 rounded-xl font-semibold shadow-md transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Login"
                )}
              </button>

              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView("admin")}
                  className="text-orange-600 font-semibold hover:underline text-sm"
                >
                  Admin Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
