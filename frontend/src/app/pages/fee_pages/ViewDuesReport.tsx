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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Data Types ---
interface DuesRecord {
  student_id: number;
  student_name: string;
  class: string;
  total_dues: string;
  paid: string;
  balance: string;
  status: "Unpaid" | "Partial" | "Paid";
}

interface Class {
  id: number;
  standard: string;
  division: string;
}

export function ViewDuesReport() {
  const [allDues, setAllDues] = useState<DuesRecord[]>([]);
  const [filteredDues, setFilteredDues] = useState<DuesRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        const [duesRes, classesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/fee_payment/report`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`, {
            withCredentials: true,
          }),
        ]);
        setAllDues(duesRes.data || []);
        setClasses(classesRes.data.classes || []);
      } catch (error) {
        console.log(error);

        toast.error("Failed to fetch fee report data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportData();
  }, []);

  // --- Filtering Logic ---
  useEffect(() => {
    let results = allDues;

    if (searchTerm) {
      results = results.filter((due) =>
        due.student_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass) {
      results = results.filter((due) => due.class === selectedClass);
    }

    setFilteredDues(results);
  }, [searchTerm, selectedClass, allDues]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Partial":
        return "secondary";
      case "Unpaid":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dues Report</CardTitle>
        <CardDescription>
          View a summary of fee dues across all classes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <Input
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select
            onValueChange={(value) =>
              setSelectedClass(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by class..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.standard}>
                  {c.standard}-{c.division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Total Dues (₹)</TableHead>
                <TableHead>Paid (₹)</TableHead>
                <TableHead>Balance (₹)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading report...
                  </TableCell>
                </TableRow>
              ) : filteredDues.length > 0 ? (
                filteredDues.map((due) => (
                  <TableRow key={due.student_id}>
                    <TableCell>{due.student_name}</TableCell>
                    <TableCell>{due.class}</TableCell>
                    <TableCell>
                      {parseFloat(due.total_dues).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      {parseFloat(due.paid).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(due.balance).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusVariant(due.status) as any}>
                        {due.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
