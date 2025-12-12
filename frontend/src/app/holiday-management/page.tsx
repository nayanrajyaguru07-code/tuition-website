// You can save this file as e.g., components/holiday/HolidayPage.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { Loader2, MoreHorizontal } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Data Type ---
interface Holiday {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

// --- Helper Functions for Date Formatting ---

/** Formats an ISO string (from API) to 'yyyy-MM-dd' for date input fields */
const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
};

/** Formats an ISO string (from API) to a user-friendly display format */
const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "do MMM, yyyy");
  } catch (error) {
    console.error("Error formatting date for display:", error);
    return "Invalid Date";
  }
};

export default function HolidayPage() {
  // State for data and loading
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // State for selected item
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<number | null>(null);

  // --- Data Fetching ---
  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/holiday`,
        {
          withCredentials: true,
        }
      );
      setHolidays(response.data || []);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
      toast.error("Could not load holiday list.");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Fetch holidays on component mount
  useEffect(() => {
    fetchHolidays();
  }, []);

  // --- Event Handlers ---

  // Opens dialog in "Add" mode
  const handleAddNew = () => {
    setSelectedHoliday(null);
    setIsDialogOpen(true);
  };

  // Opens dialog in "Edit" mode
  const handleEdit = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsDialogOpen(true);
  };

  // Sets up the holiday for deletion and opens confirmation
  const handleDeleteClick = (id: number) => {
    setHolidayToDelete(id);
    setIsAlertOpen(true);
  };

  // 2. Handle Form Submit (Create & Update)
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    // Create URLSearchParams to send as 'x-www-form-urlencoded'
    const params = new URLSearchParams();
    params.append("name", formData.get("name") as string);
    params.append("start_date", formData.get("start_date") as string);
    params.append("end_date", formData.get("end_date") as string);

    const config = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      withCredentials: true,
    };

    try {
      if (selectedHoliday) {
        // --- 3. Update (PATCH) ---
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/holiday/${selectedHoliday.id}`,
          params,
          config
        );
        toast.success("Holiday updated successfully");
      } else {
        // --- 4. Create (POST) ---
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/holiday`,
          params,
          config
        );
        toast.success("Holiday created successfully");
      }
      setIsDialogOpen(false);
      fetchHolidays(); // Refresh the list
    } catch (err) {
      console.error("Failed to save holiday:", err);
      toast.error("Failed to save holiday.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. Handle Delete Confirmation (DELETE) ---
  const handleDeleteConfirm = async () => {
    if (!holidayToDelete) return;

    setIsSubmitting(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/holiday/${holidayToDelete}`,
        {
          withCredentials: true,
        }
      );
      toast.success("Holiday deleted successfully");
      setIsAlertOpen(false);
      setHolidayToDelete(null);
      fetchHolidays(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete holiday:", err);
      toast.error("Failed to delete holiday.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Manage Holidays</CardTitle>
              <CardDescription>
                Add, edit, or delete school holidays.
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>Add New Holiday</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No holidays found.
                  </TableCell>
                </TableRow>
              ) : (
                holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">
                      {holiday.name}
                    </TableCell>
                    <TableCell>
                      {formatDateForDisplay(holiday.start_date)}
                    </TableCell>
                    <TableCell>
                      {formatDateForDisplay(holiday.end_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(holiday)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(holiday.id)}
                            className="text-red-500"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- Dialog for Add/Edit Holiday --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedHoliday ? "Edit Holiday" : "Add New Holiday"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedHoliday?.name ?? ""}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={
                    selectedHoliday
                      ? formatDateForInput(selectedHoliday.start_date)
                      : ""
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={
                    selectedHoliday
                      ? formatDateForInput(selectedHoliday.end_date)
                      : ""
                  }
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Alert Dialog for Delete Confirmation --- */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              holiday.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
