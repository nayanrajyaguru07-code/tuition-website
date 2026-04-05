"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import SearchableSelect from "@/components/SearchableSelect";
import { printReceipt } from "@/lib/receiptPrinter";

type Student = {
  id: number;
  fullName: string;
  studentMobileNo: string;
};

type FeeHistory = {
  id: number;
  studentName: string;
  mobileNo: string;
  amount: number;
  paymentMethod: string;
  feeAddDate: string;
  feeRemark: string | null;
};

type FeeFormProps = {
  initialTab?: "collect" | "history" | "status" | "edit" | "studentHistory";
};

export default function FeeForm({ initialTab = "collect" }: FeeFormProps) {
  const [tab, setTab] = useState<
    "collect" | "history" | "status" | "edit" | "studentHistory"
  >(initialTab);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [remarks, setRemarks] = useState("");

  const [editId, setEditId] = useState("");
  const [history, setHistory] = useState<FeeHistory[]>([]);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [baseFee, setBaseFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400";
  const labelClass = "text-sm font-medium text-gray-700";

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.fullName} (${s.studentMobileNo})`,
  }));

  const paymentMethodOptions = [
    { value: "UPI", label: "UPI" },
    { value: "Cash", label: "Cash" },
    { value: "Card", label: "Card" },
    { value: "Bank Transfer", label: "Bank Transfer" },
  ];

  // 🔹 Load students once
  useEffect(() => {
    API.get("/api/student/all-students")
      .then((res) => setStudents(res.data.students || []))
      .catch(() => toast.error("Failed to load students"));
  }, []);

  // 🔹 Load all fee history
  const loadHistory = async () => {
    try {
      const res = await API.get("/api/fee-collection/fee-history");
      setHistory(res.data.history || []);
    } catch {
      toast.error("Failed to load fee history");
    }
  };

  // 🔹 Load selected student fee status
  const loadStatus = async () => {
    if (!studentId) return toast.error("Select a student first");

    try {
      const res = await API.get(
        `/api/fee-collection/student-fee-status/${studentId}`,
      );
      setStatus(res.data);
    } catch {
      toast.error("Failed to load student fee status");
    }
  };

  // 🔹 Load selected student fee history
  const loadStudentHistory = async () => {
    if (!studentId) return toast.error("Select a student first");

    try {
      const res = await API.get(
        `/api/fee-collection/student-fee-history/${studentId}`,
      );
      setStudentHistory(res.data.history || []);
    } catch {
      toast.error("Failed to load student fee history");
    }
  };

  // 🔹 Collect Fee
  const collectFee = async () => {
    if (!studentId || !amount) {
      return toast.error("Student and amount are required");
    }

    try {
      setLoading(true);
      await API.post("/api/fee-collection/collect-fee", {
        studentId,
        amount,
        paymentDate,
        paymentMethod,
        paymentMethodId: null, // Depending on backend need, but sticking to existing logic
        transactionId,
        remarks,
      });
      toast.success("Fee collected successfully");

      // 🔹 Generate Receipt
      const hostelData = localStorage.getItem("hostel");
      const hostelName = hostelData
        ? JSON.parse(hostelData).hostelName
        : "Hostel";
      const student = students.find((s) => String(s.id) === studentId);

      printReceipt({
        type: "Fee",
        hostelName,
        name: student?.fullName || "Student",
        amount: Number(amount),
        date: paymentDate || new Date().toLocaleDateString(),
        dues: status ? status.feeStatus.dueFee - Number(amount) : undefined,
        paymentMethod: paymentMethod,
      });

      setAmount("");
      setTransactionId("");
      setRemarks("");
      // Refresh status/history if needed
      if (tab === "studentHistory") loadStudentHistory();
      if (tab === "status") loadStatus();
    } catch {
      toast.error("Failed to collect fee");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update Fee Record
  const updateFee = async () => {
    if (!editId || !studentId) {
      return toast.error("Record ID and Student are required");
    }

    try {
      setLoading(true);
      await API.put(`/api/fee-collection/update-fee-record/${editId}`, {
        studentId,
        amount,
        paymentDate,
        paymentMethod,
        transactionId,
        remarks,
      });
      toast.success("Fee record updated");
      if (tab === "studentHistory") loadStudentHistory();
    } catch {
      toast.error("Failed to update fee record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Fee Management
        </h2>

        {/* TABS */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            ["collect", "Collect Fee"],
            ["history", "All History"],
            ["studentHistory", "Student History"],
            ["status", "Student Status"],
            ["edit", "Edit Record"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === key
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* STUDENT SELECTOR */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <label className={labelClass}>Select Student</label>
            {baseFee !== null && (
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                Base Fee: ₹{baseFee}
              </span>
            )}
          </div>
          <SearchableSelect
            options={studentOptions}
            value={studentId ? Number(studentId) : ""}
            onChange={async (val) => {
              const newValue = String(val);
              setStudentId(newValue);
              if (newValue) {
                try {
                  const res = await API.get(
                    `/api/fee-collection/student-fee-status/${newValue}`,
                  );
                  setBaseFee(res.data.feeStatus.totalFee);
                  setStatus(res.data);
                } catch (err) {
                  console.error(err);
                }
              } else {
                setBaseFee(null);
              }
            }}
            placeholder="-- Select Student --"
          />
        </div>

        {/* COLLECT FEE */}
        {tab === "collect" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Amount</label>
              <input
                className={inputClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Date</label>
              <input
                type="date"
                className={inputClass}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <SearchableSelect
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(String(val))}
                placeholder="Select Method"
              />
            </div>

            <div>
              <label className={labelClass}>Transaction ID</label>
              <input
                className={inputClass}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Remarks</label>
              <input
                className={inputClass}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <button
              onClick={collectFee}
              disabled={loading}
              className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-md"
            >
              {loading ? "Processing..." : "Collect Fee"}
            </button>
          </div>
        )}

        {/* ALL FEE HISTORY */}
        {tab === "history" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Remark</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="p-3">{h.studentName}</td>
                    <td className="p-3">{h.mobileNo}</td>
                    <td className="p-3">₹{h.amount}</td>
                    <td className="p-3">{h.paymentMethod}</td>
                    <td className="p-3">
                      {new Date(h.feeAddDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">{h.feeRemark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* STUDENT FEE HISTORY */}
        {tab === "studentHistory" && (
          <div className="space-y-4">
            <button
              onClick={loadStudentHistory}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2 rounded-lg shadow-sm"
            >
              Load History
            </button>

            {studentHistory.map((h) => (
              <div
                key={h.id}
                className="border p-4 rounded-lg flex justify-between"
              >
                <div>
                  ₹{h.amount} — {h.paymentMethod}
                </div>
                <div>{new Date(h.paymentDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* STUDENT STATUS */}
        {tab === "status" && (
          <div className="space-y-4">
            <button
              onClick={loadStatus}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2 rounded-lg shadow-sm"
            >
              Check Status
            </button>

            {status && (
              <div className="bg-gray-50 p-5 rounded-xl border">
                <div className="font-semibold">{status.student.fullName}</div>
                <div>Total Fee: ₹{status.feeStatus.totalFee}</div>
                <div>Paid: ₹{status.feeStatus.totalPaid}</div>
                <div>Due: ₹{status.feeStatus.dueFee}</div>
              </div>
            )}
          </div>
        )}

        {/* EDIT FEE */}
        {tab === "edit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelClass}>Select Transaction to Edit</label>
              <SearchableSelect
                options={studentHistory.map((h) => ({
                  value: h.id,
                  label: `${new Date(h.paymentDate).toLocaleDateString()} — ₹${h.amount} ({h.paymentMethod})`,
                }))}
                value={editId ? Number(editId) : ""}
                onChange={(val) => {
                  const tx = studentHistory.find((h) => h.id === Number(val));
                  if (tx) {
                    setEditId(String(tx.id));
                    setAmount(String(tx.amount));
                    if (tx.paymentDate)
                      setPaymentDate(
                        new Date(tx.paymentDate).toISOString().split("T")[0],
                      );
                    setPaymentMethod(tx.paymentMethod);
                    setTransactionId(tx.transactionId || "");
                    setRemarks(tx.remarks || "");
                  }
                }}
                placeholder="-- Select a Transaction --"
              />
            </div>

            {/* Hidden or ReadOnly Edit ID for reference */}
            <div className="hidden">
              <label className={labelClass}>Record ID</label>
              <input
                className={inputClass}
                value={editId}
                onChange={(e) => setEditId(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Amount</label>
              <input
                className={inputClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Date</label>
              <input
                type="date"
                className={inputClass}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <SearchableSelect
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(String(val))}
                placeholder="Select Method"
              />
            </div>

            <div>
              <label className={labelClass}>Transaction ID</label>
              <input
                className={inputClass}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Remarks</label>
              <input
                className={inputClass}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <button
              onClick={updateFee}
              disabled={loading}
              className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-md"
            >
              {loading ? "Updating..." : "Update Fee Record"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
