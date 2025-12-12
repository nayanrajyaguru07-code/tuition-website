"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CalendarX2 } from "lucide-react";

// --- Data Types ---
interface Class {
  id: number;
  standard: string;
  division: string;
}
interface ScheduleEntry {
  id: number;
  subject_name: string | null;
  exam_date: string | null;
  start_time: string | null;
  total_marks: number | null;
}
interface ScheduleData {
  [examName: string]: ScheduleEntry[];
}

export default function ViewExamSchedule() {
  // State for dropdowns and data
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | "">("");
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});

  // Loading state
  const [isFetchingClasses, setIsFetchingClasses] = useState(true);
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);

  // Fetch only the classes for the dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      setIsFetchingClasses(true);
      try {
        // We only need the 'classes' part of this endpoint
        const response = await axios.get(
          "http://localhost:4000/add_slot/form-data",
          { withCredentials: true }
        );
        setClasses(response.data.classes || []);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch classes.");
      } finally {
        setIsFetchingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch the schedule when a class is selected
  const fetchSchedule = async (classId: string) => {
    if (!classId) {
      setScheduleData({});
      return;
    }
    setIsFetchingSchedule(true);
    try {
      const response = await axios.get(
        `http://localhost:4000/exam/class/${classId}`,
        { withCredentials: true }
      );
      setScheduleData(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setScheduleData({}); // No schedule found is not an error
      } else {
        toast.error("Failed to fetch exam schedule.");
      }
    } finally {
      setIsFetchingSchedule(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedClassId);
  }, [selectedClassId]);

  // Helper to format date safely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "dd-MMM-yyyy");
    } catch (e) {
      return dateStr; // Fallback to raw string
    }
  };

  // Helper to format time safely
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "N/A";
    try {
      const paddedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      return format(parseISO(`1970-01-01T${paddedTime}`), "p"); // 'p' is for 12-hour time
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* --- 1. Select Class Card --- */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>View Exam Schedule</CardTitle>
          <CardDescription>
            Select a class to see its complete exam schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="class-select">Select Class</Label>
            <Select
              onValueChange={setSelectedClassId}
              value={selectedClassId}
              disabled={isFetchingClasses}
            >
              <SelectTrigger id="class-select">
                <SelectValue
                  placeholder={
                    isFetchingClasses
                      ? "Loading classes..."
                      : "Choose a class..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.standard}-{c.division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* --- 2. Schedule Display Card --- */}
      {selectedClassId && (
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle>
              Full Schedule for Class{" "}
              {classes.find((c) => String(c.id) === selectedClassId)?.standard}
            </CardTitle>
            <CardDescription>
              Showing all exams found for this class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingSchedule ? (
              // Loading State
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <p className="mt-2">Loading schedule...</p>
              </div>
            ) : Object.keys(scheduleData).length > 0 ? (
              // Data Found State
              <div className="space-y-6">
                {Object.keys(scheduleData).map((examKey) => (
                  <div key={examKey}>
                    <h3 className="text-xl font-semibold capitalize mb-3 border-b pb-2 text-blue-700">
                      {examKey}
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Marks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scheduleData[examKey].map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.subject_name || "N/A"}
                              </TableCell>
                              <TableCell>
                                {formatDate(item.exam_date)}
                              </TableCell>
                              <TableCell>
                                {formatTime(item.start_time)}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.total_marks ?? "N/A"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // No Data State
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <CalendarX2 className="h-10 w-10" />
                <p className="mt-2 text-lg font-medium">No Schedule Found</p>
                <p className="text-sm">
                  No exam schedule has been created for this class yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
