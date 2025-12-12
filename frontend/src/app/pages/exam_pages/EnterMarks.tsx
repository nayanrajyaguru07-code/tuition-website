"use client";

// Import useMemo for search filtering
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react"; // Loader icon

// --- Data Types ---
interface Class {
  id: number;
  standard: string;
  division?: string;
}
interface Subject {
  id: number;
  subject_name: string;
}
interface ExamSchedule {
  id: number; // This is the exam_schedule_id
  exam_name: string;
  total_marks: number;
}
interface Student {
  id: number; // The student's primary key ID
  student_name: string;
  gr_no: string; // Needed to map fetched marks
}
interface FetchedMark {
  student_name: string;
  gr_no: string;
  total_marks: number;
  result: string | null; // Mark or "Absent" or null
}
// Type for the raw student response (grouped)
interface GroupedStudentData {
  [key: string]: Student[];
}

export function EnterMarks() {
  // State for dropdown data
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]); // This will hold the FLATTENED list

  // State for user selections
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>(""); // This is now exam_schedule_id

  // State for marks (keyed by student's database ID) and loading
  const [marks, setMarks] = useState<Record<number, string>>({}); // Key is student.id
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Loading for dropdowns
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false); // Loading schedules/students
  const [isLoadingMarks, setIsLoadingMarks] = useState(false); // Loading existing marks
  const [isSaving, setIsSaving] = useState(false);

  // State for search query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Fetch initial data for class and subject dropdowns
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingInitialData(true); // Start loading
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`,
          { withCredentials: true }
        );
        setClasses(response.data.classes || []);
        setSubjects(response.data.subjects || []);
      } catch (error) {
        console.error("Fetch initial error:", error);
        toast.error("Failed to fetch initial data.");
      } finally {
        setIsLoadingInitialData(false); // Stop loading
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch exam schedules and students when class and subject are selected
  useEffect(() => {
    // Reset subsequent selections and data if class/subject changes
    setExamSchedules([]);
    setStudents([]);
    setSelectedExamId("");
    setMarks({});
    setSearchQuery(""); // Reset search query

    if (selectedClassId && selectedSubjectId) {
      const fetchDataForEntry = async () => {
        setIsLoadingSchedules(true);
        try {
          const [scheduleRes, studentRes] = await Promise.all([
            // Fetch Exam Schedules
            axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/mark_get/class/${selectedClassId}/subject/${selectedSubjectId}`,
              { withCredentials: true }
            ),
            // Fetch Students (returns grouped data)
            axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/attendance/class/${selectedClassId}/students`,
              { withCredentials: true }
            ),
          ]);

          console.log("Raw Fetched Students (Grouped):", studentRes.data);

          // <<< --- MODIFICATION TO FLATTEN STUDENT DATA --- >>>
          const groupedData: GroupedStudentData = studentRes.data || {};
          // Get all arrays of students -> [ [...], [...], [...] ]
          const studentArrays = Object.values(groupedData);
          // Flatten into a single list -> [ {...}, {...}, {...} ]
          const flatStudentList = studentArrays.flat();
          console.log("Flattened Student List:", flatStudentList);
          // <<< --- END MODIFICATION --- >>>

          setExamSchedules(scheduleRes.data || []);
          setStudents(flatStudentList); // Use the flattened list
        } catch (error: any) {
          // Handle 404 for schedules gracefully
          if (
            error?.response?.status === 404 &&
            error.config.url.includes("/mark_entry/")
          ) {
            setExamSchedules([]);
            // Still try to fetch students even if schedules 404
            try {
              const studentRes = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/attendance/class/${selectedClassId}/students`,
                { withCredentials: true }
              );
              console.log(
                "Raw Fetched Students (Grouped - after 404):",
                studentRes.data
              );
              const groupedData: GroupedStudentData = studentRes.data || {};
              const studentArrays = Object.values(groupedData);
              const flatStudentList = studentArrays.flat();
              console.log(
                "Flattened Student List (after 404):",
                flatStudentList
              );
              setStudents(flatStudentList); // Use flattened list
            } catch (studentError) {
              console.error(
                "Fetch student error after schedule 404:",
                studentError
              );
              toast.error("Failed to fetch student data.");
              setStudents([]);
            }
          } else {
            console.error("Fetch schedule/student error:", error);
            toast.error("Failed to fetch exam schedules or student data.");
            setExamSchedules([]);
            setStudents([]);
          }
        } finally {
          setIsLoadingSchedules(false);
        }
      };
      fetchDataForEntry();
    }
  }, [selectedClassId, selectedSubjectId]);

  // 3. Fetch previously saved marks when an exam schedule is selected
  useEffect(() => {
    setMarks({});
    if (selectedExamId && students.length > 0) {
      fetchExistingMarks(selectedExamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId, students]);

  // --- Helper function to fetch marks ---
  const fetchExistingMarks = async (examId: string) => {
    setIsLoadingMarks(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/mark_entry/exam/${examId}`,
        { withCredentials: true }
      );
      const fetchedMarks: FetchedMark[] = response.data || [];
      const marksMap = new Map<string, string>();

      // This logic correctly reads "Absent" or "95" from the 'result' field
      fetchedMarks.forEach((mark) => {
        marksMap.set(mark.gr_no, mark.result === null ? "" : mark.result);
      });

      const initialMarks: Record<number, string> = {};
      students.forEach((student) => {
        const savedMark = marksMap.get(student.gr_no);
        initialMarks[student.id] = savedMark !== undefined ? savedMark : "";
      });
      setMarks(initialMarks);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Fetch marks error:", error);
        toast.error("Failed to fetch existing marks.");
      }
      // If 404 (no marks found), just leave marks as {}
      // which will present empty inputs.
      // But we should reset it in case we are switching exams.
      const resetMarks: Record<number, string> = {};
      students.forEach((student) => {
        resetMarks[student.id] = "";
      });
      setMarks(resetMarks);
    } finally {
      setIsLoadingMarks(false);
    }
  };
  // --- End Helper ---

  // Handle changes in the mark input fields
  const handleMarkChange = (studentId: number, value: string) => {
    const selectedExamSchedule = examSchedules.find(
      (e) => String(e.id) === selectedExamId
    );
    const maxMarks = selectedExamSchedule?.total_marks;
    const lowerCaseValue = value.toLowerCase();
    let processedValue = value;

    // Auto-capitalize "Absent"
    if (lowerCaseValue === "absent") {
      processedValue = "Absent";
    }

    // Allow empty string or "Absent"
    if (processedValue === "" || processedValue === "Absent") {
      setMarks((prev) => ({ ...prev, [studentId]: processedValue }));
    }
    // Check for numbers
    else if (/^\d*$/.test(processedValue)) {
      const numericValue = parseInt(processedValue, 10);
      if (
        !isNaN(numericValue) &&
        (maxMarks === undefined ||
          maxMarks === null ||
          numericValue <= maxMarks)
      ) {
        setMarks((prev) => ({ ...prev, [studentId]: processedValue }));
      } else if (
        maxMarks !== undefined &&
        maxMarks !== null &&
        numericValue > maxMarks
      ) {
        toast.error(`Marks cannot exceed ${maxMarks}.`);
        setMarks((prev) => ({ ...prev, [studentId]: String(maxMarks) }));
      } else {
        // This case handles partially typed numbers that might be NaN
        setMarks((prev) => ({ ...prev, [studentId]: processedValue }));
      }
    }
    // Allow typing "Absent"
    else if (
      lowerCaseValue.startsWith("a") &&
      "absent".startsWith(lowerCaseValue)
    ) {
      setMarks((prev) => ({ ...prev, [studentId]: value }));
    }
    // Otherwise, do not update state (prevents other invalid characters)
  };

  // 4. Save Marks to the Backend
  const handleSaveMarks = async () => {
    if (!selectedExamId) {
      toast.error("Please select an exam before saving.");
      return;
    }
    setIsSaving(true);

    // --- *** 1. VALIDATION CHECK (Your Request) *** ---
    // Check if any student has an empty ("" or undefined) mark.
    // We check against the full 'students' list, not just the filtered one.
    const hasEmptyMark = students.some((student) => {
      const markValue = marks[student.id];
      return markValue === undefined || markValue === "";
    });

    if (hasEmptyMark) {
      toast.error(
        "All student fields are required. Please enter a score or 'Absent' for everyone."
      );
      setIsSaving(false); // Stop the saving process
      return; // Exit the function
    }
    // --- *** END VALIDATION CHECK *** ---

    // --- *** 2. DATA PREPARATION (The "Absent" string fix) *** ---
    // If validation passes, we now know every student has a value.
    // We must convert "Absent" to null so the backend can handle it.
    const marks_data = students.map((student) => {
      const markValue = marks[student.id]; // This is "95", "Absent", etc.

      let finalValue: string | null;

      // This is the critical fix:
      if (markValue.toLowerCase() === "absent") {
        finalValue = null; // Convert "Absent" string to null
      } else {
        finalValue = markValue; // Send the number string (e.g., "95")
      }

      return { student_id: student.id, marks: finalValue };
    });
    // --- *** END OF DATA PREPARATION *** ---

    const payload = {
      exam_schedule_id: parseInt(selectedExamId),
      marks_data,
    };

    // For debugging: see what you are sending
    // "Absent" will now appear as 'null' in this log.
    console.log("Saving payload:", JSON.stringify(payload, null, 2));

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/mark_entry`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success("Marks have been successfully saved!");
      fetchExistingMarks(selectedExamId); // Re-fetch marks to confirm
    } catch (error: any) {
      console.error("Error saving marks:", error);

      if (error.response?.data?.error) {
        toast.error(`Save failed: ${error.response.data.error}`);
      } else {
        toast.error(
          "Failed to save marks. Please check the data and try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Memoized list of filtered students for search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) {
      return students; // No query? Return all students.
    }
    return students.filter(
      (student) =>
        student.student_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        student.gr_no.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const selectedExamSchedule = examSchedules.find(
    (e) => String(e.id) === selectedExamId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Student Marks</CardTitle>
        <CardDescription>
          Select the class, subject, and exam to begin entering marks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-md">
          {/* Class Select */}
          <div>
            <Label>Select Class</Label>
            <Select
              onValueChange={setSelectedClassId}
              value={selectedClassId}
              disabled={isLoadingInitialData} // Disable while loading
            >
              <SelectTrigger>
                {isLoadingInitialData ? (
                  <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <SelectValue placeholder="Select Class" />
                )}
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.standard} {c.division || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Subject Select */}
          <div>
            <Label>Select Subject</Label>
            <Select
              onValueChange={setSelectedSubjectId}
              value={selectedSubjectId}
              disabled={isLoadingInitialData || !selectedClassId} // Disable while loading or no class
            >
              <SelectTrigger>
                {isLoadingInitialData ? (
                  <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <SelectValue placeholder="Select Subject" />
                )}
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Exam Select */}
          <div>
            <Label>Select Exam</Label>
            <Select
              onValueChange={setSelectedExamId}
              value={selectedExamId}
              disabled={
                !selectedClassId ||
                !selectedSubjectId ||
                isLoadingSchedules ||
                examSchedules.length === 0
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingSchedules
                      ? "Loading..."
                      : examSchedules.length === 0
                      ? "No Exams Found"
                      : "Select Exam"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {examSchedules.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.exam_name} (Max: {e.total_marks})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading Indicator for Schedules/Students */}
        {isLoadingSchedules && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading students and exams...</span>
          </div>
        )}

        {/* Marks Table - Shows when students are loaded */}
        {!isLoadingSchedules && students.length > 0 && (
          <>
            {/* Loading Indicator for Marks */}
            {isLoadingMarks && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Loading existing marks...</span>
              </div>
            )}

            {/* Search Bar and Title */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Enter Marks</h3>
              <Input
                placeholder="Search by name or gr no..."
                className="w-full md:w-1/3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!students.length || isLoadingMarks}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gr No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Marks Obtained</TableHead>
                  <TableHead>Total Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Map over filteredStudents */}
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.gr_no}</TableCell>
                      <TableCell className="font-medium">
                        {student.student_name}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text" // Allows "Absent"
                          placeholder={
                            isLoadingMarks
                              ? "Loading..."
                              : "Enter marks or Absent"
                          }
                          className="w-36"
                          value={marks[student.id] ?? ""} // Shows current mark state
                          onChange={
                            (e) => handleMarkChange(student.id, e.target.value) // Updates mark state
                          }
                          disabled={
                            !selectedExamId || isLoadingMarks || isSaving
                          }
                          maxLength={10}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        {selectedExamSchedule
                          ? selectedExamSchedule.total_marks
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Show message if search yields no results
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No students found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveMarks}
                disabled={
                  !selectedExamId ||
                  isSaving ||
                  isLoadingMarks ||
                  isLoadingSchedules
                }
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Marks"}
              </Button>
            </div>
          </>
        )}

        {/* Message when no students/schedules found */}
        {!isLoadingSchedules &&
          selectedClassId &&
          selectedSubjectId &&
          students.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No students found for this class, or no exams scheduled for this
              subject.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
