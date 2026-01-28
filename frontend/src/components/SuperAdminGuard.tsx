"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

interface SuperAdminGuardProps {
  children: ReactNode;
}

const SuperAdminGuard = ({ children }: SuperAdminGuardProps) => {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized" | "forbidden">("loading");

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 1. If no token, redirect to Login
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);

      // 2. Check Permissions (ID 0 & Email)
      if (decoded.id === 0 && decoded.email === "admin@tuition.com") {
        setStatus("authorized"); // ✅ Show Content
      } else {
        setStatus("forbidden"); // ❌ Show "Not Super Admin" message
      }
    } catch (error) {
      console.error("Token Error:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  // Case 1: Checking...
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Checking Permissions...
      </div>
    );
  }

  // Case 2: Access Denied (Token valid, but wrong ID)
  if (status === "forbidden") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You are not a Super Admin.</p>
          <p className="text-sm text-gray-400 mt-2">ID: 0 required.</p>
          
          <button 
            onClick={() => router.push("/login")}
            className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Authorized
  return <>{children}</>;
};

export default SuperAdminGuard;