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
      <h2 className="text-xl mb-3">Update Profile</h2>
      <input
        className="border p-2 w-full mb-2"
        placeholder="Hostel Name"
        onChange={(e) => setHostelName(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="bg-black text-white p-2 w-full" onClick={submit}>
        Save
      </button>
    </div>
  );
}
