"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchableSelect from "@/components/SearchableSelect";
import { Pencil, Trash2 } from "lucide-react";

type Expense = {
  id: number;
  title: string;
  amount: number;
  expenseDate: string;
  category: string;
  paymentMethod: string;
  description: string | null;
};

interface ExpenseManagerProps {
  initialTab?: "list" | "add";
}

export default function ExpenseManager({
  initialTab = "list",
}: ExpenseManagerProps) {
  const [tab, setTab] = useState<"list" | "add">(initialTab);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [form, setForm] = useState<any>({
    title: "",
    amount: "",
    expenseDate: "",
    category: "General",
    paymentMethod: "Cash",
    description: "",
  });

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400";
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
    setShowEditDialog(true);
  };

  const submitUpdate = async () => {
    if (!selectedId) return;

    try {
      await API.put(`/api/expense/update-expense/${selectedId}`, form);
      toast.success("Expense updated");
      setShowEditDialog(false);
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
          {["list", "add"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {t === "list" && "All Expenses"}
              {t === "add" && "Add Expense"}
            </button>
          ))}
        </div>

        {/* LIST */}
        {tab === "list" && (
          <div className="space-y-4">
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left">Title</th>
                    <th className="px-6 py-4 text-left">Amount</th>
                    <th className="px-6 py-4 text-left">Category</th>
                    <th className="px-6 py-4 text-left">Method</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {expenses.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {e.title}
                      </td>
                      <td className="px-6 py-4 font-bold text-orange-600">
                        ₹{e.amount}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold uppercase">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {e.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(e.expenseDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => loadExpenseDetails(e)}
                          className="bg-orange-50 text-orange-600 hover:bg-orange-100 p-2 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteExpense(e.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden space-y-4">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-lg leading-tight">
                        {e.title}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {new Date(e.expenseDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <p className="text-xl font-black text-orange-600">
                      ₹{e.amount}
                    </p>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {e.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                      {e.paymentMethod}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => loadExpenseDetails(e)}
                      className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {expenses.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium italic">
                  No expenses recorded yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ADD */}
        {tab === "add" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Title</label>
              <input
                name="title"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Amount</label>
              <input
                name="amount"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Expense Date</label>
              <input
                type="date"
                name="expenseDate"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <SearchableSelect
                options={[
                  { value: "General", label: "General" },
                  { value: "Maintenance", label: "Maintenance" },
                  { value: "Food", label: "Food" },
                  { value: "Utilities", label: "Utilities" },
                  { value: "Salary", label: "Salary" },
                  { value: "Other", label: "Other" },
                ]}
                value={form.category}
                onChange={(val) =>
                  handleChange({ target: { name: "category", value: val } })
                }
                placeholder="Select Category"
              />
            </div>

            <div>
              <label className={labelClass}>Payment Method</label>
              <SearchableSelect
                options={[
                  { value: "Cash", label: "Cash" },
                  { value: "UPI", label: "UPI" },
                  { value: "Card", label: "Card" },
                  { value: "Bank Transfer", label: "Bank Transfer" },
                ]}
                value={form.paymentMethod}
                onChange={(val) =>
                  handleChange({
                    target: { name: "paymentMethod", value: val },
                  })
                }
                placeholder="Select Method"
              />
            </div>

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
              className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl transition font-semibold shadow-md"
            >
              Add Expense
            </button>
          </div>
        )}

        {/* EDIT DIALOG */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  name="title"
                  value={form.title}
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Amount</label>
                <input
                  name="amount"
                  value={form.amount}
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Expense Date</label>
                <input
                  name="expenseDate"
                  type="date"
                  value={form.expenseDate}
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <SearchableSelect
                  options={[
                    { value: "General", label: "General" },
                    { value: "Maintenance", label: "Maintenance" },
                    { value: "Food", label: "Food" },
                    { value: "Utilities", label: "Utilities" },
                    { value: "Salary", label: "Salary" },
                    { value: "Other", label: "Other" },
                  ]}
                  value={form.category}
                  onChange={(val) =>
                    handleChange({ target: { name: "category", value: val } })
                  }
                  placeholder="Select Category"
                />
              </div>

              <div>
                <label className={labelClass}>Payment Method</label>
                <SearchableSelect
                  options={[
                    { value: "Cash", label: "Cash" },
                    { value: "UPI", label: "UPI" },
                    { value: "Card", label: "Card" },
                    { value: "Bank Transfer", label: "Bank Transfer" },
                  ]}
                  value={form.paymentMethod}
                  onChange={(val) =>
                    handleChange({
                      target: { name: "paymentMethod", value: val },
                    })
                  }
                  placeholder="Select Method"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>

              <button
                onClick={submitUpdate}
                className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition shadow-md"
              >
                Update Expense
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
