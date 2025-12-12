// app/staff-management/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";

export default function StaffHomePage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* View Staff List Card */}

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">
            Add Staff With Excel{" "}
          </CardTitle>
          <Users className="w-6 h-6 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add staf members by using the excel sheet.
          </p>
          <Button onClick={() => router.push("/staff-management/add-excel")}>
            Add via Excel
          </Button>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">View Staff List</CardTitle>
          <UserPlus className="w-6 h-6 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Browse, search, and manage the list of all active staff members.
          </p>
          <Button onClick={() => router.push("/staff-management/view")}>
            View List
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
