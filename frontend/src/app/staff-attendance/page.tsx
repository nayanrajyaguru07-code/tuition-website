"use client";

// --- React & Next.js Imports ---
import { useState, useEffect, FC } from "react";
import { format } from "date-fns";
import axios from "axios";

// --- MODIFIED: Imports for react-hot-toast ---
import { Toaster, toast } from "react-hot-toast";

// --- Lucide Icons ---
import { CalendarIcon, Check, Loader2, X } from "lucide-react";

// --- Shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
// --- MODIFIED: Removed useToast ---
// import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils"; // Assumes you have this from shadcn setup

// --- TypeScript Type Definitions ---

// From your: GET /api/attendance/faculty/all
interface FacultyMember {
  id: number;
  f_name: string;
  l_name: string;
  full_name: string;
  role: string;
}

// For our component's state
type AttendanceStatus = "Present" | "Absent" | "Leave" | "Half Day" | "On Duty";
const ATTENDANCE_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Leave",
  "Half Day",
  "On Duty",
];

// For our state: A mapping of faculty_id -> status
// e.g., { 1: "Present", 2: "Absent", 5: "Present" }
type AttendanceData = Record<number, AttendanceStatus>;

// --- Main Component ---

const FacultyAttendancePage: FC = () => {
  // --- MODIFIED: Removed useToast() ---
  // const { toast } = useToast();
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // 1. Fetch all faculty on component load
  useEffect(() => {
    const fetchFaculty = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use your API route to get all faculty
        const response = await axios.get<FacultyMember[]>(
          `${API_URL}/attendance/faculty/all`
        );
        setFacultyList(response.data);

        // Initialize attendance state: Default everyone to "Present"
        const initialAttendance: AttendanceData = {};
        for (const faculty of response.data) {
          initialAttendance[faculty.id] = "Present";
        }
        setAttendanceData(initialAttendance);
      } catch (err) {
        console.error("Failed to fetch faculty:", err);
        setError("Failed to load faculty list. Please try again.");
        // --- MODIFIED: react-hot-toast ---
        toast.error("Failed to load faculty list.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaculty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle individual radio button changes
  const handleStatusChange = (facultyId: number, status: AttendanceStatus) => {
    setAttendanceData((prevData) => ({
      ...prevData,
      [facultyId]: status,
    }));
  };

  // 3. Handle bulk actions ("Mark All Present", "Mark All Absent")
  const handleMarkAll = (status: AttendanceStatus) => {
    const newAttendanceData: AttendanceData = {};
    for (const faculty of facultyList) {
      newAttendanceData[faculty.id] = status;
    }
    setAttendanceData(newAttendanceData);
    // --- MODIFIED: react-hot-toast ---
    toast(`All ${facultyList.length} members marked as ${status}.`);
  };

  // 4. Handle form submission
  const handleSubmit = async () => {
    if (!date) {
      // --- MODIFIED: react-hot-toast ---
      toast.error("Please select a date.");
      return;
    }

    setIsSubmitting(true);

    // Convert state object { 1: "Present" } to API array [{ faculty_id: 1, status: "Present" }]
    const formattedAttendanceData = Object.entries(attendanceData).map(
      ([facultyId, status]) => ({
        faculty_id: parseInt(facultyId, 10),
        status: status,
        // Add nulls for clock_in/out and remarks as your API expects them
        // Your API 'UPSERT' query will handle these nulls correctly
        clock_in: null,
        clock_out: null,
        remarks: null, // Or you can add a remarks input field for each
      })
    );

    const payload = {
      attendance_date: format(date, "yyyy-MM-dd"),
      attendance_data: formattedAttendanceData,
    };

    try {
      // Send data to your POST route
      await axios.post(`${API_URL}/attendance/faculty`, payload);
      // --- MODIFIED: react-hot-toast ---
      toast.success(
        `Attendance for ${format(date, "PPP")} submitted successfully.`
      );
    } catch (err) {
      console.error("Failed to submit attendance:", err);
      // --- MODIFIED: react-hot-toast ---
      toast.error("Failed to submit attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-red-600">
        <X className="h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* --- ADDED: Toaster component --- */}
      <Toaster position="top-right" reverseOrder={false} />

      <Card>
        <CardHeader>
          <CardTitle>Faculty Attendance</CardTitle>
          <CardDescription>
            Mark attendance for all faculty members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* --- Date Picker and Bulk Actions --- */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal sm:w-[280px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll("Present")}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark All Present
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleMarkAll("Absent")}
              >
                <X className="mr-2 h-4 w-4" />
                Mark All Absent
              </Button>
            </div>
          </div>

          {/* --- Attendance Table --- */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Faculty Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-full min-w-[400px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyList.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">
                      {faculty.full_name}
                    </TableCell>
                    <TableCell>{faculty.role}</TableCell>
                    <TableCell>
                      {/* This is the key part. The RadioGroup's value is bound
                        to the state object using the faculty's ID.
                        onValueChange updates that specific faculty's status.
                      */}
                      <RadioGroup
                        value={attendanceData[faculty.id]}
                        onValueChange={(value) =>
                          handleStatusChange(
                            faculty.id,
                            value as AttendanceStatus
                          )
                        }
                        className="flex flex-wrap gap-4"
                      >
                        {ATTENDANCE_OPTIONS.map((status) => (
                          <div
                            key={status}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={status}
                              id={`status-${faculty.id}-${status}`}
                            />
                            <Label htmlFor={`status-${faculty.id}-${status}`}>
                              {status}
                            </Label>
                            _
                          </div>
                        ))}
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Submit Attendance
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FacultyAttendancePage;
