import Link from "next/link";

// app/event-management/layout.tsx
export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/event-management">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            Event Management
          </h1>
        </Link>
        <p className="text-muted-foreground">
          Create new events and view upcoming school activities.
        </p>
      </div>
      {/* Page content will be rendered here */}
      {children}
    </div>
  );
}
