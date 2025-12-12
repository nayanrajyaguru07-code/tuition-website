"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { MoreVertical, Edit, Trash2, Loader2 } from "lucide-react"; // Import Loader2
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Data Types ---
interface Class {
  id: number;
  standard: string;
  division: string;
}
interface FeeType {
  id: number;
  fee_name: string;
  amount: string;
  standard: string;
  division: string;
}

// --- Edit Dialog Component ---
const EditFeeDialog = ({
  fee,
  onUpdate,
}: {
  fee: FeeType;
  classes?: Class[];
  onUpdate: () => void | Promise<void>;
}) => {
  const [feeName, setFeeName] = useState(fee.fee_name);
  const [amount, setAmount] = useState(fee.amount);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // State for save button

  const handleUpdate = async () => {
    setIsSaving(true);
    const params = new URLSearchParams();
    params.append("fee_name", feeName);
    params.append("amount", amount);

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/add_fee/${fee.id}`,
        params,
        {
          withCredentials: true,
        }
      );
      toast.success("Fee structure updated successfully!");
      await onUpdate();
      setOpen(false);
    } catch (error) {
      console.log(error);

      toast.error("Failed to update fee structure.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Fee: {fee.fee_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Fee Name</Label>
            <Input
              value={feeName}
              onChange={(e) => setFeeName(e.target.value)}
            />
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpdate} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function CreateFeeStructure() {
  // State for form and data
  const [feeName, setFeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [classId, setClassId] = useState("");
  const [viewClassId, setViewClassId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for add button
  const [isDeleting, setIsDeleting] = useState(false); // State for delete action

  // Fetch classes for dropdowns
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

  // Fetch fee structures when a class is selected to be viewed
  const fetchFeeStructures = async (selectedClass: string) => {
    if (!selectedClass) {
      setFeeStructures([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/add_fee?class_id=${selectedClass}`,
        { withCredentials: true }
      );
      setFeeStructures(response.data || []);
    } catch (error) {
      console.log(error);

      toast.error("Failed to fetch fee structures for this class.");
      setFeeStructures([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures(viewClassId);
  }, [viewClassId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!feeName || !classId || !amount) {
      toast.error("Please fill out all fields.");
      return;
    }
    setIsSubmitting(true);
    const params = new URLSearchParams();
    params.append("fee_name", feeName);
    params.append("class_id", classId);
    params.append("amount", amount);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/add_fee`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true,
      });
      toast.success("Fee structure added successfully!");
      setFeeName("");
      setAmount("");
      setClassId("");
      if (viewClassId === classId) {
        fetchFeeStructures(viewClassId);
      }
    } catch (error) {
      console.log(error);

      toast.error("Failed to add fee structure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (feeId: number) => {
    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/add_fee/${feeId}`,
        {
          withCredentials: true,
        }
      );
      toast.success("Fee structure deleted successfully.");
      fetchFeeStructures(viewClassId); // Refresh the table
    } catch (error) {
      console.log(error);

      toast.error("Failed to delete fee structure.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Fee Type</CardTitle>
          <CardDescription>
            Define a new fee component and assign it to a class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="space-y-2">
              <Label>Fee Name</Label>
              <Input
                placeholder="e.g., Tuition Fee"
                value={feeName}
                onChange={(e) => setFeeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Applicable For</Label>
              <Select onValueChange={setClassId} value={classId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
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
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Adding..." : "Add Fee Type"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Existing Fee Structures</CardTitle>
          <CardDescription>
            View and manage the fee structures for a selected class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>View Structures for Class</Label>
            <Select onValueChange={setViewClassId} value={viewClassId}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Select a class to view..." />
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
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : feeStructures.length > 0 ? (
                  feeStructures.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.fee_name}</TableCell>
                      <TableCell>{`${fee.standard} - ${fee.division}`}</TableCell>
                      <TableCell>
                        {parseFloat(fee.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <EditFeeDialog
                                fee={fee}
                                classes={classes}
                                onUpdate={() => fetchFeeStructures(viewClassId)}
                              />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the &quot;
                                {fee.fee_name}
                                &quot; for this class.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(fee.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isDeleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {viewClassId
                        ? "No fee structures found for this class."
                        : "Select a class to view its fee structure."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
