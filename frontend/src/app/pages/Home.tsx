"use client"; // Required because DashboardCard uses a Link and is interactive

// --- Modified imports: Added useRouter ---
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import React from "react";
import {
  ClipboardList,
  Megaphone,
  CalendarDays,
  UserCheck,
  UmbrellaIcon,
  Plus,
  UserCog,
  IndianRupee,
  Users,
  LayoutDashboard,
} from "lucide-react";

// --- DashboardCard Component Definition (No Change) ---
interface DashboardCardProps {
  title: string;
  icon: React.ElementType; // Type for Lucide icons
  href: string;
}

function DashboardCard({ title, icon: Icon, href }: DashboardCardProps) {
  return (
    <Link href={href}>
      <Card className="flex flex-col items-center justify-center p-6 text-center shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer h-40 w-48">
        <CardContent className="flex flex-col items-center p-0 pt-4">
          <Icon className="h-10 w-10 text-gray-700 dark:text-white mb-3" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  );
}
// --- End of DashboardCard Definition ---

// --- Defined item lists based on role (No Change) ---
const teacherItems = [
  {
    title: " Dashboard",
    icon: LayoutDashboard,
    href: "/admin-dashboard",
  },

  { title: "Add Student useing Excel", icon: Users, href: "/add-student" },
  {
    title: "Student Attendance",
    icon: UserCheck,
    href: "/attendance-management",
  },
  { title: "Staff Management", icon: UserCog, href: "/staff-management" },
  {
    title: "feculty Attendance",
    icon: UserCheck,
    href: "/staff-attendance",
  },
  { title: "Exam's", icon: ClipboardList, href: "/exam-management" },
  { title: "Fee's", icon: IndianRupee, href: "/fee-management" },
  {
    title: "Timetable",
    icon: CalendarDays,
    href: "/timetable-management/view",
  },
  { title: "Events", icon: Megaphone, href: "/event-management" },
  {
    title: "Holidayes",
    icon: UmbrellaIcon,
    href: "/holiday-management",
  },
  { title: "Add Department", icon: Plus, href: "/add-school" },
];

export default function HomePage() {
  // Added router as a dependency

  // --- Determine which items to display ---
  const itemsToDisplay = teacherItems;

  // --- This part only renders if isLoading is false AND a role was found ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="flex-grow container mx-auto p-8">
        {itemsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
            {itemsToDisplay.map((item) => (
              <DashboardCard
                key={item.href}
                title={item.title}
                icon={item.icon}
                href={item.href}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-700 dark:text-white">
            No dashboard items available for your role.
          </div>
        )}
      </main>
    </div>
  );
}
