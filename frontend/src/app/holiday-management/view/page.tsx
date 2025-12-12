// You can save this file as e.g., components/holiday/HolidayList.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Data Type ---
interface Holiday {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

/** Formats an ISO string (from API) to a user-friendly display format */
const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "do MMM, yyyy");
  } catch (error) {
    console.error("Error formatting date for display:", error);
    return "Invalid Date";
  }
};

export default function HolidayList() {
  // State for data and loading
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch holidays on component mount
  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/holiday`,
          {
            withCredentials: true,
          }
        );
        setHolidays(response.data || []);
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
        toast.error("Could not load holiday list.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolidays();
  }, []); // Empty dependency array ensures this runs only once

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holiday List</CardTitle>
        <CardDescription>
          A list of all upcoming and past school holidays.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Holiday Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No holidays found.
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell>
                    {formatDateForDisplay(holiday.start_date)}
                  </TableCell>
                  <TableCell>
                    {formatDateForDisplay(holiday.end_date)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
