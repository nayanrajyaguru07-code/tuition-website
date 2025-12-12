"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Loader2, Search } from "lucide-react"; // --- 1. Import Loader2 and Search

// --- Data Types ---

interface AttendanceRecord {
  student_name: string;
  gr_no: string;
  standard: string;
  division: string;
  attendance_date: string;
  status: "Present" | "Absent" | "Late" | string;
  remarks: string | null;
}

interface Class {
  id: number;
  standard: string;
  division: string;
}

export function ViewAttendanceReport() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // State for filters
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>(""); // --- 2. Add search term state

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch classes for the filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`,
          { withCredentials: true }
        );
        setClasses(response.data.classes || []);
      } catch (error) {
        console.log(error);
        toast.error("Could not fetch class list for filters.");
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch attendance data when class AND date are selected
  useEffect(() => {
    if (!selectedClassId || !selectedDate) {
      setAttendanceData([]);
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      setSearchTerm(""); // Reset search term on new data fetch
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/attendance`,
          {
            params: {
              class_id: selectedClassId,
              date: selectedDate,
            },
            withCredentials: true,
          }
        );
        setAttendanceData(res.data || []);
        if (res.data.length === 0) {
          toast.success("No attendance records found for this date.");
        }
      } catch (err: any) {
        console.error("Error fetching attendance:", err);
        setError("Failed to load attendance data.");
        toast.error("Failed to load attendance data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedClassId, selectedDate]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Present":
        return "default";
      case "Absent":
        return "destructive";
      case "Late":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });
    } catch (e) {
      console.log(e);

      return dateString;
    }
  };

  // --- 3. Apply client-side search filter ---
  const filteredData = attendanceData.filter(
    (record) =>
      record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.gr_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Report</CardTitle>
        <CardDescription>Filter and view attendance records.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* --- 4. Updated Filter Section (added search) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-md">
          {/* Class Filter */}
          <div>
            <Label htmlFor="class-filter">Filter by Class</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId}>
              <SelectTrigger id="class-filter">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.standard} - {c.division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div>
            <Label htmlFor="date-filter">Select Date</Label>
            <Input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Search Filter (NEW) */}
          <div>
            <Label htmlFor="search-filter">Search Name or Gr No.</Label>
            <div className="relative">
              <Input
                id="search-filter"
                type="text"
                placeholder="Search students..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!selectedClassId || !selectedDate} // Disable if no data
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* --- 5. Report Table (Updated with filteredData) --- */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading attendance...
          </div>
        )}
        {error && <p className="text-center text-red-500 py-4">{error}</p>}

        {!loading && !error && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Gr No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* --- 6. Use filteredData for map --- */}
                {filteredData.length > 0 ? (
                  filteredData.map((record, i) => (
                    <TableRow key={`${record.gr_no}-${record.attendance_date}`}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell className="font-medium">
                        {record.student_name}
                      </TableCell>
                      <TableCell>{record.gr_no}</TableCell>
                      <TableCell>
                        {record.standard} - {record.division}
                      </TableCell>
                      <TableCell>
                        {formatDate(record.attendance_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(record.status) as any}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.remarks || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  // --- 7. Updated "No Data" message ---
                  <TableRow>
                    <TableCell
                      colSpan={7} // Updated colSpan
                      className="text-center h-24 text-muted-foreground"
                    >
                      {!selectedClassId || !selectedDate
                        ? "Please select a class and a date to view the report."
                        : attendanceData.length > 0 && filteredData.length === 0
                        ? "No students found matching your search."
                        : "No attendance records found for the selected criteria."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
