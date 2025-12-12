"use client";

import { useState, useEffect } from "react";
import * as ExcelJS from "exceljs";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Upload, CheckCircle } from "lucide-react";

// --- MODIFIED Student type ---
// This type now matches all 22 fields expected by your backend POST route.
// Only the fields your backend validation requires are non-optional.
type Student = {
  // Required fields
  admission_number: string;
  student_name: string;
  class_id: string | number; // Excel might parse as number, backend handles it

  // Optional fields
  date_of_birth?: string; // Expected as DD-MM-YYYY from Excel
  place_of_birth?: string;
  gender?: string;
  blood_group?: string;
  nationality?: string;
  religion?: string;
  admission_date?: string; // Expected as DD-MM-YYYY from Excel
  father_name?: string;
  mother_name?: string;
  parent_primary_phone?: string;
  parent_secondary_phone?: string;
  parent_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string | number;
  community?: string;
  caste_category?: string;
};

// --- UNCHANGED DbStudent type ---
// This type correctly matches the data from your GET route
type DbStudent = {
  id: number;
  admission_number: string;
  student_name: string;
  standard: string | number;
  division: string;
  status: string;
  caste_category: string;
  community: string;
};

// Define the API URL for both GET and POST requests
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function UploadPage() {
  // State for students fetched from the database
  const [dbStudents, setDbStudents] = useState<DbStudent[]>([]);
  // State for students parsed from the uploaded Excel file
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  // State for loading and success/error messages
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- GET Request: Fetch all students (Unchanged) ---
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/add`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch student data from the server.");
      }
      const data: DbStudent[] = await response.json();
      setDbStudents(data);
      console.log(data);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // --- MODIFIED File Parsing with exceljs ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ type: "", text: "" });
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          throw new Error("Could not find worksheet in Excel file");
        }

        const json: Student[] = [];
        // Changed header type to string[] for flexibility
        const header: string[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell) => {
              // Store header names as strings
              header.push(cell.value as string);
            });
            return;
          }

          const rowData: any = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const headerName = header[colNumber - 1];
            // Handle dates: ExcelJS can parse dates, but if they come as
            // objects, convert them. We also handle DD-MM-YYYY strings
            // which the backend expects.
            let cellValue = cell.value;
            if (cell.value instanceof Date) {
              // If ExcelJS parsed a date, format it back to DD-MM-YYYY
              const d = cell.value;
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
              const year = d.getFullYear();
              cellValue = `${day}-${month}-${year}`;
            }

            if (headerName) {
              rowData[headerName] = cellValue;
            }
          });
          // Cast the 'any' object to the 'Student' type
          json.push(rowData as Student);
        });

        setParsedStudents(json);
      } catch (error) {
        console.log(error);
        setMessage({ type: "error", text: "Failed to parse the Excel file." });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // --- POST Request: Upload parsed students (Unchanged) ---
  const handleUpload = async () => {
    if (parsedStudents.length === 0) {
      setMessage({
        type: "error",
        text: "No data to upload. Please select a file first.",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ students: parsedStudents }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the error message from the backend
        throw new Error(data.error || "Something went wrong during upload");
      }

      setMessage({ type: "success", text: data.message });
      setParsedStudents([]);
      await fetchStudents(); // Refresh the student list
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Upload Student Data</h1>

      {/* --- Upload Controls (Unchanged) --- */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-6 border rounded-lg bg-slate-50 dark:bg-gray-900">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">1. Select Excel File</h3>
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="max-w-xs"
          />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">2. Save to Database</h3>
          <Button
            onClick={handleUpload}
            disabled={isLoading || parsedStudents.length === 0}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isLoading
              ? "Saving..."
              : `Upload ${parsedStudents.length} Students`}
          </Button>
        </div>
      </div>

      {/* --- Message Display (Unchanged) --- */}
      {message.text && (
        <Alert
          className="mb-6"
          variant={message.type === "error" ? "destructive" : "default"}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Terminal className="h-4 w-4" />
          )}
          <AlertTitle>
            {message.type === "error" ? "Error" : "Success"}
          </AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* --- MODIFIED PREVIEW Table (for POST data) --- */}
      {/* This table now shows the critical required fields */}
      {parsedStudents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Preview</h2>
          <div className="border rounded-lg">
            <Table>
              <TableCaption>
                Preview of {parsedStudents.length} students to be uploaded.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Gr No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class ID</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Father&apos;s Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedStudents.map((student, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {student.admission_number}
                    </TableCell>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell>{student.class_id}</TableCell>
                    <TableCell>{student.date_of_birth}</TableCell>
                    <TableCell>{student.father_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* --- ALL STUDENTS Table (for GET data) (Unchanged) --- */}
      {/* This table correctly displays data from the GET route */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">
          All Students in Database
        </h2>
        <div className="border rounded-lg">
          <Table>
            <TableCaption>
              A list of all students currently in the database.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Gr No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Community</TableHead>
                <TableHead>Caste Category</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbStudents.length > 0 ? (
                dbStudents.map((student, i) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{student.admission_number}</TableCell>
                    <TableCell className="font-medium">
                      {student.student_name}
                    </TableCell>
                    <TableCell>{student.standard}</TableCell>
                    <TableCell>{student.community}</TableCell>
                    <TableCell>{student.caste_category}</TableCell>
                    <TableCell>{student.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
