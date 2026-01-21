"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";

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

export default function FeeForm() {
  const [tab, setTab] = useState<
    "collect" | "history" | "status" | "edit" | "studentHistory"
  >("collect");

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
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-gray-700";

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
        transactionId,
        remarks,
      });
      toast.success("Fee collected successfully");
      setAmount("");
      setTransactionId("");
      setRemarks("");
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* STUDENT SELECTOR */}
        <div className="mb-6">
          <label className={labelClass}>Select Student</label>
          <select
            className={inputClass}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">-- Select Student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentMobileNo})
              </option>
            ))}
          </select>
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
              <select
                className={inputClass}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>UPI</option>
                <option>Cash</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
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
              className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
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
              className="bg-blue-600 text-white px-5 py-2 rounded-lg"
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
              className="bg-blue-600 text-white px-5 py-2 rounded-lg"
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
            <div>
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
              <select
                className={inputClass}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>UPI</option>
                <option>Cash</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
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
              className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Fee Record"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
