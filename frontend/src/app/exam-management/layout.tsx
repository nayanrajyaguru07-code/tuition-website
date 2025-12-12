import Link from "next/link";

// app/exam-management/layout.tsx
export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/exam-management">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            Examination Management
          </h1>
        </Link>
        <p className="text-muted-foreground">
          Schedule exams, enter student marks, and view results.
        </p>
      </div>
      {/* Page content will be rendered here */}
      {children}
    </div>
  );
}
