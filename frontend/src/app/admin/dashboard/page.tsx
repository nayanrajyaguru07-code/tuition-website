"use client";

import { useEffect, useState, ReactNode } from "react";
import { API } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Wallet,
  CreditCard,
  Building2,
  ChevronDown,
  Banknote,
  Search,
  TrendingUp,
  Eye,
  IndianRupee,
} from "lucide-react";
import StudentView from "@/app/pages/StudentView";
import StaffView from "@/app/pages/StaffView";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* =========================
   DASHBOARD
========================= */
export default function AdminDashboard() {
  const [counts, setCounts] = useState({ totalStudents: 0, totalStaff: 0 });
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [hostelList, setHostelList] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [selectedHostelId, setSelectedHostelId] = useState("all");
  const [activeTab, setActiveTab] =
    useState<"overview" | "directory">("overview");
  const [directoryTab, setDirectoryTab] =
    useState<"students" | "staff">("students");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"student" | "staff" | null>(null);

  // Fee Setting State
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [targetHostelId, setTargetHostelId] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  // CHECK AUTH
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/admin/login";
    }
  }, []);

  useEffect(() => {
    // Only fetch if token exists
    if (!localStorage.getItem("token")) return; 
    
    API.get("/api/dashboard/hostel-list")
      .then((res) => {
        console.log("Hostel list loaded:", res.data);
        setHostelList(res.data.hostels || []);
      })
      .catch((err) => {
        console.error("Failed to load hostel list:", err);
      });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = { params: { hostelId: selectedHostelId } };

        const [
          countsRes,
          financeRes,
          recoveryRes,
          studRes,
          staffRes,
        ] = await Promise.all([
          API.get("/api/dashboard/stats/counts", params),
          API.get("/api/dashboard/stats/monthly-finance", params),
          API.get("/api/dashboard/stats/current-month-recovery", params),
          API.get("/api/dashboard/details/students", params),
          API.get("/api/dashboard/details/staff", params),
        ]);

        setCounts(countsRes.data);
        setFinanceData(financeRes.data.chartData || []);
        setRecoveryData(recoveryRes.data);
        setStudents(studRes.data.students || []);
        setStaff(staffRes.data.staff || []);

        if (selectedHostelId === "all") {
          const perf = await API.get("/api/dashboard/stats/hostel-performance");
          setPerformanceData(perf.data.performance || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedHostelId]);

  const filteredList =
    directoryTab === "students"
      ? students.filter(
          (s) =>
            s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase())
        )
      : staff.filter(
          (s) =>
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.role?.toLowerCase().includes(search.toLowerCase())
        );

  const pieData = recoveryData
    ? [
        { name: "Collected", value: recoveryData.collected },
        { name: "Pending", value: recoveryData.pending },
      ]
    : [];

  const handleOpenFeeDialog = () => {
    if (selectedHostelId !== "all") {
      setTargetHostelId(selectedHostelId);
    } else {
        setTargetHostelId(""); // Force user to pick if currently viewing "All"
    }
    setFeeAmount("");
    setIsFeeDialogOpen(true);
  };

  const handleUpdateFee = async () => {
      if (!targetHostelId || !feeAmount) {
          alert("Please select a hostel and enter a fee amount");
          return;
      }

      try {
          await API.put("/api/dashboard/update-fee", {
              hostelId: targetHostelId,
              fee: feeAmount
          });
          alert("Fee updated successfully!");
          setIsFeeDialogOpen(false);
      } catch (error) {
          console.error("Failed to update fee", error);
          alert("Failed to update fee");
      }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Complete business overview and records
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenFeeDialog}
              className="px-4 py-2.5 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-700 transition font-medium flex items-center gap-2"
            >
              <IndianRupee className="w-4 h-4" />
              Set Fee
            </button>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedHostelId}
                onChange={(e) => setSelectedHostelId(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-orange-500 appearance-none"
              >
                <option value="all">All Hostels</option>
                {hostelList.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.hostelName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="bg-gray-100 p-1 rounded-xl flex">
              {["overview", "directory"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-white shadow text-orange-600"
                      : "text-gray-600"
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ================= OVERVIEW ================= */}
            {activeTab === "overview" && (
              <div className="space-y-10">

                {/* STATS GRID (ALL KEPT) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Students" value={counts.totalStudents} icon={<GraduationCap />} />
                  <StatCard title="Total Staff" value={counts.totalStaff} icon={<Users />} />
                  <StatCard title="Revenue (This Month)" value={`₹${recoveryData?.collected ?? 0}`} icon={<Wallet />} />
                  <StatCard title="Pending Fees" value={`₹${recoveryData?.pending ?? 0}`} icon={<CreditCard />} />
                  <StatCard title="Salary Paid" value={`₹${recoveryData?.salaryPaid ?? 0}`} icon={<Banknote />} />
                  <StatCard title="Expenses" value={`₹${recoveryData?.generalExpenses ?? 0}`} icon={<Wallet />} />
                  <StatCard title="Net Profit" value={`₹${(recoveryData?.collected ?? 0) - (recoveryData?.totalExpense ?? 0)}`} icon={<TrendingUp />} />
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold mb-4 text-gray-800">
                      Financial Overview
                    </h2>
                    <div className="h-80">
                      <ResponsiveContainer>
                        <BarChart data={financeData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="income" fill="#F97316" radius={[4,4,0,0]} />
                          <Bar dataKey="expense" fill="#EF4444" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold mb-4 text-gray-800">
                      Monthly Recovery
                    </h2>
                    <ResponsiveContainer height={260}>
                      <PieChart>
                        <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value">
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? "#F97316" : "#EF4444"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* HOSTEL PERFORMANCE TABLE (FULL) */}
                {selectedHostelId === "all" && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b">
                      <h2 className="font-semibold text-gray-800">
                        Hostel-wise Performance
                      </h2>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-6 py-4 text-left">Hostel</th>
                          <th className="px-6 py-4 text-right">Revenue</th>
                          <th className="px-6 py-4 text-right">Expense</th>
                          <th className="px-6 py-4 text-right">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {performanceData.map((h) => (
                          <tr key={h.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">{h.name}</td>
                            <td className="px-6 py-4 text-right text-green-600">
                              ₹{h.totalRevenue}
                            </td>
                            <td className="px-6 py-4 text-right text-red-500">
                              ₹{h.totalExpense}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold">
                              ₹{h.totalRevenue - h.totalExpense}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= DIRECTORY ================= */}
            {activeTab === "directory" && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center gap-4">
                  <div className="flex gap-2">
                    {["students", "staff"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDirectoryTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          directoryTab === tab
                            ? "bg-orange-100 text-orange-700"
                            : "text-gray-500"
                        }`}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 text-left">Name</th>
                      <th className="px-6 py-4 text-left">Contact</th>
                      <th className="px-6 py-4 text-left">
                        {directoryTab === "students" ? "Hostel" : "Role"}
                      </th>
                      <th className="px-6 py-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredList.map((i) => (
                      <tr key={i.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          {i.fullName || i.name}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          <div className="text-xs">{i.email}</div>
                          <div className="text-xs">
                            {i.studentMobileNo || i.phone || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {i.hostel?.hostelName || i.role || "-"}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                             <button 
                                onClick={() => { setViewId(String(i.id)); setViewType(directoryTab === 'students' ? 'student' : 'staff'); }}
                                className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
                                title="View Details"
                             >
                               <Eye className="w-4 h-4" />
                             </button>
                             
                             {directoryTab === 'students' && (
                               <Link 
                                 href="/fee"
                                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition"
                               >
                                 <IndianRupee className="w-3 h-3" />
                                 Fees
                               </Link>
                             )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* FEE SETTING DIALOG */}
       <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Set Hostel Fee Structure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               {/* Hostel Selector */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Select Hostel</label>
                 <select 
                    value={targetHostelId}
                    onChange={(e) => setTargetHostelId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    disabled={selectedHostelId !== "all" && selectedHostelId !== ""} // Lock if specific hostel selected
                 >
                    <option value="" disabled>-- Select Hostel --</option>
                    {hostelList.map(h => (
                       <option key={h.id} value={String(h.id)}>{h.hostelName}</option>
                    ))}
                 </select>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Fee Amount (₹)</label>
                  <input 
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter annual/monthly fee amount"
                  />
               </div>

               <button 
                 onClick={handleUpdateFee}
                 className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
               >
                 Update Fee
               </button>
            </div>
         </DialogContent>
       </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={!!viewId} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewType === 'student' ? 'Student Details' : 'Staff Details'}
            </DialogTitle>
          </DialogHeader>
          {viewId && viewType === 'student' && <StudentView id={viewId} />}
          {viewId && viewType === 'staff' && <StaffView id={viewId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================
   STAT CARD
========================= */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4"
  >
    <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
      {icon}
    </div>
    <div>
      <p className="text-xs uppercase text-gray-500 font-medium">
        {title}
      </p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  </motion.div>
);
