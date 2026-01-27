"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API } from "@/lib/api";

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

  useEffect(() => {
    API.get("/api/student/all-students")
      .then((res) => setStudents(res.data.students))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Students</h2>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <Link
              href="/students/add"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Add Student
            </Link>
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
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={s.passportPhotoUrl || "/avatar.png"}
                    alt={s.fullName}
                    className="w-14 h-14 rounded-full object-cover border"
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
                  <Link
                    href={`/students/${s.id}`}
                    className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    Edit
                  </Link>

                  <Link
                    href={`/students/${s.id}`}
                    className="flex-1 text-center border border-gray-300 hover:bg-gray-100 py-2 rounded-lg text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
