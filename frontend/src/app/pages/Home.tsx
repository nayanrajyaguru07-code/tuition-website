"use client";

import Link from "next/link";
import { Users, UserPlus, Briefcase, Wallet, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

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

// Features available to Logged In Admins
const adminFeatures: Feature[] = [
  {
    title: "Dashboard",
    description: "Overview of your hostel stats",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={26} />,
    bg: "bg-orange-50",
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
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
    title: "Fee History",
    description: "View fee records",
    href: "/fee",
    icon: <Wallet size={26} />,
    bg: "bg-orange-50",
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
  },
  {
    title:"staff salary",
    description:"View staff salary",
    href:"/salary",
    icon:<Wallet size={26} />,
    bg:"bg-red-50",
    iconBg:"from-red-400 to-red-500",
    glow:"from-red-300/40 to-red-400/40",
  },
  {
    title: "Add Student",
    description: "Register a new student",
    href: "/students/add",
    icon: <UserPlus size={26} />,
    bg: "bg-red-50",
    iconBg: "from-red-400 to-red-500",
    glow: "from-red-300/40 to-red-400/40",
  },
  {
    title: "View Students",
    description: "List all students",
    href: "/students",
    icon: <Users size={26} />,
    bg: "bg-orange-50",
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
  },
  {
    title: "Add Staff",
    description: "Register new staff member",
    href: "/staff/add",
    icon: <UserPlus size={26} />,
    bg: "bg-red-50",
    iconBg: "from-red-400 to-red-500",
    glow: "from-red-300/40 to-red-400/40",
  },
  {
    title: "View Staff",
    description: "Manage staff records",
    href: "/staff",
    icon: <Briefcase size={26} />,
    bg: "bg-orange-50", 
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
  },
  {
    title: "Add Expense",
    description: "Record a new expense",
    href: "/expenses/add",
    icon: <Wallet size={26} />,
    bg: "bg-red-50",
    iconBg: "from-red-400 to-red-500",
    glow: "from-red-300/40 to-red-400/40",
  },
  {
    title: "View Expenses",
    description: "Track all expenses",
    href: "/expenses",
    icon: <Wallet size={26} />,
    bg: "bg-orange-50",
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
  },
 
];

// Features visible to Guests (Not Logged In)
// REMOVED as per request - Route is now protected

export default function Home() {
  // Since ClientLayout protects this route, we can assume user is logged in or being redirected.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    API.get("/api/auth/me")
      .then((res) => {
        if (res.data?.hostel?.email === "admin@tuition.com") {
          setIsAdmin(true);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const visibleFeatures = adminFeatures.filter(
    (f) => f.title !== "Dashboard" || isAdmin
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

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {visibleFeatures.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Link
      href={feature.href}
      className={`group relative rounded-2xl border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 overflow-hidden ${feature.bg}`}
    >
      {/* GLOW */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r ${feature.glow}`}
      />

      {/* ICON */}
      <div
        className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-r ${feature.iconBg} shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        {feature.icon}
      </div>

      {/* CONTENT */}
      <h2 className="relative z-10 text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition">
        {feature.title}
      </h2>
      <p className="relative z-10 text-gray-600 text-sm mt-1">
        {feature.description}
      </p>

      {/* CTA */}
      <div className="relative z-10 mt-5 inline-flex items-center gap-1 text-sm font-medium text-orange-600 group-hover:text-orange-700">
        Open
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
