"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "./pages/Header";
import Footer from "./pages/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Define pages where Sidebar/Header should be hidden
  // Hide on Landing, Admin Login, and Admin Dashboard (since it has its own sidebar)
  const isFullScreen = pathname === "/" || pathname?.startsWith("/admin");

  useEffect(() => {
    // Global Auth Guard
    const token = localStorage.getItem("token");
    const isPublicRoute = pathname === "/" || pathname === "/admin/login";

    if (!token && !isPublicRoute) {
      router.push("/");
    }
  }, [pathname, router]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (Header) - Handles its own hidden state internally if we keep logic there, 
          but cleaner to control layout here. 
          Actually Header.tsx has specific logic for hidden. 
          Let's rely on Header to render null if needed, but we need to know for margin.
      */}

      {!isFullScreen && <Header />}

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${!isFullScreen ? "pt-20 md:pt-0 md:ml-72 p-4 md:p-8" : ""}`}
      >
        {children}
        {!isFullScreen && (
          <div className="mt-10">
            <Footer />
          </div>
        )}
      </main>
    </div>
  );
}
