"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import StudentForm from "./StudentForm";

type Student = {
  id: number;
  fullName: string;
  email: string;
  studentMobileNo: string;
  passportPhotoUrl: string;
};

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "view" | null>(null);

  const openDialog = (id: number, mode: "edit" | "view") => {
    setSelectedId(String(id));
    setViewMode(mode);
  };

  const closeDialog = () => {
    setViewMode(null);
    setSelectedId(null);
    // Refresh list if it was an edit
    if (viewMode === 'edit') {
       API.get("/api/student/all-students").then(res => setStudents(res.data.students)).catch(console.error);
    }
  };

  useEffect(() => {
    API.get("/api/student/all-students")
      .then((res) => setStudents(res.data.students))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteStudent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      await API.delete(`/api/student/delete-student/${id}`);
      setStudents(students.filter((s) => s.id !== id));
      toast.success("Student deleted successfully");
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h2 className="text-3xl font-extrabold text-orange-600">
            Students
          </h2>

          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-orange-200 bg-white/70 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />

            <button
              onClick={() => { setSelectedId(null); setViewMode("edit"); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 transition shadow-md"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-16 text-orange-500 font-medium">
            Loading students...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No students found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bg-white/70 backdrop-blur-xl border border-orange-200 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all p-6 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={s.passportPhotoUrl || "/avatar.png"}
                    alt={s.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-300 shadow"
                  />

                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-900">
                      {s.fullName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {s.email}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-700 mb-6">
                  📞 {s.studentMobileNo || "N/A"}
                </div>

                <div className="mt-auto flex gap-3">
                  <button
                    onClick={() => openDialog(s.id, "edit")}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 transition shadow"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteStudent(s.id)}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!viewMode} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedId ? "Edit Student" : "Add Student"}
            </DialogTitle>
          </DialogHeader>
          
          <StudentForm id={selectedId || undefined} onSuccess={closeDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
