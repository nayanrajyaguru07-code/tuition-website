import Link from "next/link";

// app/staff-management/layout.tsx
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/staff-management">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            Staff Management
          </h1>
        </Link>
        <p className="text-muted-foreground">
          Add, view, and manage all staff members in the school.
        </p>
      </div>
      {/* Page content will be rendered here */}
      {children}
    </div>
  );
}
