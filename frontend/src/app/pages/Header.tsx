"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { API } from "@/lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hostelName, setHostelName] = useState("Hostel Manager");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    if (token) {
      API.get("/api/auth/me")
        .then((res) => {
          if (res.data?.hostel?.hostelName) {
            setHostelName(res.data.hostel.hostelName);
          }
        })
        .catch((err) => console.error("Header Auth Error", err));
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // 🚫 Hide header on /auth and all sub-routes, and admin login
  if (pathname === "/" || pathname === "/admin/login") {
    return null;
  }

  const NavLinks = () => (
    <>
      {[
        ["Home", "/home"],
        ["Dashboard", "/admin/dashboard"],
        ["Salary", "/admin/salary"],
        ["Students", "/students"],
        ["Add Student", "/students/add"],
        ["Fee", "/fee"],
        ["Expenses", "/expenses"],
        ["Profile", "/profile"],
      ].map(([label, href]) => (
        <Link
          key={label}
          href={href}
          className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition"
        >
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 p-4 max-w-7xl md:min-w-7xl mt-2 rounded-full md:ml-30 mb-5 bg-white/90 backdrop-blur border-b border-orange-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* LOGO */}
        <Link
          href="/home"
          className="text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
        >
          {hostelName}
        </Link>

        {/* DESKTOP NAV */}
        {isLoggedIn && (
          <nav className="hidden md:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
            <NavLinks />

            <button
              onClick={logout}
              className="ml-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        )}

        {/* MOBILE MENU BUTTON */}
        {isLoggedIn && (
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 transition"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* MOBILE NAV */}
      {isLoggedIn && open && (
        <div className="md:hidden bg-white border-t  border-orange-100 shadow-lg">
          <nav className="flex flex-col gap-2 px-6 py-4 text-sm font-medium text-gray-700">
            <NavLinks />

            <button
              onClick={logout}
              className="mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
