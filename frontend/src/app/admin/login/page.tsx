"use client";

import { useState, FormEvent } from "react";
import { API } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/api/auth/login", {
        email,
        password,
        secret,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <div 
             onClick={() => setShowSecret(!showSecret)}
             className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600 cursor-pointer hover:bg-orange-200 transition"
             title="Click for options"
          >
             <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 text-sm">Secure login for Hostel Managers</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address / ID</label>
            <input
              required
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="admin@example.com or 'admin'"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {/* SECRET KEY FIELD (Hidden by default) */}
          {showSecret && (
              <div className="animate-in fade-in slide-in-from-top-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                 <input
                   type="password"
                   value={secret}
                   onChange={(e) => setSecret(e.target.value)}
                   className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                   placeholder="Enter secret for super admin"
                 />
              </div>
          )}



          <button
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
           &copy; {new Date().getFullYear()} Tuition Manafgement System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
