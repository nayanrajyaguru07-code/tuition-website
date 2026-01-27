"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import SearchableSelect from "@/components/SearchableSelect";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  photoUrl: string;
};

export default function EmployeeManager({ initialTab = "list" }: { initialTab?: "list" | "add" }) {
  const [tab, setTab] = useState<"list" | "add">(initialTab);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showEdit, setShowEdit] = useState(false);
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
    photo: null,
  });

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400";
  const labelClass = "text-sm font-medium text-gray-700";

  const loadEmployees = async () => {
    try {
      const res = await API.get("/api/employee/all-staff");
      console.log(res.data);
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

  const openEditDialog = async (id: number) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/employee/staff-details/${id}`);
      setForm(res.data.employee);
      
      setSelectedId(id);
      setShowEdit(true);
    } catch {
      toast.error("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  };

  const submitUpdate = async () => {
    if (!selectedId) return;

    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v as any));

      await API.put(`/api/employee/update-staff/${selectedId}`, fd);
      toast.success("Employee updated");
      setShowEdit(false);
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Employee Management</h2>

        {/* TABS */}
        <div className="flex gap-3 mb-6">
          {["list", "add"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {t === "list" ? "All Employees" : "Add Employee"}
            </button>
          ))}
        </div>

        {/* LIST */}
{tab === "list" && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {employees.map((e) => (
      <div
        key={e.id}
        className="border rounded-2xl p-5 shadow-md hover:shadow-xl transition bg-white"
      >
        {/* PHOTO + NAME */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={e.photoUrl}
            className="w-20 h-20 rounded-full object-cover border"
          />
          <div>
            <div className="font-semibold text-lg">{e.name}</div>
            <div className="text-sm text-gray-500">{e.role}</div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="space-y-1 text-sm text-gray-700">
          <div>
            <span className="font-medium">Email:</span> {e.email}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {e.phone}
          </div>
          <div>
            <span className="font-medium">Role:</span> {e.role}
          </div>
          <div>
            <span className="font-medium">Gender:</span>{" "}
            {(e as any).gender || "-"}
          </div>
          <div>
            <span className="font-medium">Address:</span>{" "}
            {(e as any).address || "-"}
          </div>
          <div>
            <span className="font-medium">Salary:</span>{" "}
            {(e as any).salary || "-"}
          </div>
          <div>
            <span className="font-medium">Joining Date:</span>{" "}
            {(e as any).dateOfJoining
              ? new Date((e as any).dateOfJoining).toLocaleDateString()
              : "-"}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => openEditDialog(e.id)}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-semibold transition"
          >
            Edit
          </button>
          <button
            onClick={() => deleteEmployee(e.id)}
            className="flex-1 border border-red-400 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-semibold transition"
          >
            Delete
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
              <input name="name" className={inputClass} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" className={inputClass} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" className={inputClass} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input name="address" className={inputClass} onChange={handleChange} />
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
                onChange={(val) => handleChange({ target: { name: "gender", value: val } })}
                placeholder="Select Gender"
              />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <SearchableSelect
                options={[
                  { value: "Admin", label: "Admin" },
                  { value: "Teacher", label: "Teacher" },
                  { value: "Staff", label: "Staff" },
                  { value: "Driver", label: "Driver" },
                ]}
                value={form.role}
                onChange={(val) => handleChange({ target: { name: "role", value: val } })}
                placeholder="Select Role"
              />
            </div>

            <div>
              <label className={labelClass}>Salary</label>
              <input name="salary" className={inputClass} onChange={handleChange} />
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
              <label className={labelClass}>Photo</label>
              <input
                type="file"
                name="photo"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <button
              onClick={submitAdd}
              disabled={loading}
              className="md:col-span-2 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Employee"}
            </button>
          </div>
        )}
      </div>

      {/* EDIT DIALOG */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-600 to-red-600">
              <h3 className="text-lg font-semibold text-white">
                Edit Employee Details
              </h3>
              <button
                onClick={() => setShowEdit(false)}
                className="text-white text-xl hover:scale-110 transition"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-orange-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input name="name" value={form.name} className={inputClass} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input name="email" value={form.email} className={inputClass} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input name="phone" value={form.phone} className={inputClass} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input name="address" value={form.address} className={inputClass} onChange={handleChange} />
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
                    onChange={(val) => handleChange({ target: { name: "gender", value: val } })}
                    placeholder="Select Gender"
                  />
                </div>

                <div>
                  <label className={labelClass}>Role</label>
                  <SearchableSelect
                    options={[
                      { value: "Admin", label: "Admin" },
                      { value: "Teacher", label: "Teacher" },
                      { value: "Staff", label: "Staff" },
                      { value: "Driver", label: "Driver" },
                    ]}
                    value={form.role}
                    onChange={(val) => handleChange({ target: { name: "role", value: val } })}
                    placeholder="Select Role"
                  />
                </div>

                <div>
                  <label className={labelClass}>Salary</label>
                  <input name="salary" value={form.salary} className={inputClass} onChange={handleChange} />
                </div>

                <div>
                  <label className={labelClass}>Date of Joining</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={form.dateOfJoining ? new Date(form.dateOfJoining).toISOString().split('T')[0] : ''}
                    className={inputClass}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Photo</label>
                  <input
                    type="file"
                    name="photo"
                    className={`${inputClass} bg-white`}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitUpdate}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
              >
                {loading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
