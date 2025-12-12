"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  UserCheck,
  ClipboardList,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  UserCog,
  IndianRupee,
  Megaphone,
  UmbrellaIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "./auth/AuthContext";

// ---------------- MENU ITEMS ----------------

const teacherItems = [
  {
    title: " Dashboard",
    icon: LayoutDashboard,
    href: "/admin-dashboard",
  },
  {
    title: "live Mittenig",
    icon: LayoutDashboard,
    href: "/meet",
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

// ---------------- SIDEBAR ----------------
function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

  // ✅ Hooks must come first
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { logout, user } = useAuth() as any;

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const sessionToken = localStorage.getItem("token");

    // preserve previous redirect behavior: only redirect if you're NOT already on "/"
    if (!role || !sessionToken) {
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.replace("/");
      }
    } else {
      setUserRole(role);
      setToken(sessionToken);
    }
  }, []); // run once

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student_id");
    localStorage.removeItem("user_role");
    if (logout) logout();
    window.location.replace("/");
  };

  // pages where we want only logo + school name (no sidebar, no avatar)
  const hideSidebar =
    pathname === "/" || pathname === "/login" || pathname === "/admin/login";

  // NOTE: menu items (unchanged)
  const menuItems = teacherItems;

  // --- Minimal top bar for hidden pages ---
  if (hideSidebar) {
    return (
      <>
        {/* Minimal mobile header (logo + school name) */}
        <div className="lg:hidden fixed top-0 left-0 w-full flex items-center justify-start px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50">
          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/school-logo.jpg"
              alt="School Logo"
              width={40}
              height={40}
              className="object-contain rounded"
            />
            <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              SMV school Dwarka
            </span>
          </Link>
        </div>

        {/* Minimal desktop header (logo + school name) */}
        <header className="hidden lg:flex items-center justify-start px-6 py-3 fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40">
          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/school-logo.jpg"
              alt="School Logo"
              width={40}
              height={40}
              className="object-contain rounded"
            />
            <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              SMV school Dwarka
            </span>
          </Link>
        </header>
      </>
    );
  }

  // --- Full header + sidebar for other pages ---
  return (
    <>
      {/* ===== MOBILE TOP BAR (small screens): avatar + menu toggle ===== */}
      <div className="lg:hidden fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50">
        <Link href="/home" className="flex items-center gap-3">
          <Image
            src="/school-logo.jpg"
            alt="School Logo"
            width={40}
            height={40}
            className="object-contain rounded"
          />
          <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            SMV Highschool
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Avatar / Dropdown (only when token exists) */}
          {token && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage
                      src={user?.avatarUrl || "/user-avtar.png"}
                      alt="User"
                    />
                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuLabel>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole || "No role"}
                  </p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-800 dark:text-slate-200"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* ===== DESKTOP TOP NAVBAR (lg+) ===== */}
      <header className="hidden lg:flex items-center justify-between px-6 py-3 fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/school-logo.jpg"
              alt="School Logo"
              width={40}
              height={40}
              className="object-contain rounded"
            />
            <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              SMV Highschool
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {token && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage
                      src={user?.avatarUrl || "/user-avtar.png"}
                      alt="User"
                    />
                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuLabel>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole || "No role"}
                  </p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* ===== SIDEBAR ===== */}
      <aside
        onMouseEnter={() => setIsHoverOpen(true)}
        onMouseLeave={() => setIsHoverOpen(false)}
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-md flex flex-col transition-all duration-300 ease-in-out z-40
    ${isOpen ? "translate-x-0 w-72" : "-translate-x-full"}
    lg:translate-x-0 lg:top-16 lg:left-0 lg:shadow-none lg:fixed lg:h-[calc(100vh-64px)] lg:overflow-visible
    ${isHoverOpen ? "lg:w-72" : "lg:w-20"}`}
      >
        <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
          {menuItems.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const showLabel = isHoverOpen || isOpen;

            return (
              <Link
                key={link.title}
                href={link.href}
                onClick={() => setIsOpen(false)}
                title={link.title}
                className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div
                  className={`flex-shrink-0 transition-all duration-300 ${
                    showLabel ? "h-6 w-6" : "h-6 w-6 mx-auto"
                  }`}
                >
                  <link.icon />
                </div>

                {showLabel && (
                  <span className="ml-4 whitespace-nowrap">{link.title}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Section */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Content */}
        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 mt-16 transition-all duration-300 ease-in-out lg:mt-16 lg:pl-4 lg:pr-4 ${
            isSidebarOpen ? "lg:ml-72" : "lg:ml-20"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
