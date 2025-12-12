"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Faculty {
  id: number;
  f_name: string;
  l_name: string;
  email: string;
  phone_number: string;
  aadhar_number: string;
  address: string;
  role: string;
  joining_date: string;
}

export function ViewStaffList() {
  // --- Form State (kept in local state for edit actions) ---
  const [, setFName] = useState<string>("");
  const [, setLName] = useState<string>("");
  const [, setEmail] = useState<string>("");
  const [, setPhoneNumber] = useState<string>("");
  const [, setAadharNumber] = useState<string>("");
  const [, setAddress] = useState<string>("");
  const [, setRole] = useState<string>("");
  const [, setJoiningDate] = useState<Date | undefined>(undefined);

  // --- Component Logic State ---
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [, setIsEditMode] = useState(false);
  const [, setSelectedFacultyId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- API Calls ---
  const fetchFaculty = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/faculty_register`,
        { withCredentials: true }
      );
      setFacultyList(response.data || []);
    } catch (error) {
      console.error("Error fetching faculty list:", error);
      toast.error("Could not fetch faculty list.");
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // --- Table Actions ---
  const handleEdit = (faculty: Faculty) => {
    setIsEditMode(true);
    setSelectedFacultyId(faculty.id);
    setFName(faculty.f_name || "");
    setLName(faculty.l_name || "");
    setEmail(faculty.email || "");
    setPhoneNumber(faculty.phone_number || "");
    setAadharNumber(faculty.aadhar_number || "");
    setAddress(faculty.address || "");
    setRole(faculty.role || "");
    setJoiningDate(
      faculty.joining_date ? new Date(faculty.joining_date) : undefined
    );
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (faculty: Faculty) => {
    setFacultyToDelete(faculty);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!facultyToDelete) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/faculty_register/${facultyToDelete.id}`,
        { withCredentials: true }
      );
      toast.success("Faculty member deleted successfully!");
      fetchFaculty();
    } catch (error) {
      console.error("Error deleting faculty:", error);
      toast.error("Failed to delete faculty member.");
    } finally {
      setIsDeleteDialogOpen(false);
      setFacultyToDelete(null);
    }
  };

  // --- Filtered list using searchQuery ---
  const filteredFaculty = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return facultyList;

    return facultyList.filter((f) => {
      const fullName = `${f.f_name} ${f.l_name}`.toLowerCase();
      const email = (f.email || "").toLowerCase();
      const role = (f.role || "").toLowerCase();
      return fullName.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [facultyList, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Faculty List Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Registered Staff</CardTitle>
            <CardDescription>
              A list of all staff members currently in the system.
            </CardDescription>
          </div>

          {/* Search input */}
          <div className="w-full sm:w-1/3">
            <Input
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculty.length > 0 ? (
                filteredFaculty.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">
                      {faculty.f_name} {faculty.l_name}
                    </TableCell>
                    <TableCell>{faculty.email}</TableCell>
                    <TableCell className="capitalize">{faculty.role}</TableCell>
                    <TableCell>{faculty.phone_number}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(faculty)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(faculty)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No staff members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              staff member{" "}
              <span className="font-semibold">
                {facultyToDelete?.f_name} {facultyToDelete?.l_name}
              </span>{" "}
              from the records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
