// app/timetable-management/layout.tsx
"use client";

export default function TimetableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 ">
      {/* Page Title */}

      {/* Card container for page content */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        {/* The content of each page (like the cards below) will be rendered here */}
        {children}
      </div>
    </div>
  );
}
