"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

// --- Shadcn UI Imports ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type College = {
  id: number;
  name: string;
  email?: string;
  createdAt: string;
  role?: string;
};

// --- Skeleton Card ---
const SkeletonCard = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </CardHeader>
  </Card>
);

// --- College Card ---
interface CollegeCardProps {
  college: College;
  onEdit: (college: College) => void;
  onDelete: (id: number) => void;
  className?: string;
}

const CollegeCard: React.FC<CollegeCardProps> = ({
  college,
  onEdit,
  onDelete,
  className,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const onEnter = () => {
    gsap.to(cardRef.current, {
      y: -8,
      scale: 1.03,
      boxShadow:
        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      duration: 0.3,
      ease: "power2.out",
    });
  };
  const onLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      boxShadow:
        "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      duration: 0.3,
      ease: "power2.inOut",
    });
  };

  return (
    <Card
      ref={cardRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={cn(
        "cursor-pointer transition-all duration-300 overflow-hidden",
        className
      )}
    >
      <CardHeader className="p-6 min-h-[140px]">
        <CardTitle className="truncate text-xl">{college.name}</CardTitle>
        <CardDescription>
          Joined: {new Date(college.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onEdit(college)}>
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(college.id)}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

// --- Main Page ---
export default function CollegesPage() {
  const [collegeName, setCollegeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);

  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // --- Dialog State for Edit ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCollege, setEditCollege] = useState<College | null>(null);

  const cardColors = [
    "bg-cyan-50 dark:bg-cyan-900/50",
    "bg-rose-50 dark:bg-rose-950/50",
    "bg-amber-50 dark:bg-amber-950/50",
    "bg-violet-50 dark:bg-violet-950/50",
    "bg-lime-50 dark:bg-lime-950/50",
    "bg-sky-50 dark:bg-sky-950/50",
  ];

  // Fetch Colleges
  useEffect(() => {
    const fetchColleges = async () => {
      setIsFetching(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/add_school`
        );
        setColleges(res.data);
      } catch {
        toast.error("Could not fetch schools.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchColleges();
  }, []);

  // Add College
  const handleAddSchool = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) return toast.error("Please select a role.");

    setIsAddingSchool(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/add_school`,
        { name: collegeName, email, password, role },
        { withCredentials: true }
      );
      toast.success("School added successfully!");
      setColleges([response.data, ...colleges]);
      setCollegeName("");
      setEmail("");
      setPassword("");
      setRole("");
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsAddingSchool(false);
    }
  };

  // Delete College
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/add_school/${id}`);
      toast.success("School deleted.");
      setColleges(colleges.filter((c) => c.id !== id));
    } catch {
      toast.error("Failed to delete school.");
    }
  };

  // Open Edit Dialog
  const handleEdit = (college: College) => {
    setEditCollege(college);
    setCollegeName(college.name);
    setEmail(college.email || "");
    setRole(college.role || "");
    setPassword("");
    setIsDialogOpen(true);
  };

  // Update College
  const handleUpdate = async () => {
    if (!editCollege) return;
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/add_school/${editCollege.id}`,
        { name: collegeName, email, password, role }
      );
      toast.success("School updated!");
      setColleges(
        colleges.map((c) => (c.id === editCollege.id ? response.data : c))
      );
      setIsDialogOpen(false);
    } catch {
      toast.error("Update failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            School Management
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Left: Add Form --- */}
          <div className="lg:col-span-1 lg:sticky lg:top-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Register a New School</CardTitle>
                <CardDescription>
                  Fill out the form to add a school.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAddSchool}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Springdale High"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-select">Role</Label>
                    <Select onValueChange={setRole} value={role}>
                      <SelectTrigger id="role-select">
                        <SelectValue placeholder="Select a role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@school.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full mt-5"
                    disabled={isAddingSchool}
                  >
                    {isAddingSchool ? "Adding..." : "Add School"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* --- Right: School List --- */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Available Schools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isFetching ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : colleges.length ? (
                colleges.map((college, i) => (
                  <CollegeCard
                    key={college.id}
                    college={college}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    className={cardColors[i % cardColors.length]}
                  />
                ))
              ) : (
                <Card className="md:col-span-2">
                  <CardContent className="p-10 text-center">
                    <h3 className="text-2xl font-semibold text-foreground">
                      No Schools Found
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Be the first to add one!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- ✨ Edit Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>School Name</Label>
              <Input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>New Password (optional)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
