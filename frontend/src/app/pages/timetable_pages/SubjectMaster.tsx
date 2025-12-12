"use client"; // Required for state and event handlers

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react"; // Import the loader icon

// --- Data Types ---
interface Subject {
  id: number;
  subject_name: string;
}
interface Class {
  id: number;
  standard: string;
  division: string;
}

export function SubjectMaster() {
  const [subjectName, setSubjectName] = useState("");
  const [standard, setStandard] = useState("");
  const [division, setDivision] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`,
        { withCredentials: true }
      );
      setSubjects(response.data.subjects || []);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Could not fetch initial data list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, []);

  // --- Handlers ---
  const handleAddSubject = async () => {
    if (!subjectName.trim()) {
      toast.error("Subject name cannot be empty.");
      return;
    }
    setIsAddingSubject(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/add_subject`,
        { subject_name: subjectName },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success("Subject added successfully!");
      setSubjectName("");
      fetchData();
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error("Failed to add subject. Please try again.");
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleAddClass = async () => {
    if (!standard.trim() || !division.trim()) {
      toast.error("Standard and Division cannot be empty.");
      return;
    }
    setIsAddingClass(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/add_class`,
        { standard, division },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success("Class added successfully!");
      setStandard("");
      setDivision("");
      fetchData();
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error("Failed to add class. Please try again.");
    } finally {
      setIsAddingClass(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject & Class Master</CardTitle>
        <CardDescription>
          Manage all subjects and classes offered in the school.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section for Subjects */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Manage Subjects</h3>
          <div className="space-y-4 p-4 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject-name">Subject Name</Label>
                <Input
                  id="subject-name"
                  placeholder="e.g., Mathematics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddSubject} disabled={isAddingSubject}>
              {isAddingSubject && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isAddingSubject ? "Adding..." : "Add Subject"}
            </Button>
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">Existing Subjects</h4>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] bg-muted/50">ID</TableHead>
                    <TableHead className="bg-muted/50">Subject Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">
                          {subject.id}
                        </TableCell>
                        <TableCell>{subject.subject_name}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground"
                      >
                        No subjects found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section for Classes */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Manage Classes</h3>
          <div className="space-y-4 p-4 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standard">Standard</Label>
                <Input
                  id="standard"
                  placeholder="e.g., Class 10"
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="division">Division</Label>
                <Input
                  id="division"
                  placeholder="e.g., A"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddClass} disabled={isAddingClass}>
              {isAddingClass && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isAddingClass ? "Adding..." : "Add Class"}
            </Button>
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">Existing Classes</h4>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] bg-muted/50">ID</TableHead>
                    <TableHead className="bg-muted/50">Standard</TableHead>
                    <TableHead className="bg-muted/50">Division</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : classes.length > 0 ? (
                    classes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.id}</TableCell>
                        <TableCell>{c.standard}</TableCell>
                        <TableCell>{c.division}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No classes found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
