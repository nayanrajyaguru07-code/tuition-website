// app/attendance-management/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, FileText } from "lucide-react";

export default function AttendanceHomePage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Mark Attendance Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Mark Attendance</CardTitle>
          <UserCheck className="w-6 h-6 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Take daily attendance for a selected class and date.
          </p>
          <Button onClick={() => router.push("/attendance-management/mark")}>
            Go to Mark Attendance
          </Button>
        </CardContent>
      </Card>

      {/* View Reports Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">View Reports</CardTitle>
          <FileText className="w-6 h-6 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            View and filter attendance records by class, student, or date range.
          </p>
          <Button onClick={() => router.push("/attendance-management/report")}>
            Go to View Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
