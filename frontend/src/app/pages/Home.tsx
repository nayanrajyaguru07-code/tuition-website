"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, UserPlus, Briefcase, Wallet } from "lucide-react";
import { API } from "@/lib/api";

type Hostel = {
  id: number;
  hostelName: string;
  email: string;
};

const features = [
  {
    title: "Add Student",
    description: "Register a new student with documents",
    href: "/students/add",
    icon: <UserPlus size={26} />,
    bg: "bg-orange-50",
    iconBg: "from-orange-400 to-orange-500",
    glow: "from-orange-300/40 to-orange-400/40",
  },
  {
    title: "View Students",
    description: "List all registered students",
    href: "/students",
    icon: <Users size={26} />,
    bg: "bg-red-50",
    iconBg: "from-red-400 to-red-500",
    glow: "from-red-300/40 to-red-400/40",
  },
  {
    title: "Staff Management",
    description: "Add, update or remove staff",
    href: "/staff",
    icon: <Briefcase size={26} />,
    bg: "bg-amber-50",
    iconBg: "from-amber-400 to-amber-500",
    glow: "from-amber-300/40 to-amber-400/40",
  },
  {
    title: "Expense Tracker",
    description: "Track and manage hostel expenses",
    href: "/expenses",
    icon: <Wallet size={26} />,
    bg: "bg-rose-50",
    iconBg: "from-rose-400 to-rose-500",
    glow: "from-rose-300/40 to-rose-400/40",
  },
];

export default function Home() {
  const [hostel, setHostel] = useState<Hostel | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    API.get("/api/auth/me")
      .then((res) => {
        if (res.data?.hostel) {
          setHostel(res.data.hostel);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br  p-6 md:p-10">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 p-8 text-white shadow-xl">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {hostel ? hostel.hostelName : "Welcome"}
          </h1>
          <p className="mt-1 text-white/90 text-sm md:text-base">
            Manage your hostel — students, staff, fees, and expenses.
          </p>
        </div>
      </div>

      {/* FEATURE GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
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
