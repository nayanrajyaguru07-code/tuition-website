"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StudentForm from "./StudentForm";
import StudentView from "./StudentView";

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

  // Dialog State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const fetchStudents = () => {
    setLoading(true);
    API.get("/api/student/all-students")
      .then((res) => setStudents(res.data.students))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Students</h2>
            <p className="text-gray-500 text-sm mt-1">Manage and view all students in the system.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() => setEditingId("new")}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-100 hover:shadow-orange-200 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading students...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No students found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col border border-orange-50"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={s.passportPhotoUrl || "/avatar.png"}
                    alt={s.fullName}
                    className="w-14 h-14 rounded-full object-cover border border-orange-100"
                  />

                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                      {s.fullName}
                    </div>
                    <div className="text-sm text-gray-500">{s.email}</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  📞 {s.studentMobileNo || "N/A"}
                </div>

                <div className="mt-auto flex gap-3">
                  <button
                    onClick={() => setEditingId(String(s.id))}
                    className="flex-1 text-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2 rounded-lg text-sm font-medium shadow-sm transition-all"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setViewId(String(s.id))}
                    className="flex-1 text-center border border-gray-300 hover:bg-gray-100 py-2 rounded-lg text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EDIT / ADD DIALOG */}
        <Dialog
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId === "new" ? "Add New Student" : "Update Student"}
              </DialogTitle>
            </DialogHeader>
            {editingId && (
              <StudentForm
                id={editingId === "new" ? undefined : editingId}
                key={editingId}
                isDialog={true}
                onSuccess={() => {
                  setEditingId(null);
                  fetchStudents();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* VIEW DIALOG */}
        <Dialog
          open={!!viewId}
          onOpenChange={(open) => !open && setViewId(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>
            {viewId && <StudentView id={viewId} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
