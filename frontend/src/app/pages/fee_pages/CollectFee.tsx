"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PrintableFeeReceipt } from "./FeeReceipt";
import { Loader2 } from "lucide-react";

interface Student {
  id: number;
  display_name: string;
}

interface FeeBreakdown {
  fee_name: string;
  amount: string;
}

interface Dues {
  total_dues: string;
  total_paid: string;
  balance_due: string;
  fee_breakdown: FeeBreakdown[];
}

// --- MODIFIED ---
// Add the new props to the PaymentData type
type PaymentData = {
  studentName: string;
  className: string;
  receiptNo: string;
  paymentDate: string;
  paymentMode: string;
  feeDetails: { description: string; amount: number }[];
  totalFeesPaid: number; // <-- NEW
  totalDues: number; // <-- NEW
};

export function CollectFee() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [dues, setDues] = useState<Dues | null>(null);
  const [isLoadingDues, setIsLoadingDues] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);

  const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/fee_payment`;
  useEffect(() => {
    setFilteredStudents(students);
  }, [students]);

  // --------- Fetch Students ----------
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/students`, {
        withCredentials: true,
      });
      setStudents(res.data || []);
    } catch (err) {
      console.error("Fetch Students Error:", err);
      toast.error("Failed to fetch students.");
    }
  };

  // --------- Fetch Dues ----------
  const fetchDues = async (studentId: string) => {
    setIsLoadingDues(true);
    try {
      const res = await axios.get(`${API_BASE}/dues/${studentId}`, {
        withCredentials: true,
      });
      console.log("dues", res);

      const safeData: Dues = {
        total_dues: res.data.total_dues || "0",
        total_paid: res.data.total_paid || "0",
        balance_due: res.data.balance_due || "0",
        fee_breakdown: res.data.fee_breakdown || [],
      };
      setDues(safeData);
      setAmountPaid(safeData.balance_due);
    } catch (err) {
      console.error("Fetch Dues Error:", err);
      toast.error("Failed to fetch dues.");
      setDues(null);
    } finally {
      setIsLoadingDues(false);
    }
  };

  // --------- Record Payment ----------
  // --- MODIFIED ---
  // This function is updated to pass the new totals
  const recordPayment = async () => {
    // Client-side validation
    if (!selectedStudentId) {
      toast.error("Please select a student.");
      return;
    }

    const amtNum = parseFloat(amountPaid as unknown as string);
    if (isNaN(amtNum) || amtNum <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }

    if (!dues) {
      toast.error("Dues not loaded. Please reload student dues.");
      return;
    }

    const balanceNum = parseFloat(dues.balance_due || "0");
    if (amtNum > balanceNum) {
      // Optional: allow overpayment if your backend supports it; otherwise block
      toast.error(`Amount exceeds balance due (₹${balanceNum}).`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Build JSON payload — use the exact keys your backend expects.
      // If backend expects different names (studentId vs student_id), change them here.
      const payload = {
        student_id: selectedStudentId, // or studentId
        amount_paid: amtNum, // numeric
        payment_mode: paymentMode,
        // add any other fields required by your API, e.g. receipt_no, collected_by, class_id...
      };

      const res = await axios.post(API_BASE, payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("payment record", res?.data);
      toast.success("Payment recorded successfully!");

      // Compute updated totals for receipt
      const oldTotalPaidNum = parseFloat(dues.total_paid || "0");
      const oldBalanceDueNum = parseFloat(dues.balance_due || "0");

      const newTotalFeesPaid = oldTotalPaidNum + amtNum;
      const newTotalDues = Math.max(0, oldBalanceDueNum - amtNum);

      // Build receipt using server response where possible
      const student = students.find((s) => String(s.id) === selectedStudentId);
      const receipt: PaymentData = {
        studentName: (student?.display_name || "").split(" - ")[0] || "",
        className: (student?.display_name || "").split(" - ")[1] || "",
        receiptNo: res?.data?.payment?.id
          ? `INV-${res.data.payment.id}-${new Date().getFullYear()}`
          : `INV-${Math.floor(
              Math.random() * 100000
            )}-${new Date().getFullYear()}`,
        paymentDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        paymentMode,
        feeDetails: [{ description: "Fee Payment", amount: amtNum }],
        totalFeesPaid: newTotalFeesPaid,
        totalDues: newTotalDues,
      };

      setPaymentData(receipt);
      setShowReceipt(true);

      // Refresh dues from server
      await fetchDues(selectedStudentId);
    } catch (err: any) {
      console.error("Record Payment Error:", err);

      // Give the user the server's validation message if available
      if (axios.isAxiosError(err) && err.response) {
        const serverMsg =
          err.response.data?.error ||
          err.response.data?.message ||
          JSON.stringify(err.response.data);
        toast.error(`Failed to record payment: ${serverMsg}`);
        console.warn("Server response:", err.response.data);
      } else {
        toast.error("Failed to record payment. Check your network/backend.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------- Effects ----------
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!selectedStudentId) {
      setDues(null);
      return;
    }
    fetchDues(selectedStudentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  const selectedStudentName = students
    .find((s) => String(s.id) === selectedStudentId)
    ?.display_name.split(" - ")[0];

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Collect Student Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <Label>Select Student</Label>

            <Select
              onValueChange={setSelectedStudentId}
              value={selectedStudentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search by student name or GR No..." />
              </SelectTrigger>

              <SelectContent>
                {/* 🔍 Search Bar */}
                <div className="px-2 py-1">
                  <Input
                    placeholder="Search..."
                    className="h-8"
                    onChange={(e) => {
                      const keyword = e.target.value.toLowerCase();
                      const filtered = students.filter((s) =>
                        s.display_name.toLowerCase().includes(keyword)
                      );
                      setFilteredStudents(filtered);
                    }}
                  />
                </div>

                {/* Student List */}
                {(filteredStudents.length > 0
                  ? filteredStudents
                  : students
                ).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.display_name}
                  </SelectItem>
                ))}

                {/* No results */}
                {filteredStudents.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    No students found.
                  </p>
                )}
              </SelectContent>
            </Select>
          </div>

          {isLoadingDues && (
            <p className="text-center text-muted-foreground py-4">
              Loading fee details...
            </p>
          )}

          {dues && !isLoadingDues && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                Pending Dues for {selectedStudentName}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead className="text-right">Amount Due (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dues.fee_breakdown.map((fee, i) => (
                    <TableRow key={i}>
                      <TableCell>{fee.fee_name}</TableCell>
                      <TableCell className="text-right">
                        ₹ {parseFloat(fee.amount).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total Due</TableCell>
                    <TableCell className="text-right font-bold">
                      ₹ {parseFloat(dues.total_dues).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                  {/* --- MODIFIED --- Added Total Paid Row for clarity */}
                  <TableRow>
                    <TableCell className="font-bold text-green-600">
                      Total Paid (So Far)
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ₹ {parseFloat(dues.total_paid).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted">
                    <TableCell className="font-bold text-red-600">
                      Balance Due
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      ₹ {parseFloat(dues.balance_due).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <Label>Amount Paid (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount..."
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select onValueChange={setPaymentMode} value={paymentMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={recordPayment} disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting
                    ? "Recording..."
                    : "Record Payment & Generate Receipt"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Successful</DialogTitle>
            <DialogDescription>
              The fee receipt has been generated successfully. You can now print
              it.
            </DialogDescription>
          </DialogHeader>
          {/* This component now receives all the props it needs */}
          {paymentData && <PrintableFeeReceipt {...paymentData} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
