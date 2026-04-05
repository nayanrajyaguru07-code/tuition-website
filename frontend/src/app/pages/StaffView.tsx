"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";

export default function StaffView({ id }: { id: string }) {
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      API.get(`/api/employee/staff-details/${id}`)
        .then((res) => setStaff(res.data.employee))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading)
    return (
      <div className="p-10 text-center text-orange-600">Loading details...</div>
    );
  if (!staff)
    return <div className="p-10 text-center text-red-500">Staff not found</div>;

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | undefined;
  }) => (
    <div className="flex flex-col border-b border-orange-100 py-3 last:border-0">
      <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-gray-900 font-medium text-base mt-1">
        {value || "-"}
      </span>
    </div>
  );

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* HEADER with Photo */}
      <div className="flex items-center gap-6 mb-8 bg-orange-50 p-6 rounded-2xl border border-orange-100">
        <img
          src={staff.photoUrl || "/avatar.png"}
          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          alt="Staff"
        />
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {staff.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
              {staff.role}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">{staff.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailRow label="Mobile" value={staff.phone} />
        <DetailRow label="Gender" value={staff.gender} />
        <DetailRow label="Salary" value={`₹${staff.salary}`} />
        <DetailRow
          label="Joining Date"
          value={
            staff.dateOfJoining
              ? new Date(staff.dateOfJoining).toLocaleDateString()
              : "-"
          }
        />
      </div>

      {/* Documents Links */}
      {staff.idProofUrl && (
        <div className="mt-8 pt-4 border-t border-orange-100">
          <a
            href={staff.idProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 text-sm font-bold transition-all shadow-sm"
          >
            View ID Proof Document
          </a>
        </div>
      )}
    </div>
  );
}
