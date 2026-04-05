"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Home,
  Wallet,
  Users,
  UserPlus,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Bed,
} from "lucide-react";
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
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("hostel");
    localStorage.clear(); // Ensure everything is gone
    window.location.href = "/";
  };

  return (
    <>
      {/* MOBILE TOGGLE (Hidden on Desktop) */}
      <div className="md:hidden fixed top-0 left-0 w-full h-20 bg-white/90 backdrop-blur-xl z-40 px-6 flex items-center justify-between border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Home size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-gray-900 truncate max-w-[180px]">
            {hostelName}
          </span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* SIDEBAR (Drawer on mobile, permanent on desktop) */}
      <div
        className={`
        fixed top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 shadow-[20px_0_40px_rgba(0,0,0,0.06)] z-50 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        md:pt-0 pt-0
      `}
      >
        {/* BRAND */}
        <div className="flex items-center gap-3 p-8 pb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Home size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1
              className="text-lg font-bold tracking-tight text-gray-900 leading-none truncate max-w-[140px]"
              title={hostelName}
            >
              {hostelName}
            </h1>
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              Manager Portal
            </span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Main Menu
          </p>

          <NavItem
            href="/home"
            label="Home"
            icon={<Home size={20} />}
            activePath={pathname}
            setOpen={setOpen}
          />

          <NavItem
            href="/rooms"
            label="Manage Rooms"
            icon={<Bed size={20} />}
            activePath={pathname}
            setOpen={setOpen}
          />

          {isAdmin && (
            <NavItem
              href="/admin/dashboard"
              label="Dashboard"
              icon={<LayoutDashboard size={20} />}
              activePath={pathname}
              setOpen={setOpen}
            />
          )}

          <NavGroup
            label="Students"
            icon={<Users size={20} />}
            activePath={pathname}
            items={[
              { label: "All Students", href: "/students" },
              { label: "Add Student", href: "/students/add" },
            ]}
            setOpen={setOpen}
          />

          <NavGroup
            label="Staff"
            icon={<Briefcase size={20} />}
            activePath={pathname}
            items={[
              { label: "All Staff", href: "/staff" },
              { label: "Add Staff", href: "/staff/add" },
            ]}
            setOpen={setOpen}
          />

          <NavGroup
            label="Fee Collection"
            icon={<Wallet size={20} />}
            activePath={pathname}
            items={[
              { label: "Fee Dashboard", href: "/fee" },
              { label: "Collect Fee", href: "/fee/add" },
            ]}
            setOpen={setOpen}
          />

          <NavGroup
            label="Expenses"
            icon={<Wallet size={20} />}
            activePath={pathname}
            items={[{ label: "All Expenses", href: "/expenses" }]}
            setOpen={setOpen}
          />

          <NavGroup
            label="Salary"
            icon={<Wallet size={20} />}
            activePath={pathname}
            items={[{ label: "Salary Dashboard", href: "/salary" }]}
            setOpen={setOpen}
          />
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

      {/* MOBILE OVERLAY (Hidden on Desktop) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

function NavItem({ href, label, icon, activePath, setOpen }: any) {
  const isActive = activePath === href;
  return (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
        isActive
          ? "bg-orange-50 text-orange-700 shadow-sm"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span
        className={
          isActive
            ? "text-orange-600"
            : "text-gray-400 group-hover:text-gray-600"
        }
      >
        {icon}
      </span>
      <span>{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
      )}
    </Link>
  );
}

function NavGroup({ label, icon, items, activePath, setOpen }: any) {
  const isActiveGroup = items.some((i: any) => i.href === activePath);
  const [expanded, setExpanded] = useState(false);

  // Auto-expand if a child is active
  useEffect(() => {
    if (isActiveGroup) setExpanded(true);
  }, [isActiveGroup]);

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
          isActiveGroup || expanded
            ? "text-gray-900 bg-gray-50/50"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={
              isActiveGroup || expanded
                ? "text-orange-600"
                : "text-gray-400 group-hover:text-gray-600"
            }
          >
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {expanded ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-1 ml-4 border-l-2 border-orange-100 pl-2 space-y-1">
          {items.map((sub: any) => {
            const isSubActive = activePath === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                  isSubActive
                    ? "text-orange-700 font-semibold bg-orange-50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
