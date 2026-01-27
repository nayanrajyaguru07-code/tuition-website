"use client";
import { useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";

export default function ProfileForm() {
  const [hostelName, setHostelName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    await API.put("/api/user/update-profile", { hostelName, email, password });
    toast.success("Profile updated");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Update Profile</h2>
      <div className="space-y-4">
        <input
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400"
          placeholder="Hostel Name"
          onChange={(e) => setHostelName(e.target.value)}
        />
        <input
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-gray-400"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button 
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all" 
          onClick={submit}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
