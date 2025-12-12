// components/exam/ViewResults.tsx
"use client";

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
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// --- Data Types ---
interface Class {
  id: number;
  standard: string;
  division?: string;
}
interface Student {
  id: number;
  student_name: string;
  admission_number?: string; // if available from API
}
interface SubjectResponse {
  subject_name: string;
  obtained?: number | null;
  total?: number;
  percentage?: number;
}
interface StudentResult {
  subject_name: string;
  total_marks: number;
  marks_obtained: number | null;
  percentage: number;
}
interface GroupedStudentData {
  [key: string]: Student[];
}

export function ViewResults() {
  // State for dropdown data
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]); // Will hold the FLATTENED list

  // State for selections
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Search state for students
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");

  // State for results and loading/error
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [studentOverall, setStudentOverall] = useState<{
    total_obtained: number;
    total_possible: number;
    overall_percentage: number;
  } | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null); // NEW: name from API
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`,
          { withCredentials: true }
        );
        setClasses(response.data.classes || []);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        toast.error("Could not load class list.");
        setError("Failed to load classes.");
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch Students when a Class is selected
  useEffect(() => {
    setStudents([]);
    setSelectedStudentId("");
    setStudentResults([]);
    setStudentSearchTerm("");
    setError(null);
    setStudentName(null); // reset name when changing class

    if (selectedClassId) {
      const fetchStudents = async () => {
        setIsLoadingStudents(true);
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/attendance/class/${selectedClassId}/students`,
            { withCredentials: true }
          );

          // Flatten grouped student data if the API returns grouped structure
          const groupedData: GroupedStudentData = response.data || {};
          const studentArrays = Object.values(groupedData);
          const flatStudentList = studentArrays.flat();

          // If response is already a flat array, fallback to that
          const resultList =
            Array.isArray(response.data) && response.data.length > 0
              ? response.data
              : flatStudentList;

          setStudents(resultList || []);
        } catch (err) {
          console.error("Failed to fetch students:", err);
          toast.error("Could not load student list for this class.");
          setError("Failed to load students.");
        } finally {
          setIsLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [selectedClassId]);

  // 3. Fetch Results when a Student is selected (uses the new route)
  useEffect(() => {
    setStudentResults([]);
    setStudentOverall(null);
    setError(null);
    setStudentName(null); // clear previous name

    if (selectedStudentId) {
      const fetchResults = async () => {
        setIsLoadingResults(true);
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/student_dashboard/student-report/${selectedStudentId}`,
            { withCredentials: true }
          );

          const data = response.data || {};
          console.log(data);

          // Derive and set the student name from API (defensive)
          const apiName =
            (data.student_name as string) ||
            (data.student?.name as string) ||
            (data.student_name_full as string) ||
            null;
          // fallback to selected student's name if API doesn't provide one
          const fallbackName =
            students.find((s) => String(s.id) === selectedStudentId)
              ?.student_name ?? null;
          setStudentName(apiName ?? fallbackName);

          // Map subjects -> StudentResult[]
          const mappedResults: StudentResult[] =
            Array.isArray(data.subjects) && data.subjects.length > 0
              ? data.subjects.map((sub: SubjectResponse) => {
                  const obtained =
                    typeof sub.obtained === "number" ? sub.obtained : null;
                  const total = typeof sub.total === "number" ? sub.total : 0;
                  const perc =
                    typeof sub.percentage === "number"
                      ? sub.percentage
                      : total > 0 && obtained !== null
                      ? (obtained / total) * 100
                      : 0;
                  return {
                    subject_name: sub.subject_name || "Unknown",
                    total_marks: total,
                    marks_obtained: obtained,
                    percentage: Number(perc.toFixed(2)),
                  };
                })
              : [];

          setStudentResults(mappedResults);

          // Set overall if provided
          if (data.overall) {
            // The API in screenshot used keys like total_obtained / total_possible / overall_percentage
            setStudentOverall({
              total_obtained: Number(data.overall.total_obtained ?? 0),
              total_possible: Number(data.overall.total_possible ?? 0),
              overall_percentage: Number(data.overall.overall_percentage ?? 0),
            });
          }
        } catch (err: any) {
          if (err.response?.status === 404) {
            toast.error("No results found for this student.");
            setStudentResults([]);
            setStudentOverall(null);
            setStudentName(null);
          } else {
            console.error("Failed to fetch student results:", err);
            toast.error("Could not load results for this student.");
            setError("Failed to load results.");
          }
        } finally {
          setIsLoadingResults(false);
        }
      };
      fetchResults();
    }
  }, [selectedStudentId, students]);

  // --- Calculations based on fetched results ---
  const validResults = studentResults.filter((r) => r.marks_obtained !== null);
  const totalMarksObtainedComputed = validResults.reduce(
    (sum, item) => sum + (item.marks_obtained ?? 0),
    0
  );
  const totalPossibleMarksComputed = validResults.reduce(
    (sum, item) => sum + item.total_marks,
    0
  );

  const totalMarksObtained =
    studentOverall?.total_obtained ?? totalMarksObtainedComputed;
  const totalPossibleMarks =
    studentOverall?.total_possible ?? totalPossibleMarksComputed;
  const percentage =
    totalPossibleMarks > 0
      ? ((totalMarksObtained / totalPossibleMarks) * 100).toFixed(2)
      : "0.00";

  // This will now work because 'students' is an array
  const selectedStudent = students.find(
    (s) => String(s.id) === selectedStudentId
  );
  const selectedClass = classes.find((c) => String(c.id) === selectedClassId);

  // --- Search filtering for students (memoized)
  const filteredStudents = useMemo(() => {
    const q = studentSearchTerm.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = s.student_name?.toLowerCase() || "";
      const adm = (s as any).admission_number
        ? String((s as any).admission_number).toLowerCase()
        : "";
      return name.includes(q) || adm.includes(q) || String(s.id) === q;
    });
  }, [students, studentSearchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>View Student Report Card</CardTitle>
        <CardDescription>
          Select a class and student to view their results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Dropdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Select Class</Label>
            <Select
              onValueChange={(v) => {
                setSelectedClassId(v);
              }}
              value={selectedClassId}
              disabled={isLoadingClasses}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingClasses ? "Loading Classes..." : "Select Class"
                  }
                />
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

          {/* --- Student search + list --- */}
          <div>
            <Label>Select Student</Label>
            <Select
              onValueChange={setSelectedStudentId}
              value={selectedStudentId}
              disabled={
                !selectedClassId || isLoadingStudents || students.length === 0
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingStudents
                      ? "Loading Students..."
                      : !selectedClassId
                      ? "Select Class First"
                      : students.length === 0
                      ? "No Students Found"
                      : "Select Student"
                  }
                />
              </SelectTrigger>

              {/* ---------------------- SEARCHABLE DROPDOWN ---------------------- */}
              <SelectContent className="max-h-64">
                {/* Search bar inside dropdown */}
                <div className="p-2 sticky top-0 bg-background z-10 border-b">
                  <div className="relative">
                    <Input
                      placeholder="Search student..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="pr-8"
                    />
                    <Search className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* Filtered student list */}
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.student_name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No matching students
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading/Error/Results Section */}
        {isLoadingResults && (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading Results...</span>
          </div>
        )}

        {error && !isLoadingResults && (
          <p className="text-center text-red-500 py-6">{error}</p>
        )}

        {!isLoadingResults &&
          selectedStudentId &&
          studentResults.length === 0 &&
          !error && (
            <p className="text-center text-muted-foreground py-6">
              No results found for the selected student.
            </p>
          )}

        {/* ===== NEW: Overall + Subject-wise presentation ===== */}
        {!isLoadingResults && studentResults.length > 0 && selectedStudent && (
          <div className="space-y-6">
            {/* Overall summary card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2 border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {/* Prefer API-provided name, fallback to selectedStudent name */}
                      {studentName ?? selectedStudent.student_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Class {selectedClass?.standard}{" "}
                      {selectedClass?.division || ""}
                    </p>
                    <p className="text-sm text-muted-foreground">Exam Report</p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Total:{" "}
                      <span className="font-semibold">
                        {totalMarksObtained} / {totalPossibleMarks}
                      </span>
                    </div>
                    <div className="mt-1 text-2xl font-bold">{percentage}%</div>
                    <div className="mt-2">
                      <Badge
                        variant={
                          parseFloat(percentage) >= 40
                            ? "default"
                            : "destructive"
                        }
                        className="px-4 py-1 text-lg"
                      >
                        {parseFloat(percentage) >= 40 ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Optional: small overall progress bar */}
                <div className="mt-4">
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, Number(percentage))}%`,
                        background:
                          parseFloat(percentage) >= 40
                            ? "linear-gradient(90deg,#4ade80,#16a34a)"
                            : "linear-gradient(90deg,#fca5a5,#ef4444)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Small metadata card */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">
                  Student Name
                </div>
                <div className="font-semibold">
                  {/* show the student name (from API or fallback) */}
                  {studentName ?? selectedStudent.student_name}
                </div>

                <div className="mt-4 text-sm text-muted-foreground mb-1">
                  Status
                </div>
                <div>
                  <Badge
                    variant={
                      parseFloat(percentage) >= 40 ? "secondary" : "destructive"
                    }
                    className="px-3 py-1"
                  >
                    {parseFloat(percentage) >= 40 ? "Passed" : "Failed"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Subject wise cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentResults.map((s, i) => (
                <div
                  key={`${s.subject_name}-${i}`}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{s.subject_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Marks:{" "}
                        <span className="font-medium">
                          {s.marks_obtained ?? "Absent"} / {s.total_marks}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Percent
                      </div>
                      <div className="font-bold">{s.percentage}%</div>
                    </div>
                  </div>

                  {/* progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, s.percentage)}%`,
                          background:
                            s.percentage >= 40
                              ? "linear-gradient(90deg,#60a5fa,#3b82f6)"
                              : "linear-gradient(90deg,#fca5a5,#f87171)",
                        }}
                      />
                    </div>
                  </div>

                  {/* small footnote */}
                  <div className="mt-3 text-xs text-muted-foreground">
                    {s.marks_obtained === null
                      ? "Student marked absent for this subject."
                      : s.percentage >= 75
                      ? "Excellent performance"
                      : s.percentage >= 50
                      ? "Good"
                      : s.percentage >= 40
                      ? "Satisfactory"
                      : "Needs improvement"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
