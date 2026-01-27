"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { X } from "lucide-react";

export default function StudentView({ id }: { id: string }) {
  const [fees, setFees] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
       // Fetch Student Details
       API.get(`/api/student/get-student/${id}`)
        .then((res) => setStudent(res.data.student))
        .catch((err) => console.error(err));

       // Fetch Fee Status
       API.get(`/api/fee-collection/student-fee-status/${id}`)
        .then((res) => setFees(res.data.feeStatus))
        .catch((err) => console.error(err));

       // Fetch Fee History
       API.get(`/api/fee-collection/student-fee-history/${id}`)
        .then((res) => setHistory(res.data.history || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="p-10 text-center text-orange-600">Loading details...</div>;
  if (!student) return <div className="p-10 text-center text-red-500">Student not found</div>;

  const DetailRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="flex flex-col border-b border-orange-100 py-3 last:border-0">
      <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">{label}</span>
      <span className="text-gray-900 font-medium text-base mt-1">{value || "-"}</span>
    </div>
  );

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
       {/* HEADER with Photo */}
       <div className="flex items-center gap-6 mb-8 bg-orange-50 p-6 rounded-2xl border border-orange-100">
          <img 
            src={student.passportPhotoUrl || "/avatar.png"} 
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
            alt="Student"
          />
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{student.fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                 {student.category || "General"}
               </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">{student.email}</p>
          </div>
       </div>

       {/* FEE OVERVIEW CARD */}
       {fees && (
         <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
               <div className="text-xs uppercase text-blue-600 font-bold mb-1">Total Fee</div>
               <div className="text-xl font-extrabold text-blue-800">₹{fees.totalFee}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
               <div className="text-xs uppercase text-green-600 font-bold mb-1">Paid</div>
               <div className="text-xl font-extrabold text-green-800">₹{fees.totalPaid}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
               <div className="text-xs uppercase text-red-600 font-bold mb-1">Due</div>
               <div className="text-xl font-extrabold text-red-800">₹{fees.dueFee}</div>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <DetailRow label="Mobile" value={student.studentMobileNo} />
          <DetailRow label="Father Name" value={student.fatherName} />
          <DetailRow label="Date of Birth" value={new Date(student.dob).toLocaleDateString()} />
          <DetailRow label="Age" value={student.age} />
          <DetailRow label="Gender" value={student.gender} />
          <DetailRow label="Nationality" value={student.nationality} />
          <DetailRow label="Father Phone" value={student.fatherPhoneNo} />
          <DetailRow label="Emergency Contact" value={student.emergencyContactNo} />
          <DetailRow label="School/College" value={student.schoolCollegeName} />
          <DetailRow label="Class/Course" value={student.courseClassYear} />
       </div>
       
       <div className="mt-6 pt-4 border-t border-orange-100">
         <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide block mb-2">Address</span>
         <p className="text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
            {student.permanentAddress}
         </p>
       </div>

       {/* FEE HISTORY */}
       {history.length > 0 && (
         <div className="mt-8 pt-4 border-t border-orange-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>
            <div className="space-y-3">
               {history.map((h, i) => (
                 <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                       <div className="font-bold text-gray-800">₹{h.amount}</div>
                       <div className="text-xs text-gray-500">{new Date(h.paymentDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs font-semibold bg-gray-200 px-2 py-0.5 rounded text-gray-700">{h.paymentMethod}</div>
                       {h.remarks && <div className="text-xs text-gray-400 mt-1">{h.remarks}</div>}
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}

       {/* Documents Links */}
       <div className="mt-6 grid grid-cols-2 gap-4">
           {student.idProofUrl && (
              <a href={student.idProofUrl} target="_blank" className="block text-center py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-semibold transition">
                View ID Proof
              </a>
           )}
           {student.admissionProofUrl && (
              <a href={student.admissionProofUrl} target="_blank" className="block text-center py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-semibold transition">
                Admission Proof
              </a>
           )}
       </div>
    </div>
  );
}

