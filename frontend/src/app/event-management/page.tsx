// app/event-management/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CalendarDays } from "lucide-react";

export default function EventHomePage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Create Event Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">
            Create New Event
          </CardTitle>
          <PlusCircle className="w-6 h-6 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add a new school event, like a sports day or annual function.
          </p>
          <Button onClick={() => router.push("/event-management/create")}>
            Create Event
          </Button>
        </CardContent>
      </Card>

      {/* View Events Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">View All Events</CardTitle>
          <CalendarDays className="w-6 h-6 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            See a list of all upcoming and past school events.
          </p>
          <Button onClick={() => router.push("/event-management/view")}>
            View Events
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
