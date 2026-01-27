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
  LogOut,
  Menu,
  X,
} from "lucide-react";
import StudentView from "@/app/pages/StudentView";
import StaffView from "@/app/pages/StaffView";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchableSelect from "@/components/SearchableSelect";

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
  const [activeTab, setActiveTab] = useState<"overview" | "directory">(
    "overview",
  );
  const [directoryTab, setDirectoryTab] = useState<"students" | "staff">(
    "students",
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"student" | "staff" | null>(null);

  // Fee Setting State
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [targetHostelId, setTargetHostelId] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  // Add Hostel State
  const [isAddHostelDialogOpen, setIsAddHostelDialogOpen] = useState(false);
  const [newHostelName, setNewHostelName] = useState("");
  const [newHostelEmail, setNewHostelEmail] = useState("");
  const [newHostelPassword, setNewHostelPassword] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        const [countsRes, financeRes, recoveryRes, studRes, staffRes] =
          await Promise.all([
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
            s.email?.toLowerCase().includes(search.toLowerCase()),
        )
      : staff.filter(
          (s) =>
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.role?.toLowerCase().includes(search.toLowerCase()),
        );

  const sidebarHostelOptions = [
    { value: "all", label: "All Hostels" },
    ...hostelList.map((h) => ({ value: String(h.id), label: h.hostelName })),
  ];

  const dialogHostelOptions = hostelList.map((h) => ({
    value: String(h.id),
    label: h.hostelName,
  }));

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
      await API.put("/api/user/update-fee", {
        hostelId: targetHostelId,
        amount: feeAmount,
      });
      alert("Fee updated successfully!");
      setIsFeeDialogOpen(false);
    } catch (error) {
      console.error("Failed to update fee", error);
      alert("Failed to update fee");
    }
  };

  const handleAddHostel = async () => {
    if (!newHostelName || !newHostelEmail || !newHostelPassword) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await API.post("/api/auth/signup", {
        hostelName: newHostelName,
        email: newHostelEmail,
        password: newHostelPassword,
      });
      alert("Hostel registered successfully");
      setIsAddHostelDialogOpen(false);
      setNewHostelName("");
      setNewHostelEmail("");
      setNewHostelPassword("");

      // Refresh hostel list
      const res = await API.get("/api/dashboard/hostel-list");
      setHostelList(res.data.hostels || []);
    } catch (err: any) {
      console.error("Registration failed", err);
      alert(err.response?.data?.error || "Failed to register hostel");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* MOBILE HEADER (Visible < md) */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white z-40 px-4 py-3 flex items-center justify-between border-b shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Building2 size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-gray-900">AdminPortal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-700 p-1"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* OVERLAY for Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed top-0 left-0 w-72 h-screen bg-white border-r border-gray-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          pt-0 md:pt-0
      `}
      >
        {/* BRAND */}
        <div className="p-8 pb-4 hidden md:block">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                AdminPortal
              </h1>
              <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                Management
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Header (Close button usually or just use overlay) 
            We used X in the top bar, but if sidebar covers top bar (z-50 vs z-40), we need X here too or push sidebar down.
            Let's make sidebar z-50 and top bar z-40. Sidebar covers top bar.
            So we need branding inside Sidebar for mobile too or just padding.
            Actually, let's show branding on mobile sidebar too.
        */}
        <div className="md:hidden p-6 flex justify-between items-center bg-gray-50/50">
          <span className="font-bold text-lg">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="bg-white p-2 rounded-full shadow-sm text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="px-4 py-2 space-y-1">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4">
            Dashboards
          </p>
          {["overview", "directory"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                activeTab === tab
                  ? "bg-orange-50 text-orange-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab === "overview" ? (
                <TrendingUp size={18} />
              ) : (
                <Users size={18} />
              )}
              <span className="capitalize">{tab}</span>
              {activeTab === tab && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
              )}
            </button>
          ))}
        </div>

        {/* HOSTEL FILTER */}
        <div className="px-4 py-2 mt-4">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Context
          </p>
          <div className="relative group">
            <SearchableSelect
              options={sidebarHostelOptions}
              value={selectedHostelId}
              onChange={(val) => setSelectedHostelId(String(val))}
              placeholder="Select Hostel"
              className="w-full"
            />
          </div>
        </div>

        {/* ACTIONS & FOOTER */}
        <div className="mt-auto p-4 space-y-3">
          <button
            onClick={() => {
              setIsAddHostelDialogOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Building2 size={16} />
            Add Hostel
          </button>

          <button
            onClick={() => {
              handleOpenFeeDialog();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-100 hover:shadow-orange-200 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <IndianRupee size={16} />
            Set Fee
          </button>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <Link
              href="/home"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 md:ml-72 p-4 pt-20 md:p-10 md:pt-10 transition-all duration-300">
        {/* TOP BAR (Context Title only if needed, usually just content now) */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "overview"
                ? "Dashboard Overview"
                : "Directory Management"}
            </h2>
            <p className="text-gray-500 mt-1">
              {activeTab === "overview"
                ? `Welcome back, here's what's happening today.`
                : "Manage students and staff records efficiently."}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-gray-300">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mb-4" />
            <p className="text-sm font-medium animate-pulse">Loading data...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ================= OVERVIEW ================= */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* STATS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard
                    title="Total Students"
                    value={counts.totalStudents}
                    icon={<GraduationCap />}
                  />
                  <StatCard
                    title="Total Staff"
                    value={counts.totalStaff}
                    icon={<Users />}
                  />
                  <StatCard
                    title="Revenue (Mo)"
                    value={`₹${recoveryData?.collected ?? 0}`}
                    icon={<Wallet />}
                  />
                  <StatCard
                    title="Pending Fees"
                    value={`₹${recoveryData?.pending ?? 0}`}
                    icon={<CreditCard />}
                  />
                  <StatCard
                    title="Salary Paid"
                    value={`₹${recoveryData?.salaryPaid ?? 0}`}
                    icon={<Banknote />}
                  />
                  <StatCard
                    title="Expenses"
                    value={`₹${recoveryData?.generalExpenses ?? 0}`}
                    icon={<Wallet />}
                  />
                  <StatCard
                    title="Net Profit"
                    value={`₹${(recoveryData?.collected ?? 0) - (recoveryData?.totalExpense ?? 0)}`}
                    icon={<TrendingUp />}
                  />
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/50">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-lg font-bold text-gray-900">
                        Financial Overview
                      </h2>
                      <div className="w-40">
                        <SearchableSelect
                          options={[{ value: "This Year", label: "This Year" }]}
                          value="This Year"
                          onChange={() => {}}
                          placeholder="Period"
                        />
                      </div>
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer>
                        <BarChart data={financeData} barGap={8}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f3f4f6"
                          />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                          />
                          <Tooltip
                            cursor={{ fill: "#f9fafb" }}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                            }}
                          />
                          <Bar
                            dataKey="income"
                            fill="#F97316"
                            radius={[6, 6, 6, 6]}
                            barSize={32}
                          />
                          <Bar
                            dataKey="expense"
                            fill="#Fee2e2"
                            radius={[6, 6, 6, 6]}
                            barSize={32}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/50">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">
                      Monthly Recovery
                    </h2>
                    <div className="h-64 relative">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={pieData}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            cornerRadius={8}
                          >
                            {pieData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={i === 0 ? "#F97316" : "#f3f4f6"}
                                stroke="none"
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centered Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-gray-900">
                          {pieData[0]?.value
                            ? Math.round(
                                (pieData[0].value /
                                  (pieData[0].value + pieData[1].value)) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                          Collected
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                          Collected
                        </div>
                        <span className="font-semibold text-gray-900">
                          ₹{recoveryData?.collected ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="w-3 h-3 rounded-full bg-gray-100" />
                          Pending
                        </div>
                        <span className="font-semibold text-gray-900">
                          ₹{recoveryData?.pending ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HOSTEL PERFORMANCE TABLE */}
                {selectedHostelId === "all" && (
                  <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100">
                      <h2 className="text-lg font-bold text-gray-900">
                        Hostel Performance
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50/50 text-gray-400 uppercase tracking-wider text-xs">
                          <tr>
                            <th className="px-8 py-5 text-left font-semibold">
                              Hostel Name
                            </th>
                            <th className="px-8 py-5 text-right font-semibold">
                              Revenue
                            </th>
                            <th className="px-8 py-5 text-right font-semibold">
                              Expense
                            </th>
                            <th className="px-8 py-5 text-right font-semibold">
                              Net Profit
                            </th>
                            <th className="px-8 py-5 text-center font-semibold">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {performanceData.map((h) => {
                            const profit = h.totalRevenue - h.totalExpense;
                            return (
                              <tr
                                key={h.id}
                                className="hover:bg-gray-50/80 transition-colors"
                              >
                                <td className="px-8 py-5 font-medium text-gray-900">
                                  {h.name}
                                </td>
                                <td className="px-8 py-5 text-right text-gray-600">
                                  ₹{h.totalRevenue.toLocaleString()}
                                </td>
                                <td className="px-8 py-5 text-right text-gray-600">
                                  ₹{h.totalExpense.toLocaleString()}
                                </td>
                                <td
                                  className={`px-8 py-5 text-right font-bold ${profit >= 0 ? "text-green-600" : "text-red-500"}`}
                                >
                                  {profit >= 0 ? "+" : ""}₹
                                  {profit.toLocaleString()}
                                </td>
                                <td className="px-8 py-5 text-center">
                                  <span
                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${profit > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                                  >
                                    {profit > 0 ? "Healthy" : "Deficit"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= DIRECTORY ================= */}
            {activeTab === "directory" && (
              <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden min-h-[600px]">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-1 bg-gray-100/80 p-1.5 rounded-xl">
                    {["students", "staff"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDirectoryTab(tab as any)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                          directoryTab === tab
                            ? "bg-white text-gray-900 shadow"
                            : "text-gray-500 hover:text-gray-700 shadow-none bg-transparent"
                        }`}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${directoryTab}...`}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-100 transition-all font-medium placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 text-gray-400 uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-8 py-5 text-left font-semibold">
                          Profile
                        </th>
                        <th className="px-8 py-5 text-left font-semibold">
                          Contact Info
                        </th>
                        <th className="px-8 py-5 text-left font-semibold">
                          {directoryTab === "students"
                            ? "Hostel Assigned"
                            : "Role / Designation"}
                        </th>
                        <th className="px-8 py-5 text-left font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredList.map((i) => (
                        <tr
                          key={i.id}
                          className="group hover:bg-orange-50/30 transition-colors"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 font-bold text-sm">
                                {i.fullName?.[0] || i.name?.[0] || "?"}
                              </div>
                              <span className="font-semibold text-gray-900">
                                {i.fullName || i.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-gray-900 font-medium">
                                {i.email}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {i.studentMobileNo || i.phone || "No phone"}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {i.hostel?.hostelName ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                <Building2 size={12} /> {i.hostel.hostelName}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                                {i.role || "N/A"}
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setViewId(String(i.id));
                                  setViewType(
                                    directoryTab === "students"
                                      ? "student"
                                      : "staff",
                                  );
                                }}
                                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600 hover:shadow-sm transition-all"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {directoryTab === "students" && (
                                <Link
                                  href="/fee"
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 shadow-sm transition-all"
                                >
                                  <IndianRupee className="w-3 h-3" />
                                  Fees
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredList.length === 0 && (
                  <div className="p-10 text-center text-gray-400">
                    No records found matching your search.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* FEE SETTING DIALOG */}
      <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Hostel Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Hostel Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Hostel
              </label>
              <SearchableSelect
                options={dialogHostelOptions}
                value={targetHostelId}
                onChange={(val) => setTargetHostelId(String(val))}
                placeholder="-- Select Hostel --"
                disabled={selectedHostelId !== "all" && selectedHostelId !== ""}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fee Amount (₹)
              </label>
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
              {viewType === "student" ? "Student Details" : "Staff Details"}
            </DialogTitle>
          </DialogHeader>
          {viewId && viewType === "student" && <StudentView id={viewId} />}
          {viewId && viewType === "staff" && <StaffView id={viewId} />}
        </DialogContent>
      </Dialog>

      {/* ADD HOSTEL DIALOG */}
      <Dialog
        open={isAddHostelDialogOpen}
        onOpenChange={setIsAddHostelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Hostel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Hostel Name
              </label>
              <input
                required
                type="text"
                value={newHostelName}
                onChange={(e) => setNewHostelName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. Sunrise Hostel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                required
                type="email"
                value={newHostelEmail}
                onChange={(e) => setNewHostelEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="admin@hostel.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                required
                type="password"
                value={newHostelPassword}
                onChange={(e) => setNewHostelPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleAddHostel}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
              ) : (
                "Create Hostel"
              )}
            </button>
          </div>
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
    <div className="p-3 rounded-xl bg-orange-50 text-orange-600">{icon}</div>
    <div>
      <p className="text-xs uppercase text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </motion.div>
);
