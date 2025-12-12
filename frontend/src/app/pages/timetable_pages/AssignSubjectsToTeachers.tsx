"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Loader2 } from "lucide-react";

// --- Data Types from your API ---
interface Class {
  id: number;
  standard: string;
  division: string;
}
interface Subject {
  id: number;
  subject_name: string;
}
interface Period {
  id: number;
  day: string;
  period_number: number;
}
interface Faculty {
  id: number;
  f_name: string;
  l_name: string;
}

// --- Type for the temporary table on the frontend ---
interface Assignment {
  id: number; // Temporary unique ID for the table row
  faculty: Faculty;
  subject: Subject;
  class: Class;
  period: Period;
}

export function AssignSubjectsToTeachers() {
  // State for holding data fetched from API
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  // State for user's selections in the dropdowns
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  // State to hold the list of assignments created by the user
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data for all dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`,
          { withCredentials: true }
        );
        setClasses(response.data.classes || []);
        setSubjects(response.data.subjects || []);
        setPeriods(response.data.periods || []);
        setFaculty(response.data.faculty || []);
      } catch (error) {
        toast.error("Failed to fetch form data.");
        console.error("Error fetching form data:", error);
      }
    };
    fetchData();
  }, []);

  const handleAddAssignment = () => {
    if (
      !selectedClass ||
      !selectedFaculty ||
      !selectedSubject ||
      !selectedPeriod
    ) {
      toast.error("Please select a value for all fields.");
      return;
    }
    const newAssignment: Assignment = {
      id: Date.now(),
      faculty: selectedFaculty,
      subject: selectedSubject,
      class: selectedClass,
      period: selectedPeriod,
    };
    console.log("New Assignment Added (IDs):", {
      faculty_id: newAssignment.faculty.id,
      subject_id: newAssignment.subject.id,
      class_id: newAssignment.class.id,
      period_id: newAssignment.period.id,
    });
    setAssignments((prev) => [...prev, newAssignment]);
    toast.success("Assignment added to the table below.");
  };

  const handleRemoveAssignment = (idToRemove: number) => {
    setAssignments((prev) =>
      prev.filter((assignment) => assignment.id !== idToRemove)
    );
    toast.success("Assignment removed.");
  };

  // --- The function to save all assignments to the backend ---
  const handleSaveAll = async () => {
    if (assignments.length === 0) {
      toast.error("There are no assignments to save.");
      return;
    }
    setIsSaving(true);

    let allSucceeded = true;
    for (const assignment of assignments) {
      try {
        const params = new URLSearchParams();
        params.append("period_id", String(assignment.period.id));
        params.append("class_id", String(assignment.class.id));
        params.append("subject_id", String(assignment.subject.id));
        params.append("faculty_id", String(assignment.faculty.id));

        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/add_slot`,
          params,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            withCredentials: true,
          }
        );
      } catch (error: any) {
        allSucceeded = false;
        console.error("Error saving a specific assignment:", {
          failedAssignmentData: {
            period_id: assignment.period.id,
            class_id: assignment.class.id,
            subject_id: assignment.subject.id,
            faculty_id: assignment.faculty.id,
          },
          errorDetails: error.response?.data || error.message,
        });
        toast.error(
          `Failed to save assignment for ${assignment.faculty.f_name}. Check console.`
        );
        break;
      }
    }

    if (allSucceeded) {
      toast.success("All assignments saved successfully!");
      setAssignments([]); // Clear the table on success
    }

    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Subjects to Teachers</CardTitle>
        <CardDescription>
          Link teachers to subjects, classes, and periods.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Select Teacher</Label>
              <Select
                onValueChange={(value) =>
                  setSelectedFaculty(
                    faculty.find((f) => f.id === parseInt(value)) || null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {faculty.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={String(f.id)}
                    >{`${f.f_name} ${f.l_name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Subject</Label>
              <Select
                onValueChange={(value) =>
                  setSelectedSubject(
                    subjects.find((s) => s.id === parseInt(value)) || null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Class</Label>
              <Select
                onValueChange={(value) =>
                  setSelectedClass(
                    classes.find((c) => c.id === parseInt(value)) || null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={String(c.id)}
                    >{`${c.standard} - ${c.division}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Period</Label>
              <Select
                onValueChange={(value) =>
                  setSelectedPeriod(
                    periods.find((p) => p.id === parseInt(value)) || null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a period..." />
                </SelectTrigger>
                <SelectContent>
                  {periods.length > 0 ? (
                    periods.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={String(p.id)}
                      >{`${p.day} - Period ${p.period_number}`}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No periods defined.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleAddAssignment}>
              Add to Assignment Table
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Current Assignments</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length > 0 ? (
                  assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{`${a.faculty.f_name} ${a.faculty.l_name}`}</TableCell>
                      <TableCell>{a.subject.subject_name}</TableCell>
                      <TableCell>{`${a.class.standard} - ${a.class.division}`}</TableCell>
                      <TableCell>{`${a.period.day} - P${a.period.period_number}`}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAssignment(a.id)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No assignments added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {assignments.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveAll} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save All Assignments"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
