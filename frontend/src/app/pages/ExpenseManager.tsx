"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SearchableSelect from "@/components/SearchableSelect";

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

export default function ExpenseManager({ initialTab = "list" }: ExpenseManagerProps) {
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
                  ? "bg-blue-600 text-white"
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
            <div>
              <label className={labelClass}>Title</label>
              <input name="title" className={inputClass} onChange={handleChange} />
            </div>
            
            <div>
              <label className={labelClass}>Amount</label>
              <input name="amount" className={inputClass} onChange={handleChange} />
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
                onChange={(val) => handleChange({ target: { name: "category", value: val } })}
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
                onChange={(val) => handleChange({ target: { name: "paymentMethod", value: val } })}
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
              className="md:col-span-2 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 transition font-semibold"
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
                    <input name="title" value={form.title} className={inputClass} onChange={handleChange} />
                 </div>
                 
                 <div>
                    <label className={labelClass}>Amount</label>
                    <input name="amount" value={form.amount} className={inputClass} onChange={handleChange} />
                 </div>

                 <div>
                    <label className={labelClass}>Expense Date</label>
                    <input name="expenseDate" type="date" value={form.expenseDate} className={inputClass} onChange={handleChange} />
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
                      onChange={(val) => handleChange({ target: { name: "category", value: val } })}
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
                      onChange={(val) => handleChange({ target: { name: "paymentMethod", value: val } })}
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
                   className="md:col-span-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
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
