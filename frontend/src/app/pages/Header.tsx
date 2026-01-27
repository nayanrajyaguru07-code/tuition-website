"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, Home, Wallet, Users, UserPlus, Briefcase, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { API } from "@/lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hostelName, setHostelName] = useState("Hostel Manager");
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false); // Mobile menu state
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    if (token) {
      API.get("/api/auth/me")
        .then((res) => {
          if (res.data?.hostel) {
             setHostelName(res.data.hostel.hostelName);
             // Verify if Super Admin
             if (res.data.hostel.email === "admin@tuition.com") {
                setIsAdmin(true);
             }
          }
        })
        .catch((err) => console.error("Header Auth Error", err));
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // Nav Items Configuration
  const navItems = [
    { label: "Home", href: "/home", icon: <Home size={20} /> },
    // Dashboard only for Admin
    ...(isAdmin ? [{ label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> }] : []),
    { label: "Students", href: "/students", icon: <Users size={20} /> },
    { label: "Add Student", href: "/students/add", icon: <UserPlus size={20} /> },
    { label: "Staff", href: "/staff", icon: <Briefcase size={20} /> },
    { label: "Fee Collection", href: "/fee", icon: <Wallet size={20} /> },
    { label: "Expenses", href: "/expenses", icon: <Wallet size={20} /> },
  ];

  return (
    <>
      {/* MOBILE TOGGLE (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white z-50 px-4 py-3 flex items-center justify-between border-b shadow-sm">
         <span className="font-bold text-gray-900 truncate max-w-[200px]">{hostelName}</span>
         <button onClick={() => setOpen(!open)} className="text-gray-700">
           {open ? <X /> : <Menu />}
         </button>
      </div>

      {/* SIDEBAR (Hidden on mobile unless open, Fixed on Desktop) */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 flex flex-col transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${/* Push down on mobile to avoid overlap with toggle bar */ "pt-16 md:pt-0"}
      `}>
        
        {/* BRAND (Desktop only) */}
        <div className="hidden md:flex items-center gap-3 p-8 pb-6">
           <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
             <Home size={20} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none truncate max-w-[140px]" title={hostelName}>
                {hostelName}
              </h1>
              <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Manager Portal</span>
           </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
           <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Main Menu</p>
           {navItems.map((item) => {
             const isActive = pathname === item.href;
             return (
               <Link
                 key={item.href}
                 href={item.href}
                 onClick={() => setOpen(false)}
                 className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                   isActive
                     ? "bg-orange-50 text-orange-700 shadow-sm"
                     : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                 }`}
               >
                 <span className={isActive ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600"}>
                   {item.icon}
                 </span>
                 <span>{item.label}</span>
                 {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
               </Link>
             );
           })}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-gray-100">
           {isLoggedIn && (
             <button
               onClick={logout}
               className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95"
             >
               <LogOut size={18} />
               <span>Logout</span>
             </button>
           )}
        </div>
      </div>
      
      {/* MOBILE OVERLAY */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
