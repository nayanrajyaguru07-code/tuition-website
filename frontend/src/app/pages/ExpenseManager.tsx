"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";

type Expense = {
  id: number;
  title: string;
  amount: number;
  expenseDate: string;
  category: string;
  paymentMethod: string;
  description: string | null;
};

export default function ExpenseManager() {
  const [tab, setTab] = useState<"list" | "add" | "edit">("list");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [form, setForm] = useState<any>({
    title: "",
    amount: "",
    expenseDate: "",
    category: "General",
    paymentMethod: "Cash",
    description: "",
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-gray-700";

  const loadExpenses = async () => {
    try {
      const res = await API.get("/api/expense/all-expenses");
      setExpenses(res.data.expenses || []);
    } catch {
      toast.error("Failed to load expenses");
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const submitAdd = async () => {
    try {
      await API.post("/api/expense/add-expense", form);
      toast.success("Expense added");
      setTab("list");
      setForm({
        title: "",
        amount: "",
        expenseDate: "",
        category: "General",
        paymentMethod: "Cash",
        description: "",
      });
      loadExpenses();
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const loadExpenseDetails = (exp: Expense) => {
    setForm({
      title: exp.title,
      amount: String(exp.amount),
      expenseDate: exp.expenseDate.split("T")[0],
      category: exp.category,
      paymentMethod: exp.paymentMethod,
      description: exp.description || "",
    });
    setSelectedId(exp.id);
    setTab("edit");
  };

  const submitUpdate = async () => {
    if (!selectedId) return;

    try {
      await API.put(`/api/expense/update-expense/${selectedId}`, form);
      toast.success("Expense updated");
      setTab("list");
      loadExpenses();
    } catch {
      toast.error("Failed to update expense");
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm("Delete this expense?")) return;

    try {
      await API.delete(`/api/expense/delete-expense/${id}`);
      toast.success("Expense deleted");
      loadExpenses();
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Expense Management</h2>

        {/* TABS */}
        <div className="flex gap-3 mb-6">
          {["list", "add", "edit"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {t === "list" && "All Expenses"}
              {t === "add" && "Add Expense"}
              {t === "edit" && "Edit Expense"}
            </button>
          ))}
        </div>

        {/* LIST */}
        {tab === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3">{e.title}</td>
                    <td className="p-3">₹{e.amount}</td>
                    <td className="p-3">{e.category}</td>
                    <td className="p-3">{e.paymentMethod}</td>
                    <td className="p-3">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => loadExpenseDetails(e)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteExpense(e.id)}
                        className="border border-red-400 text-red-600 px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ADD */}
        {tab === "add" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              ["title", "Title"],
              ["amount", "Amount"],
              ["expenseDate", "Expense Date"],
              ["category", "Category"],
              ["paymentMethod", "Payment Method"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  name={key}
                  type={key === "expenseDate" ? "date" : "text"}
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <button
              onClick={submitAdd}
              className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl"
            >
              Add Expense
            </button>
          </div>
        )}

        {/* EDIT */}
        {tab === "edit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(form).map(([key, val]) => (
              <div key={key}>
                <label className={labelClass}>{key}</label>
                <input
                  name={key}
                  value={val as any}
                  type={key === "expenseDate" ? "date" : "text"}
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>
            ))}

            <button
              onClick={submitUpdate}
              className="md:col-span-2 bg-green-600 text-white py-3 rounded-xl"
            >
              Update Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
