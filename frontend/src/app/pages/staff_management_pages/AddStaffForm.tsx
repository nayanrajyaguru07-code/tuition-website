"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Calendar as CalendarIcon,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
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

export function AddStaffForm() {
  // --- Form State ---
  const [fName, setFName] = useState<string>("");
  const [lName, setLName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [aadharNumber, setAadharNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [joiningDate, setJoiningDate] = useState<Date | undefined>(undefined);

  // --- Component Logic State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);

  // --- API Calls ---
  const fetchFaculty = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/faculty_register`,
        { withCredentials: true }
      );
      setFacultyList(response.data);
    } catch (error) {
      console.error("Error fetching faculty list:", error);
      toast.error("Could not fetch faculty list.");
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // --- Input Handlers ---
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) setPhoneNumber(value);
  };

  const handleAadharNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 12) setAadharNumber(value);
  };

  const resetForm = () => {
    setFName("");
    setLName("");
    setEmail("");
    setPhoneNumber("");
    setAadharNumber("");
    setAddress("");
    setRole("");
    setJoiningDate(undefined);
    setIsEditMode(false);
    setSelectedFacultyId(null);
  };

  // --- Form Submission ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !fName ||
      !lName ||
      !email ||
      !role ||
      phoneNumber.length !== 10 ||
      aadharNumber.length !== 12
    ) {
      toast.error(
        "Please fill all required fields. Phone must be 10 digits and Aadhar must be 12 digits."
      );
      return;
    }

    setIsSubmitting(true);

    const facultyData = {
      F_name: fName,
      L_name: lName,
      email,
      phone_number: phoneNumber,
      aadhar_number: aadharNumber,
      address,
      role,
      joining_date: joiningDate ? format(joiningDate, "yyyy-MM-dd") : null,
    };

    try {
      if (isEditMode && selectedFacultyId) {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/faculty_register/${selectedFacultyId}`,
          facultyData,
          { withCredentials: true }
        );
        toast.success("Faculty member updated successfully!");
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/faculty_register`,
          facultyData,
          { withCredentials: true }
        );
        toast.success("Faculty member added successfully!");
      }
      resetForm();
      fetchFaculty();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "add"} faculty member.`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Staff Information" : "New Staff Information"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details of the staff member below."
              : "Fill in the details of the new staff member below."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="John"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="Doe"
                  value={lName}
                  onChange={(e) => setLName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (10 digits)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhar">Aadhar Number (12 digits)</Label>
                <Input
                  id="aadhar"
                  placeholder="xxxx xxxx xxxx"
                  value={aadharNumber}
                  onChange={handleAadharNumberChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Joining</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !joiningDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {joiningDate ? (
                        format(joiningDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={joiningDate}
                      onSelect={setJoiningDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role / Position</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-4 gap-2">
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                  ? "Update Staff Member"
                  : "Add Staff Member"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Faculty List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Staff</CardTitle>
          <CardDescription>
            A list of all staff members currently in the system.
          </CardDescription>
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
              {facultyList.length > 0 ? (
                facultyList.map((faculty) => (
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
