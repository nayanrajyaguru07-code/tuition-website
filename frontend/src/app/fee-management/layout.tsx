import Link from "next/link";

// app/fee-management/layout.tsx
export default function FeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/fee-management"
          className="text-sm text-blue-600 hover:underline"
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            Fee Management
          </h1>
        </Link>
        <p className="text-muted-foreground">
          Manage fee structures, collect payments, and track student dues.
        </p>
      </div>
      {/* Page content will be rendered here */}
      {children}
    </div>
  );
}
