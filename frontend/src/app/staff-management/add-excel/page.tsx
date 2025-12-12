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
import { CheckCircle, Terminal, Upload } from "lucide-react";

// Define the Staff type
type Staff = {
  id?: string;
  f_name: string;
  l_name: string;
  email: string;
  phone_number: string;
  address: string;
};

// URL of your Express backend API for staff
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/add/staff`;

export default function StaffUploadPage() {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [parsedStaff, setParsedStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- GET Request ---
  const fetchStaff = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch staff.");
      const data = await response.json();
      setAllStaff(data);
      console.log(data);
    } catch (error) {
      setMessage({ type: "error", text: (error as Error).message });
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // --- Excel File Parsing using exceljs ---
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
        const json: Staff[] = [];
        const header: (keyof Staff)[] = [];

        if (!worksheet) {
          setMessage({
            type: "error",
            text: "The Excel file does not contain a worksheet at index 1.",
          });
          setParsedStaff([]);
          return;
        }

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell) => header.push(cell.value as keyof Staff));
            return;
          }
          const rowData: any = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowData[header[colNumber - 1]] = cell.value;
          });
          json.push(rowData);
        });

        setParsedStaff(json);
      } catch (error) {
        console.log(error);

        setMessage({
          type: "error",
          text: "Failed to parse the Excel file. Ensure headers are 'name' and 'subject'.",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // --- POST Request ---
  const handleUpload = async () => {
    if (parsedStaff.length === 0) {
      setMessage({ type: "error", text: "No staff members to upload." });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ faculty: parsedStaff }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");

      setMessage({ type: "success", text: data.message });
      setParsedStaff([]);
      await fetchStaff();
    } catch (error) {
      setMessage({ type: "error", text: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Staff Upload</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-6 border rounded-lg">
        <div className="flex-1 space-y-2">
          <label className="font-medium">1. Select Staff Excel File</label>
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="max-w-xs"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="font-medium">2. Save to Database</label>
          <Button
            onClick={handleUpload}
            disabled={isLoading || parsedStaff.length === 0}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : `Save ${parsedStaff.length} Staff`}
          </Button>
        </div>
      </div>

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

      {parsedStaff.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Preview</h2>
          <div className="border rounded-lg">
            <Table>
              <TableCaption>
                These {parsedStaff.length} staff members will be added.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile No </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedStaff.map((staff, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {staff.f_name} {staff.l_name}
                    </TableCell>
                    <TableCell>{staff.phone_number}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{staff.address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">All Staff in Database</h2>
        <div className="border rounded-lg">
          <Table>
            <TableCaption>
              A list of all staff currently in the database.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile No </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStaff.length > 0 ? (
                allStaff.map((staff, index) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {staff.f_name} {staff.l_name}
                    </TableCell>
                    <TableCell>{staff.phone_number}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{staff.address}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No staff found in database.
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
