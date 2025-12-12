"use client";

import { useState, FormEvent, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

// Shadcn/ui Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const FIXED_ROLE = "teacher";

type College = {
  id: number;
  name: string;
};

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [isFetchingSchools, setIsFetchingSchools] = useState(true);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch schools/colleges
  useEffect(() => {
    const fetchColleges = async () => {
      setIsFetchingSchools(true);
      if (!BACKEND_URL) {
        toast.error(
          "Missing backend URL. Set NEXT_PUBLIC_API_URL in your env (local .env or Vercel)."
        );
        setIsFetchingSchools(false);
        return;
      }

      try {
        const res = await axios.get(`${BACKEND_URL}/add_school/`);
        if (Array.isArray(res.data)) {
          setColleges(res.data);
          if (res.data.length === 0) {
            toast.error("No schools found on the server.");
          }
        } else {
          console.warn("Unexpected /add_school response shape:", res.data);
          toast.error("Unexpected response from server when fetching schools.");
        }
      } catch (err: any) {
        console.error("Failed to fetch colleges", err);
        if (axios.isAxiosError(err) && err.response) {
          const msg =
            err.response.status === 404
              ? "School list endpoint returned 404. Check your backend route."
              : `Failed to fetch schools: ${
                  err.response.statusText || err.message
                }`;
          toast.error(msg);
        } else {
          toast.error("Could not fetch school list. Check network/backend.");
        }
      } finally {
        setIsFetchingSchools(false);
      }
    };

    fetchColleges();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedSchool) {
      const msg = "Please select your school.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);

    const endpoint = "/login_school"; // unified endpoint
    const payload = {
      email,
      password,
      schoolId: selectedSchool,
      role: FIXED_ROLE, // role fixed to "teacher"
    };

    try {
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload, {
        withCredentials: true,
      });

      const data = response.data ?? {};
      console.log(data);

      // Try to detect role from backend; fallback to FIXED_ROLE when missing
      const userRole =
        data?.admin?.role || data?.college?.role || data?.role || FIXED_ROLE;
      const token = data?.token ?? null;
      const class_id = data?.class_id ?? null;

      if (token) {
        if (class_id) localStorage.setItem("class_id", String(class_id));
        if (userRole) localStorage.setItem("user_role", userRole);
        localStorage.setItem("token", token);
        toast.success("Login successful!");

        // Redirect based on role if present and admin, otherwise to /home
        const redirectUrl = userRole === "admin" ? "/admin-dashboard" : "/home";
        setTimeout(() => {
          window.location.replace(redirectUrl);
        }, 200);
      } else {
        const msg = "Login response didn't include a token.";
        toast.error(msg);
        setError(msg);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (axios.isAxiosError(err) && err.response) {
        const errorMsg =
          err.response.data?.error ||
          err.response.statusText ||
          "Login failed.";
        toast.error(errorMsg);
        setError(errorMsg);
      } else {
        const errorMsg = "An error occurred. Please try again.";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4 transition-colors duration-300">
      <Card className="w-full max-w-md shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Welcome
          </CardTitle>
          <CardDescription className="pt-2 text-gray-600 dark:text-gray-400">
            Please log in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* School Dropdown */}
            <div className="space-y-2">
              <Label
                htmlFor="school-select"
                className="text-gray-700 dark:text-gray-300"
              >
                Select Your School
              </Label>
              <Select
                onValueChange={setSelectedSchool}
                value={selectedSchool}
                disabled={isFetchingSchools}
              >
                <SelectTrigger
                  id="school-select"
                  className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                >
                  <SelectValue
                    placeholder={
                      isFetchingSchools
                        ? "Loading schools..."
                        : "Select your school..."
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {colleges.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {isFetchingSchools ? "Loading..." : "No schools found"}
                    </SelectItem>
                  ) : (
                    colleges.map((college) => (
                      <SelectItem key={college.id} value={String(college.id)}>
                        {college.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-gray-700 dark:text-gray-300"
              >
                Email Address
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-700 dark:text-gray-300"
              >
                Password
              </Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              />
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="/"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white transition-colors duration-300"
              disabled={isLoading || isFetchingSchools}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
