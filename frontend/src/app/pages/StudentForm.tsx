"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import SearchableSelect from "@/components/SearchableSelect";

export default function StudentForm({
  id,
  onSuccess,
}: {
  id?: string;
  onSuccess?: () => void;
}) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      API.get(`/api/student/get-student/${id}`)
        .then((res) => {
          const student = res.data.student;
          // Format date for input type="date"
          if (student.dob) {
            student.dob = new Date(student.dob).toISOString().split("T")[0];
          }
          setData(student);
        })
        .catch((err) => {
          console.error("Failed to fetch student", err);
          toast.error("Failed to load student details");
        })
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

  const labelClass = "text-sm font-medium text-gray-700";

  const fileClass =
    "block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer";

  return (
    <div className="p-1">
      <div className="bg-white rounded-2xl p-0 md:p-2">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {id ? "Update Student" : "Add New Student"}
        </h2>

        {/* BASIC INFO */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                className={inputClass}
                placeholder="John Doe"
                value={data.fullName || ""}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Father Name</label>
              <input
                className={inputClass}
                placeholder="Mr. Doe"
                value={data.fatherName || ""}
                onChange={(e) =>
                  setData({ ...data, fatherName: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type="date"
                className={inputClass}
                value={data.dob || ""}
                onChange={(e) => setData({ ...data, dob: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Age</label>
              <input
                className={inputClass}
                placeholder="18"
                value={data.age || ""}
                onChange={(e) => setData({ ...data, age: e.target.value })}
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
                value={data.gender || ""}
                onChange={(val) => setData({ ...data, gender: val })}
                placeholder="Select Gender"
              />
            </div>

            <div>
              <label className={labelClass}>Nationality</label>
              <input
                className={inputClass}
                placeholder="Indian"
                value={data.nationality || ""}
                onChange={(e) =>
                  setData({ ...data, nationality: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <input
                className={inputClass}
                placeholder="General / OBC / SC / ST"
                value={data.category || ""}
                onChange={(e) => setData({ ...data, category: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* CONTACT INFO */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Student Mobile</label>
              <input
                className={inputClass}
                placeholder="9876543210"
                value={data.studentMobileNo || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    studentMobileNo: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                placeholder="student@example.com"
                value={data.email || ""}
                onChange={(e) => setData({ ...data, email: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Father Phone</label>
              <input
                className={inputClass}
                placeholder="9876543210"
                value={data.fatherPhoneNo || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    fatherPhoneNo: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Emergency Contact</label>
              <input
                className={inputClass}
                placeholder="9876543210"
                value={data.emergencyContactNo || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    emergencyContactNo: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* EDUCATION */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Education Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>School / College Name</label>
              <input
                className={inputClass}
                placeholder="ABC College"
                value={data.schoolCollegeName || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    schoolCollegeName: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Course / Class / Year</label>
              <input
                className={inputClass}
                placeholder="BCA 1st Year"
                value={data.courseClassYear || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    courseClassYear: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* ADDRESS */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Address</h3>

          <textarea
            className={`${inputClass} h-24`}
            placeholder="Permanent Address"
            value={data.permanentAddress || ""}
            onChange={(e) =>
              setData({
                ...data,
                permanentAddress: e.target.value,
              })
            }
          />
        </div>

        {/* DOCUMENTS */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Upload Documents
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Passport Photo</label>
              <input
                type="file"
                className={fileClass}
                onChange={(e) =>
                  setData({
                    ...data,
                    passportPhoto: e.target.files?.[0],
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>ID Proof</label>
              <input
                type="file"
                className={fileClass}
                onChange={(e) =>
                  setData({
                    ...data,
                    idProof: e.target.files?.[0],
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Admission Proof</label>
              <input
                type="file"
                className={fileClass}
                onChange={(e) =>
                  setData({
                    ...data,
                    admissionProof: e.target.files?.[0],
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Parent ID Proof</label>
              <input
                type="file"
                className={fileClass}
                onChange={(e) =>
                  setData({
                    ...data,
                    parentIdProof: e.target.files?.[0],
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? "Saving..." : id ? "Update Student" : "Add Student"}
        </button>
      </div>
    </div>
  );
}
