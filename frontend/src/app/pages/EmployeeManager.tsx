"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  photoUrl: string;
};

export default function EmployeeManager() {
  const [tab, setTab] = useState<"list" | "add" | "edit">("list");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
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
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v as any));

      await API.post("/api/employee/add-staff", fd);
      toast.success("Employee added");
      setTab("list");
      loadEmployees();
    } catch {
      toast.error("Failed to add employee");
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
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v as any));

      await API.put(`/api/employee/update-staff/${selectedId}`, fd);
      toast.success("Employee updated");
      setTab("list");
      loadEmployees();
    } catch {
      toast.error("Failed to update employee");
    }
  };

  const deleteEmployee = async (id: number) => {
    if (!confirm("Delete this employee?")) return;

    try {
      await API.delete(`/api/employee/delete-staff/${id}`);
      toast.success("Employee deleted");
      loadEmployees();
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Employee Management</h2>

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
              {t === "list" && "All Employees"}
              {t === "add" && "Add Employee"}
              {t === "edit" && "Edit Employee"}
            </button>
          ))}
        </div>

        {/* LIST */}
        {tab === "list" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((e) => (
              <div
                key={e.id}
                className="border rounded-xl p-5 shadow hover:shadow-lg transition"
              >
                <img
                  src={e.photoUrl}
                  className="w-20 h-20 rounded-full object-cover mb-3"
                />
                <div className="font-semibold">{e.name}</div>
                <div className="text-sm text-gray-500">{e.email}</div>
                <div className="text-sm text-gray-600">{e.role}</div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => loadEmployeeDetails(e.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEmployee(e.id)}
                    className="flex-1 border border-red-400 text-red-600 py-2 rounded-lg text-sm"
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
            {[
              ["name", "Name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["address", "Address"],
              ["gender", "Gender"],
              ["role", "Role"],
              ["salary", "Salary"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input
                  name={key}
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>
            ))}

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
              className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl"
            >
              Add Employee
            </button>
          </div>
        )}

        {/* EDIT */}
        {tab === "edit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(form).map(
              ([key, val]) =>
                key !== "photo" && (
                  <div key={key}>
                    <label className={labelClass}>{key}</label>
                    <input
                      name={key}
                      value={val as any}
                      className={inputClass}
                      onChange={handleChange}
                    />
                  </div>
                ),
            )}

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
              onClick={submitUpdate}
              className="md:col-span-2 bg-green-600 text-white py-3 rounded-xl"
            >
              Update Employee
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
