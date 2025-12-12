import Link from "next/link";

// app/attendance-management/layout.tsx
export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/attendance-management">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            Attendance Management
          </h1>
        </Link>
        <p className="text-muted-foreground">
          Mark daily attendance and view historical reports.
        </p>
      </div>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        {children}
      </div>
    </div>
  );
}
