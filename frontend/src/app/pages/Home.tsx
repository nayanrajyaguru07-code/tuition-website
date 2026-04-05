"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, UserPlus, Briefcase, Wallet, Bed } from "lucide-react";
import { API } from "@/lib/api";

type Feature = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  bg: string;
  iconBg: string;
  glow: string;
};

const features = [
  {
    title: "Add Student",
    description: "Register a new student",
    href: "/students/add",
    icon: <UserPlus size={26} />,
    bg: "bg-orange-50",
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
  },
  {
    title: "Manage Rooms",
    description: "Manage hostel rooms & availability",
    href: "/rooms",
    icon: <Bed size={26} />,
    bg: "bg-blue-50",
    iconBg: "from-blue-400 to-blue-500",
    glow: "from-blue-300/40 to-blue-400/40",
  },
  {
    title: "Add Fee",
    description: "Collect student fees",
    href: "/fee/add",
    icon: <Wallet size={26} />,
    bg: "bg-red-50",
    iconBg: "from-red-400 to-red-500",
    glow: "from-red-300/40 to-red-400/40",
  },
  {
    title: "Add Staff",
    description: "Register a new staff member",
    href: "/staff/add",
    icon: <Briefcase size={26} />,
    bg: "bg-amber-50",
    iconBg: "from-amber-400 to-amber-500",
    glow: "from-amber-300/40 to-amber-400/40",
  },
  {
    title: "Add Expense",
    description: "Record a new expense",
    href: "/expenses/add",
    icon: <Wallet size={26} />,
    bg: "bg-rose-50",
    iconBg: "from-rose-400 to-rose-500",
    glow: "from-rose-300/40 to-rose-400/40",
  },
  {
    title: "View Students",
    description: "List all registered students",
    href: "/students",
    icon: <Users size={26} />,
    bg: "bg-orange-50",
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
  },
  {
    title: "Fee History",
    description: "View fee records",
    href: "/fee",
    icon: <Wallet size={26} />,
    bg: "bg-red-50",
    iconBg: "from-red-400 to-red-500",
    glow: "from-red-300/40 to-red-400/40",
  },
  {
    title: "View Staff",
    description: "Manage staff details",
    href: "/staff",
    icon: <Briefcase size={26} />,
    bg: "bg-amber-50",
    iconBg: "from-amber-400 to-amber-500",
    glow: "from-amber-300/40 to-amber-400/40",
  },
  {
    title: "Staff Salary",
    description: "Manage salary payments",
    href: "/salary",
    icon: <Wallet size={26} />,
    bg: "bg-amber-50",
    iconBg: "from-amber-400 to-amber-500",
    glow: "from-amber-300/40 to-amber-400/40",
  },
  {
    title: "View Expenses",
    description: "Track all hostel expenses",
    href: "/expenses",
    icon: <Wallet size={26} />,
    bg: "bg-rose-50",
    iconBg: "from-rose-400 to-rose-500",
    glow: "from-rose-300/40 to-rose-400/40",
  },
];

export default function Home() {
  // Since ClientLayout protects this route, we can assume user is logged in or being redirected.
  const [isAdmin, setIsAdmin] = useState(false);

  const visibleFeatures = features.filter(
    (f) => f.title !== "Dashboard" || isAdmin,
  );

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* HEADER GREETING */}
      <div className="max-w-7xl mx-auto mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome Back, Manager 👋
        </h1>
        <p className="text-gray-500 mt-2">
          Select an action to proceed with your daily tasks.
        </p>
      </div>

      {/* FEATURE GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {features.map((f) => (
          <Link
            key={f.title}
            href={f.href}
            className={`group relative rounded-2xl border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 overflow-hidden ${f.bg}`}
          >
            {/* GLOW */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r ${f.glow}`}
            />

            {/* ICON */}
            <div
              className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-r ${f.iconBg} shadow-md mb-4`}
            >
              {f.icon}
            </div>

            {/* CONTENT */}
            <h2 className="relative z-10 text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition">
              {f.title}
            </h2>
            <p className="relative z-10 text-gray-600 text-sm mt-1">
              {f.description}
            </p>

            {/* CTA */}
            <div className="relative z-10 mt-5 inline-flex items-center gap-1 text-sm font-medium text-orange-600">
              Open
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
