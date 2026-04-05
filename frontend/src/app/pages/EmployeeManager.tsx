"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import SearchableSelect from "@/components/SearchableSelect";
import StaffView from "./StaffView";
import { Eye, Pencil, Trash2 } from "lucide-react";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  role: string;
  salary: string;
  dateOfJoining: string;
  photoUrl: string;
  idProofUrl?: string;
};

type EmployeeManagerProps = {
  initialTab?: "list" | "add" | "edit" | "view";
};

export default function EmployeeManager({
  initialTab = "list",
}: EmployeeManagerProps) {
  const [tab, setTab] = useState<"list" | "add" | "edit" | "view">(initialTab);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    role: "",
    salary: "",
    dateOfJoining: "",
    passportPhoto: null,
    idProof: null,
  });

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400";
  const labelClass = "text-sm font-medium text-gray-700";

  const loadEmployees = async () => {
    try {
      const res = await API.get("/api/employee/all-staff");
      setEmployees(res.data.staff || []);
    } catch {
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const submitAdd = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v as any));

      await API.post("/api/employee/add-staff", fd);
      toast.success("Employee added");
      setTab("list");
      loadEmployees();
    } catch {
      toast.error("Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeDetails = async (id: number) => {
    try {
      const res = await API.get(`/api/employee/staff-details/${id}`);
      setForm(res.data.employee);
      setSelectedId(id);
      setTab("edit");
    } catch {
      toast.error("Failed to load employee details");
    }
  };

  const submitUpdate = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v as any));

      await API.put(`/api/employee/update-staff/${selectedId}`, fd);
      toast.success("Employee updated");
      setTab("list");
      loadEmployees();
    } catch {
      toast.error("Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id: number) => {
    if (!confirm("Delete this employee?")) return;

    try {
      setLoading(true);
      await API.delete(`/api/employee/delete-staff/${id}`);
      toast.success("Employee deleted");
      loadEmployees();
    } catch {
      toast.error("Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-0 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-none md:rounded-2xl shadow-none md:shadow-lg p-6 md:p-10">
        <h2 className="text-2xl font-bold mb-6">Employee Management</h2>

        {/* TABS */}
        <div className="flex gap-3 mb-6">
          {["list", "add", "edit", "view"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              disabled={(t === "edit" || t === "view") && !selectedId}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {t === "list" && "All Employees"}
              {t === "add" && "Add Employee"}
              {t === "edit" && "Edit Employee"}
              {t === "view" && "View Details"}
            </button>
          ))}
        </div>

        {/* LIST */}
        {tab === "list" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((e) => (
              <div
                key={e.id}
                className="border border-orange-50 rounded-xl p-5 shadow hover:shadow-lg transition flex flex-col"
              >
                <img
                  src={e.photoUrl}
                  className="w-20 h-20 rounded-full object-cover mb-3 border border-orange-100"
                />
                <div className="font-semibold text-gray-900">{e.name}</div>
                <div className="text-sm text-gray-500">{e.email}</div>
                <div className="text-sm text-gray-600 mb-4">{e.role}</div>

                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedId(e.id);
                      setTab("view");
                    }}
                    className="flex-1 bg-orange-50 text-orange-600 hover:bg-orange-100 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    onClick={() => loadEmployeeDetails(e.id)}
                    className="flex-1 bg-gray-50 text-gray-600 hover:bg-gray-100 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => deleteEmployee(e.id)}
                    className="p-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD */}
        {tab === "add" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Name</label>
              <input
                name="name"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                name="email"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                name="phone"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                name="address"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <SearchableSelect
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
                value={form.gender}
                onChange={(val) =>
                  handleChange({ target: { name: "gender", value: val } })
                }
                placeholder="Select Gender"
              />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <input
                name="role"
                value={form.role}
                className={inputClass}
                onChange={handleChange}
                placeholder="Enter Role"
              />
            </div>

            <div>
              <label className={labelClass}>Salary</label>
              <input
                name="salary"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Date of Joining</label>
              <input
                type="date"
                name="dateOfJoining"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Passport Photo</label>
              <input
                type="file"
                name="passportPhoto"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>ID Proof</label>
              <input
                type="file"
                name="idProof"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <button
              onClick={submitAdd}
              disabled={loading}
              className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-md"
            >
              {loading ? "Adding..." : "Add Employee"}
            </button>
          </div>
        )}

        {/* EDIT */}
        {tab === "edit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Name</label>
              <input
                name="name"
                value={form.name}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                name="email"
                value={form.email}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                name="phone"
                value={form.phone}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                name="address"
                value={form.address}
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <SearchableSelect
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
                value={form.gender}
                onChange={(val) =>
                  handleChange({ target: { name: "gender", value: val } })
                }
                placeholder="Select Gender"
              />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <input
                name="role"
                value={form.role}
                className={inputClass}
                onChange={handleChange}
                placeholder="Enter Role"
              />
            </div>

            <div>
              <label className={labelClass}>Salary</label>
              <input
                name="salary"
                value={form.salary}
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>Date of Joining</label>
              <input
                type="date"
                name="dateOfJoining"
                value={
                  form.dateOfJoining
                    ? new Date(form.dateOfJoining).toISOString().split("T")[0]
                    : ""
                }
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Passport Photo</label>
              <input
                type="file"
                name="passportPhoto"
                className={`${inputClass} bg-white`}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>ID Proof</label>
              <input
                type="file"
                name="idProof"
                className={`${inputClass} bg-white`}
                onChange={handleChange}
              />
            </div>

            <button
              onClick={submitUpdate}
              disabled={loading}
              className="md:col-span-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-md"
            >
              {loading ? "Updating..." : "Update Employee"}
            </button>
          </div>
        )}

        {/* VIEW */}
        {tab === "view" && selectedId && (
          <div className="bg-white rounded-xl border border-orange-100 overflow-hidden">
            <StaffView id={String(selectedId)} />
          </div>
        )}
      </div>
    </div>
  );
}
