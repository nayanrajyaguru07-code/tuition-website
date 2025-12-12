"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Loader2 } from "lucide-react"; // Import the loader icon

// Define the structure of the props the component will receive
interface FeeReceiptProps {
  studentName: string;
  className: string;
  receiptNo: string;
  paymentDate: string;
  paymentMode: string;
  feeDetails: { description: string; amount: number }[];
  totalFeesPaid: number; // --- NEW --- (Cumulative total paid by student)
  totalDues: number; // --- NEW --- (Remaining balance)
}

// Helper function to convert number to words (basic implementation)
const numberToWords = (num: number): string => {
  const amountInWords = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  })
    .formatToParts(num)
    .map((part) => part.value)
    .join("");
  return `Rupees ${amountInWords.replace("₹", "")} Only`;
};

// Main receipt component with print functionality
export function PrintableFeeReceipt(props: FeeReceiptProps) {
  const {
    studentName,
    className,
    receiptNo,
    paymentDate,
    paymentMode,
    feeDetails,
    totalFeesPaid, // --- NEW ---
    totalDues, // --- NEW ---
  } = props;
  const totalAmount = feeDetails.reduce((sum, item) => sum + item.amount, 0);
  const [isPrinting, setIsPrinting] = useState(false); // State for the print button

  // Function to trigger the browser's print dialog
  const handlePrint = () => {
    setIsPrinting(true);
    // The print dialog is blocking, so the UI will update before it opens.
    // We'll reset the state after a short delay to ensure the button returns to normal
    // if the user cancels the print.
    window.print();
    setTimeout(() => setIsPrinting(false), 500);
  };

  return (
    <div>
      {/* This style block ensures only the receipt is printed, always in a light theme */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt,
          .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            color: black !important;
            background-color: white !important;
          }
          .printable-receipt .print-bg-muted {
            background-color: #f1f5f9 !important; /* gray-100 */
          }
          .printable-receipt .print-text-muted {
            color: #4b5563 !important; /* gray-600 */
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* The actual receipt content with theme-aware styles for on-screen display */}
      <div className="printable-receipt p-8 bg-card text-card-foreground font-sans max-w-2xl mx-auto border shadow-md">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Image
              src="/school-logo.jpg" // Using .png for better transparency support
              alt="School Logo"
              width={60}
              height={60}
            />
            <div>
              <h1 className="text-2xl font-bold">S.M.V School</h1>
              <p className="text-sm text-muted-foreground print-text-muted">
                Birls Plot Dwarka-361335
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">FEE RECEIPT</h2>
          </div>
        </header>
        <Separator className="my-4" />
        <div className="flex justify-between text-sm mb-6">
          <div>
            <p>
              <span className="font-semibold">Receipt No:</span> {receiptNo}
            </p>
            <p>
              <span className="font-semibold">Student Name:</span> {studentName}
            </p>
          </div>
          <div className="text-right">
            <p>
              <span className="font-semibold">Date:</span> {paymentDate}
            </p>
            <p>
              <span className="font-semibold">Class:</span> {className}
            </p>
          </div>
        </div>
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr className="bg-muted print-bg-muted">
              <th className="p-2 border border-border text-left font-semibold">
                Particulars
              </th>
              <th className="p-2 border border-border text-right font-semibold">
                Amount (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {feeDetails.map((item, index) => (
              <tr key={index}>
                <td className="p-2 border border-border">{item.description}</td>
                <td className="p-2 border border-border text-right">
                  {item.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted print-bg-muted font-bold">
              <td className="p-2 border border-border text-right">
                Total Paid (This Receipt) {/* --- MODIFIED --- */}
              </td>
              <td className="p-2 border border-border text-right">
                ₹ {totalAmount.toLocaleString("en-IN")}
              </td>
            </tr>
          </tfoot>
        </table>
        <div className="mt-4 text-sm space-y-1">
          <p>
            <span className="font-semibold">Amount in Words:</span>{" "}
            {numberToWords(totalAmount)}
          </p>
          <p>
            <span className="font-semibold">Payment Mode:</span> {paymentMode}
          </p>

          {/* --- NEW SECTION --- */}
          <Separator className="my-2" />
          <p className="font-semibold">
            <span className="font-semibold">Total Fees Paid (Cumulative):</span>{" "}
            ₹ {totalFeesPaid.toLocaleString("en-IN")}
          </p>
          <p className="font-semibold text-red-600">
            <span className="font-semibold">Remaining Dues:</span> ₹{" "}
            {totalDues.toLocaleString("en-IN")}
          </p>
          {/* --- END NEW SECTION --- */}
        </div>
        <footer className="mt-16 flex justify-end">
          <div className="text-center">
            <div className="w-40 border-t border-foreground"></div>
            <p className="text-xs text-muted-foreground print-text-muted mt-1">
              Authorized Signatory
            </p>
          </div>
        </footer>
      </div>

      {/* The print button */}
      <div className="flex justify-end mt-6 no-print">
        <Button onClick={handlePrint} disabled={isPrinting}>
          {isPrinting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          {isPrinting ? "Preparing..." : "Print Receipt"}
        </Button>
      </div>
    </div>
  );
}
