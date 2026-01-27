"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import SearchableSelect from "@/components/SearchableSelect";

export default function StudentForm({ id, onSuccess }: { id?: string; onSuccess?: () => void }) {
  const [data, setData] = useState<any>({
    nationality: "Indian",
    category: "Hindu",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      API.get(`/api/student/get-student/${id}`)
        .then((res) => {
          if (res.data?.student) {
             const s = res.data.student;
             // Ensure dates are formatted for input type='date'
             if(s.dob) s.dob = s.dob.split('T')[0];
             setData(s);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const submit = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, v as any));

      if (id) {
        await API.put(`/api/student/update-student/${id}`, formData);
        toast.success("Student updated successfully");
      } else {
        await API.post("/api/student/add-student", formData);
        toast.success("Student added successfully");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save student");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400";

  const labelClass = "text-sm font-semibold text-orange-700 mb-1 block";

  const fileClass =
    "block w-full text-sm text-gray-700 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-orange-400 file:to-red-400 file:text-white hover:file:opacity-90 cursor-pointer";

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-orange-200">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-orange-600">
          {id ? "Update Student" : "Add New Student"}
        </h2>

        {/* BASIC INFO */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-red-500 border-l-4 border-orange-400 pl-3 mb-5">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <input className={inputClass} placeholder="John Doe" onChange={(e) => setData({ ...data, fullName: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>Father Name</label>
              <input className={inputClass} placeholder="Mr. Doe" onChange={(e) => setData({ ...data, fatherName: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" className={inputClass} onChange={(e) => setData({ ...data, dob: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>Age</label>
              <input className={inputClass} placeholder="18" onChange={(e) => setData({ ...data, age: e.target.value })} />
            </div>

           <div>
              <label className={labelClass}>Gender</label>
              <SearchableSelect
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
                value={data.gender}
                onChange={(val) => setData({ ...data, gender: val })}
                placeholder="Select Gender"
              />
            </div>


         <div>
  <label className={labelClass}>Nationality</label>
  <input
    className={inputClass}
    value={data.nationality}
    onChange={(e) => setData({ ...data, nationality: e.target.value })}
  />
</div>


            <div>
  <label className={labelClass}>Category</label>
  <input
    className={inputClass}
    value={data.category}
    onChange={(e) => setData({ ...data, category: e.target.value })}
  />
</div>

          </div>
        </div>

        {/* CONTACT INFO */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-red-500 border-l-4 border-orange-400 pl-3 mb-5">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input className={inputClass} placeholder="Student Mobile" onChange={(e) => setData({ ...data, studentMobileNo: e.target.value })} />
            <input className={inputClass} placeholder="Email" onChange={(e) => setData({ ...data, email: e.target.value })} />
            <input className={inputClass} placeholder="Father Phone" onChange={(e) => setData({ ...data, fatherPhoneNo: e.target.value })} />
            <input className={inputClass} placeholder="Emergency Contact" onChange={(e) => setData({ ...data, emergencyContactNo: e.target.value })} />
          </div>
        </div>

        {/* EDUCATION */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-red-500 border-l-4 border-orange-400 pl-3 mb-5">
            Education Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input className={inputClass} placeholder="School / College Name" onChange={(e) => setData({ ...data, schoolCollegeName: e.target.value })} />
            <input className={inputClass} placeholder="Course / Class / Year" onChange={(e) => setData({ ...data, courseClassYear: e.target.value })} />
          </div>
        </div>

        {/* ADDRESS */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-red-500 border-l-4 border-orange-400 pl-3 mb-5">
            Address
          </h3>

          <textarea className={`${inputClass} h-28`} placeholder="Permanent Address" onChange={(e) => setData({ ...data, permanentAddress: e.target.value })} />
        </div>

        {/* DOCUMENTS */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-red-500 border-l-4 border-orange-400 pl-3 mb-5">
            Upload Documents
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PASSPORT PHOTO */}
<div>
  <label className={labelClass}>Passport Photo</label>
  <input
    type="file"
    className={fileClass}
    onChange={(e) =>
      setData({ ...data, passportPhoto: e.target.files?.[0] })
    }
  />
  {data.passportPhoto && (
    <p className="mt-1 text-xs text-gray-600">
      Selected: {data.passportPhoto.name}
    </p>
  )}
</div>

{/* ID PROOF */}
<div>
  <label className={labelClass}>ID Proof</label>
  <input
    type="file"
    className={fileClass}
    onChange={(e) =>
      setData({ ...data, idProof: e.target.files?.[0] })
    }
  />
  {data.idProof && (
    <p className="mt-1 text-xs text-gray-600">
      Selected: {data.idProof.name}
    </p>
  )}
</div>

{/* ADMISSION PROOF */}
<div>
  <label className={labelClass}>Admission Proof</label>
  <input
    type="file"
    className={fileClass}
    onChange={(e) =>
      setData({ ...data, admissionProof: e.target.files?.[0] })
    }
  />
  {data.admissionProof && (
    <p className="mt-1 text-xs text-gray-600">
      Selected: {data.admissionProof.name}
    </p>
  )}
</div>

{/* PARENT ID PROOF */}
<div>
  <label className={labelClass}>Parent ID Proof</label>
  <input
    type="file"
    className={fileClass}
    onChange={(e) =>
      setData({ ...data, parentIdProof: e.target.files?.[0] })
    }
  />
  {data.parentIdProof && (
    <p className="mt-1 text-xs text-gray-600">
      Selected: {data.parentIdProof.name}
    </p>
  )}
</div>

          </div>
        </div>

        {/* SUBMIT */}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:scale-[1.02] transition-all disabled:opacity-60 shadow-lg"
        >
          {loading ? "Saving..." : id ? "Update Student" : "Add Student"}
        </button>
      </div>
    </div>
  );
}
