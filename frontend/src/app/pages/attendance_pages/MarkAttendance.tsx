"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- Data Types ---
interface Class {
  id: number;
  standard: string;
  division: string;
}
interface Student {
  id: number;
  student_name: string;
  gr_no?: string; // optional, API may provide it
}
type AttendanceStatus = "Present" | "Absent" | "Late";
interface AttendanceRecord {
  status: AttendanceStatus;
  remarks: string;
}

export function MarkAttendance() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submit button
  const [attendanceStatus, setAttendanceStatus] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Fetch the list of classes for the dropdown
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
        toast.error("Could not fetch class list.");
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch students when a class is selected
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setAttendanceStatus({});
      return;
    }

    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/attendance/class/${selectedClassId}/students`,
          { withCredentials: true }
        );

        const responseData = response.data;
        // Flatten grouped result into a single array
        const allStudentsArrays = Object.values(responseData) as Student[][];
        const studentData: Student[] = allStudentsArrays.flat();

        setStudents(studentData);

        // Initialize attendance status for the fetched students (keys as strings)
        const initialStatus: Record<string, AttendanceRecord> = {};
        studentData.forEach((student) => {
          initialStatus[String(student.id)] = {
            status: "Present",
            remarks: "",
          };
        });
        setAttendanceStatus(initialStatus);
      } catch (error) {
        console.log(error);
        toast.error("Failed to fetch students for this class.");
        setStudents([]);
        setAttendanceStatus({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  // 3. Handlers for updating attendance
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const handleSelectAll = (status: AttendanceStatus) => {
    const newStatus: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      newStatus[String(student.id)] = {
        status,
        remarks: attendanceStatus[String(student.id)]?.remarks || "",
      };
    });
    setAttendanceStatus(newStatus);
  };

  // 4. Handler for submitting the attendance data
  const handleSubmit = async () => {
    if (!selectedClassId || !date) {
      toast.error("Please select a class and a date.");
      return;
    }
    setIsSubmitting(true);
    const attendance_data = Object.entries(attendanceStatus).map(
      ([student_id, record]) => {
        const entry: { student_id: number; status: string; remarks?: string } =
          {
            student_id: parseInt(student_id),
            status: record.status,
          };
        if (record.status === "Absent" && record.remarks) {
          entry.remarks = record.remarks;
        }
        return entry;
      }
    );

    const payload = {
      class_id: parseInt(selectedClassId),
      attendance_date: format(date, "yyyy-MM-dd"),
      attendance_data,
    };

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/attendance`,
        payload,
        {
          withCredentials: true,
        }
      );
      toast.success("Attendance recorded successfully!");
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to submit attendance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Filtered students based on searchQuery
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = s.student_name?.toLowerCase() ?? "";
      const gr = s.gr_no?.toLowerCase() ?? "";
      return name.includes(q) || gr.includes(q);
    });
  }, [students, searchQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Student Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label>Select Class</Label>
            <Select onValueChange={setSelectedClassId} value={selectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class..." />
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
          <div className="flex-1">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
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
          </div>
        </div>

        {selectedClassId && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium">Mark All As:</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll("Present")}
                >
                  Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll("Absent")}
                >
                  Absent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll("Late")}
                >
                  Late
                </Button>
              </div>

              {/* Search bar */}
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search student by name or GR no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center w-[250px]">
                      Status
                    </TableHead>
                    <TableHead className="text-center w-[200px]">
                      Remarks
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading students...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student, i) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{student.student_name}</span>
                            {student.gr_no && (
                              <small className="text-muted-foreground text-xs">
                                GR: {student.gr_no}
                              </small>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <RadioGroup
                            value={attendanceStatus[String(student.id)]?.status}
                            onValueChange={(value) =>
                              handleStatusChange(
                                String(student.id),
                                value as AttendanceStatus
                              )
                            }
                            className="flex justify-center space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="Present"
                                id={`p-${student.id}`}
                              />
                              <Label
                                htmlFor={`p-${student.id}`}
                                className="text-green-600 cursor-pointer"
                              >
                                Present
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="Absent"
                                id={`a-${student.id}`}
                              />
                              <Label
                                htmlFor={`a-${student.id}`}
                                className="text-red-600 cursor-pointer"
                              >
                                Absent
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="Late"
                                id={`l-${student.id}`}
                              />
                              <Label
                                htmlFor={`l-${student.id}`}
                                className="text-yellow-600 cursor-pointer"
                              >
                                Late
                              </Label>
                            </div>
                          </RadioGroup>
                        </TableCell>

                        <TableCell className="text-center">
                          {attendanceStatus[String(student.id)]?.status ===
                          "Absent" ? (
                            <Input
                              type="text"
                              placeholder="Add remarks..."
                              className="h-8 w-full max-w-[200px] mx-auto"
                              value={
                                attendanceStatus[String(student.id)]?.remarks ||
                                ""
                              }
                              onChange={(e) =>
                                handleRemarkChange(
                                  String(student.id),
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              --
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No students found for this class.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSubmit}
                disabled={filteredStudents.length === 0 || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Attendance"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
