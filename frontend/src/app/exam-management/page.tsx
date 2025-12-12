// app/exam-management/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, ClipboardEdit, BookOpenCheck } from "lucide-react";

export default function ExamHomePage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Create & Schedule Exam Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Schedule Exam</CardTitle>
          <CalendarPlus className="w-6 h-6 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Create a new exam series and set the subject-wise timetable.
          </p>
          <Button
            onClick={() => router.push("/exam-management/create-schedule")}
          >
            Go to Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Enter Marks Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Enter Marks</CardTitle>
          <ClipboardEdit className="w-6 h-6 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Input student scores for a specific subject and exam.
          </p>
          <Button onClick={() => router.push("/exam-management/enter-marks")}>
            Go to Marks Entry
          </Button>
        </CardContent>
      </Card>

      {/* View Results Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">View Results</CardTitle>
          <BookOpenCheck className="w-6 h-6 text-purple-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate and view detailed student report cards.
          </p>
          <Button onClick={() => router.push("/exam-management/view-results")}>
            Go to Results
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
