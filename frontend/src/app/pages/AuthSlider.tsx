"use client";

import { useState, FormEvent } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function AuthSlider() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [hostelName, setHostelName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

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

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post("/api/auth/signup", {
        hostelName,
        email: regEmail,
        password: regPassword,
      });
      toast.success("Registered successfully");
      setIsRegister(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 overflow-hidden p-6">
      <div className="relative w-full max-w-4xl h-[520px] rounded-3xl shadow-2xl bg-white/70 backdrop-blur border border-orange-100 overflow-hidden">
        {/* SLIDER WRAPPER */}
        <div
          className={`absolute top-0 left-0 w-[200%] h-full flex transition-transform duration-700 ease-in-out ${
            isRegister ? "-translate-x-1/2" : "translate-x-0"
          }`}
        >
          {/* LOGIN */}
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
                onChange={(e) => setLoginEmail(e.target.value)}
              />

              <input
                required
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-4"
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


              <Link href="/admin/login">
              <button className="text-orange-600 font-semibold hover:underline"> 
                admin login 
              </button>
              </Link>

              <p className="mt-4 text-sm text-center text-gray-600">
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Register
                </button>
              </p>
            </form>
          </div>

          {/* REGISTER */}
          <div className="w-1/2 flex items-center justify-center px-6 bg-gradient-to-br from-orange-50 to-red-50">
            <form
              onSubmit={handleRegister}
              className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-orange-100 p-7"
            >
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Create Account
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Register your hostel in seconds
              </p>

              <input
                required
                placeholder="Hostel Name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-3"
                onChange={(e) => setHostelName(e.target.value)}
              />

              <input
                required
                type="email"
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-3"
                onChange={(e) => setRegEmail(e.target.value)}
              />

              <input
                required
                type="password"
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none mb-4"
                onChange={(e) => setRegPassword(e.target.value)}
              />

              <button
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-2.5 rounded-xl font-semibold shadow-md transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Register"
                )}
              </button>

              <p className="mt-4 text-sm text-center text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
