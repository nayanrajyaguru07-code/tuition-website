"use client";

import { useState, FormEvent } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";

export default function AuthSlider() {
  const [isRegister, setIsRegister] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [hostelName, setHostelName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const res = await API.post("/api/auth/login", {
      email: loginEmail,
      password: loginPassword,
    });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("hostel", JSON.stringify(res.data.hostel));
    toast.success("Login successful");
    location.href = "/home";
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    await API.post("/api/auth/signup", {
      hostelName,
      email: regEmail,
      password: regPassword,
    });
    toast.success("Registered successfully");
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      <div className="relative w-full max-w-4xl h-[520px]">
        <div
          className={`absolute top-0 left-0 w-[200%] h-full flex transition-transform duration-700 ${
            isRegister ? "-translate-x-1/2" : "translate-x-0"
          }`}
        >
          {/* LOGIN */}
          <div className="w-1/2 flex items-center justify-center">
            <form
              onSubmit={handleLogin}
              className="bg-white p-6 rounded shadow w-96"
            >
              <h2 className="text-xl mb-4">Login</h2>
              <input
                placeholder="Email"
                className="border p-2 w-full mb-3"
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="border p-2 w-full mb-3"
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button className="bg-black text-white w-full p-2">Login</button>
              <p className="mt-3 text-sm text-center">
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-blue-500"
                >
                  Register
                </button>
              </p>
            </form>
          </div>

          {/* REGISTER */}
          <div className="w-1/2 flex items-center justify-center bg-gray-50">
            <form
              onSubmit={handleRegister}
              className="bg-white p-6 rounded shadow w-96"
            >
              <h2 className="text-xl mb-4">Register</h2>
              <input
                placeholder="Hostel Name"
                className="border p-2 w-full mb-3"
                onChange={(e) => setHostelName(e.target.value)}
              />
              <input
                placeholder="Email"
                className="border p-2 w-full mb-3"
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="border p-2 w-full mb-3"
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <button className="bg-black text-white w-full p-2">
                Register
              </button>
              <p className="mt-3 text-sm text-center">
                Have account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-blue-500"
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
