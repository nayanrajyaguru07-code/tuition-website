"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChevronRight,
  Clock,
  BookOpen,
  CalendarDays,
  PenSquare,
} from "lucide-react";

// 1. Define the navigation tasks, separated by category
const viewTasks = [
  {
    href: "/timetable-management/view/classAndteacher",
    icon: CalendarDays,
    title: "Class & Teacher Timetable",
    description: "View the combined schedule for all classes and teachers.",
  },
];

const manageTasks = [
  {
    href: "/timetable-management/view/assign-periods",
    icon: Clock,
    title: "Manage Periods",
    description: "Create, edit, or delete time slots in the school day.",
  },
  {
    href: "/timetable-management/view/subject-master",
    icon: BookOpen,
    title: "Add Class and Subject",
    description:
      "Define classes and subjects to be used in timetable scheduling.",
  },
  {
    href: "/timetable-management/view/assign-subjects",
    icon: PenSquare,
    title: "Assign Period to Teacher",
    description: "Assign a specific teacher and subject to a period.",
  },
];

export default function TimetableDashboardPage() {
  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen rounded-lg">
      <Link href="/timetable-management/view" className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Timetable Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a task to manage school schedules, periods, and assignments.
        </p>
      </Link>

      {/* --- View Timetables Category --- */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4">
          View Timetables
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {viewTasks.map((task) => (
            <Link href={task.href} key={task.title} className="group">
              <Card className="h-full transition-all shadow-sm hover:shadow-lg hover:border-primary/60 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {task.title}
                  </CardTitle>
                  <task.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm min-h-[40px]">
                    {task.description}
                  </CardDescription>
                  <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Page <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* --- Create & Manage Timetables Category --- */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4">
          Create & Manage Timetables
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manageTasks.map((task) => (
            <Link href={task.href} key={task.title} className="group">
              <Card className="h-full transition-all shadow-sm hover:shadow-lg hover:border-primary/60 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {task.title}
                  </CardTitle>
                  <task.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm min-h-[40px]">
                    {task.description}
                  </CardDescription>
                  <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Page <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
