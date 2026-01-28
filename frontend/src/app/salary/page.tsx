"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  salary: number | null;
  photoUrl: string | null;
};

type Payment = {
  id: number;
  employeeName: string;
  employeeId: number;
  amount: number;
  salaryMonth: string;
  paymentDate: string;
  paymentMethod: string;
  remarks?: string;
};

import { useSearchParams } from "next/navigation";

export default function SalaryManager() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"pay" | "history">("pay");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "history") setActiveTab("history");
    else setActiveTab("pay");
  }, [searchParams]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);

  const [payForm, setPayForm] = useState({
    amount: "",
    salaryMonth: format(new Date(), "MMM yyyy"), // Default to current month
    paymentMethod: "Cash",
    remarks: "",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, payRes] = await Promise.all([
        API.get("/api/employee/all-staff"),
        API.get("/api/salary/all-salary-payments"),
      ]);
      setEmployees(empRes.data.staff || []);
      setPayments(payRes.data.payments || []);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setPayForm({
      amount: "",
      salaryMonth: format(new Date(), "MMM yyyy"),
      paymentMethod: "Cash",
      remarks: "",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
    });
    setSelectedEmployee(null);
    setEditingPaymentId(null);
  };

  const handlePayClick = (emp: Employee) => {
    resetForm();
    setSelectedEmployee(emp);
    setPayForm((prev) => ({
      ...prev,
      amount: emp.salary ? String(emp.salary) : "",
    }));
  };

  const handleEditClick = (payment: Payment) => {
    // Find employee details to show name in modal
    // Note: Payment object has employeeName but we might want the full employee object if needed,
    // but for the modal title we just need the name.
    // Creating a mock employee object or finding from list if available.
    const emp = employees.find((e) => e.name === payment.employeeName) || {
      id: payment.employeeId || 0, // Fallback
      name: payment.employeeName,
      email: "",
      role: "",
      salary: 0,
      photoUrl: null,
    };

    setSelectedEmployee(emp as Employee);
    setEditingPaymentId(payment.id);
    setPayForm({
      amount: String(payment.amount),
      salaryMonth: payment.salaryMonth,
      paymentMethod: payment.paymentMethod,
      remarks: payment.remarks || "",
      paymentDate: format(new Date(payment.paymentDate), "yyyy-MM-dd"),
    });
  };

  const handlePaymentSubmit = async () => {
    try {
      setLoading(true);

      if (editingPaymentId) {
        // UPDATE
        await API.put(`/api/salary/update-salary/${editingPaymentId}`, payForm);
        toast.success("Salary Updated Successfully!");
      } else {
        // CREATE
        if (!selectedEmployee) return;
        await API.post("/api/salary/pay-salary", {
          employeeId: selectedEmployee.id,
          ...payForm,
        });
        toast.success("Salary Paid Successfully!");
      }

      resetForm();
      loadData(); // Refresh history
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Staff Salary
            </h1>
            <p className="text-gray-500 mt-1">
              Manage employee payroll and view history.
            </p>
          </div>
          <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-100">
            <button
              onClick={() => setActiveTab("pay")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "pay"
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Pay Salary
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "history"
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Payment History
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "pay" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-orange-50 mb-4 flex items-center justify-center text-2xl font-bold text-orange-600 overflow-hidden border-2 border-white shadow-inner">
                  {emp.photoUrl ? (
                    <img
                      src={emp.photoUrl}
                      alt={emp.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    emp.name.charAt(0)
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                  {emp.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{emp.role}</p>

                <div className="w-full bg-orange-50/50 rounded-lg p-3 mb-4 border border-orange-100">
                  <p className="text-xs text-orange-400 uppercase tracking-wide font-semibold">
                    Base Salary
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    ₹{emp.salary ?? 0}
                  </p>
                </div>

                <button
                  onClick={() => handlePayClick(emp)}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-100 active:scale-95"
                >
                  Pay Now
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/50 border-b border-orange-100 text-xs uppercase text-gray-500 tracking-wider">
                    <th className="px-6 py-4 font-semibold">Employee</th>
                    <th className="px-6 py-4 font-semibold">Month</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Method</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Amount
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No payment history found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-orange-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {p.employeeName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                            {p.salaryMonth}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {format(new Date(p.paymentDate), "MMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {p.paymentMethod}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          ₹{p.amount}
                        </td>
                        <td className="px-6 py-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-2 text-orange-600 hover:bg-orange-100 rounded-full transition"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment/Edit Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">
                  {editingPaymentId ? "Edit Payment" : "Pay Salary"} -{" "}
                  <span className="text-orange-600">
                    {selectedEmployee.name}
                  </span>
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payForm.paymentDate}
                    onChange={(e) =>
                      setPayForm({ ...payForm, paymentDate: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Month
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2026"
                    value={payForm.salaryMonth}
                    onChange={(e) =>
                      setPayForm({ ...payForm, salaryMonth: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={payForm.amount}
                    onChange={(e) =>
                      setPayForm({ ...payForm, amount: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "Cash", label: "Cash" },
                      { value: "Bank Transfer", label: "Bank Transfer" },
                      { value: "UPI", label: "UPI" },
                      { value: "Cheque", label: "Cheque" },
                    ]}
                    value={payForm.paymentMethod}
                    onChange={(val) =>
                      setPayForm({ ...payForm, paymentMethod: String(val) })
                    }
                    placeholder="Select Method"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={payForm.remarks}
                    onChange={(e) =>
                      setPayForm({ ...payForm, remarks: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-red-700 active:scale-95 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
                >
                  {loading
                    ? "Processing..."
                    : editingPaymentId
                      ? "Update Payment"
                      : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
