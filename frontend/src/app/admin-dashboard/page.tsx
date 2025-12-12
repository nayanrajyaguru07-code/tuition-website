"use client";

import { useState, useEffect, useRef, FC } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { gsap } from "gsap";
import * as THREE from "three";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Users, UserCog } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

/* ===========================
   Types (unchanged)
   =========================== */
interface StatCardProps {
  title: string;
  value: string;
  color?: string;
}
interface GenderData {
  name: string;
  value: number;
}
interface AttendanceData {
  name: string;
  present: number;
  absent: number;
}
interface PerformanceData {
  name: string;
  avgScore: number;
}
interface EventData {
  title: string;
  time: string;
  description: string;
}
interface ExamData {
  subject_name: string;
  class_name: string;
  exam_date: string;
  exam_time: string;
  total_marks: string;
}
interface ApiSummaryCards {
  students: number;
  teachers: number;
  admissions?: number; // optional since we'll remove it
}
interface ApiGenderDist {
  gender: string;
  count: string;
}
interface ApiAttendanceReport {
  day: string;
  present: string;
  absent: string;
}
interface ApiFacultyPerformance {
  faculty_name: string;
  average_score: string;
}
interface ApiClassPerformance {
  class_name: string;
  average_percentage: string;
}
interface ApiIncomeReport {
  month: string;
  income: string;
}
interface ApiUpcomingEvent {
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
}
interface ApiUpcomingExam {
  subject_name: string;
  class_name: string;
  exam_date: string;
  start_time: string;
  total_marks: number;
}

/* ===========================
   Styling constants & helpers
   =========================== */
const CONTAINER =
  "min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100";
const CARD =
  "rounded-2xl shadow-sm bg-white dark:bg-slate-900 border border-transparent dark:border-transparent";
const SECTION_PAD = "p-4 md:p-6";

/* ===========================
   Subcomponents (charts kept logically same, styling simplified)
   =========================== */

const StatsGrid: FC<{ stats: StatCardProps[] }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`${CARD} ${SECTION_PAD} flex flex-col justify-between border-slate-100 dark:border-slate-800`}
          data-animate="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                {s.title}
              </div>
              <div className="text-2xl font-bold mt-1">{s.value}</div>
            </div>
            <div
              aria-hidden
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(167,139,250,0.08))",
              }}
            >
              <div className="text-indigo-600 font-bold">{s.title[0]}</div>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Quick summary & KPI.
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutCard: FC<{ data: GenderData[] }> = ({ data }) => {
  const COLORS = ["#6366f1", "#a78bfa"];
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className={`${CARD} ${SECTION_PAD}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Students</div>
          <div className="text-xs text-muted-foreground">
            Gender distribution
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{total} total</div>
      </div>

      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={48}
              outerRadius={72}
              dataKey="value"
              paddingAngle={4}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4">
        {data.map((d, i) => (
          <div key={i} className="text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-semibold ml-1">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AttendanceBarCard: FC<{ data: AttendanceData[] }> = ({ data }) => {
  return (
    <div className={`${CARD} ${SECTION_PAD}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Attendance</div>
          <div className="text-xs text-muted-foreground">Weekly overview</div>
        </div>
        <div className="text-xs text-muted-foreground">Present / Absent</div>
      </div>

      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="absent" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SimpleBarCard: FC<{
  title: string;
  data: PerformanceData[];
  color?: string;
}> = ({ title, data, color }) => {
  return (
    <div className={`${CARD} ${SECTION_PAD}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">Average scores</div>
        </div>
      </div>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
            <Bar
              dataKey="avgScore"
              fill={color || "#3b82f6"}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ProfessorAttendanceCard: FC<{ data: AttendanceData[] }> = ({ data }) => (
  <div className={`${CARD} ${SECTION_PAD}`}>
    <div className="text-sm font-semibold">Professor Attendance</div>
    <div className="text-xs text-muted-foreground">This week</div>
    <div className="mt-3 h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="present" fill="#16a34a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="absent" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const CalendarCard: FC = () => {
  const today = new Date();
  const monthName = today.toLocaleString("default", { month: "long" });
  const year = today.getFullYear();
  const firstDay = new Date(year, today.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
  const dates = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  return (
    <div className={`${CARD} ${SECTION_PAD}`}>
      <div className="text-sm font-semibold">
        {monthName} {year}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2 text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-muted-foreground text-center">
            {d}
          </div>
        ))}
        {dates.map((d, i) => (
          <div
            key={i}
            className={`h-8 w-8 flex items-center justify-center rounded-full ${
              d === today.getDate()
                ? "bg-indigo-600 text-white"
                : "text-slate-700 dark:text-slate-200"
            }`}
          >
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
};

const EventsCard: FC<{ eventsData: EventData[] }> = ({ eventsData }) => (
  <div className={`${CARD} ${SECTION_PAD}`}>
    <div className="text-sm font-semibold">Events</div>
    <div className="mt-3 space-y-2">
      {eventsData.length ? (
        eventsData.map((e, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-1 bg-indigo-500 rounded" />
            <div className="text-xs">
              <div className="font-medium">{e.title}</div>
              <div className="text-muted-foreground text-xs">
                {e.time} • {e.description}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-xs text-muted-foreground">No upcoming events</div>
      )}
    </div>
  </div>
);

const UpcomingExamsCard: FC<{ examsData: ExamData[] }> = ({ examsData }) => (
  <div className={`${CARD} ${SECTION_PAD}`}>
    <div className="text-sm font-semibold">Upcoming Exams</div>
    <ScrollArea className="mt-3 h-40 pr-2">
      <div className="space-y-3">
        {examsData.length ? (
          examsData.map((ex, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <div>
                <div className="font-medium text-sm">{ex.subject_name}</div>
                <div className="text-xs text-muted-foreground">
                  {ex.exam_date} • {ex.exam_time}
                </div>
              </div>
              <div className="text-sm font-semibold">{ex.total_marks}</div>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground">
            No exams scheduled
          </div>
        )}
      </div>
    </ScrollArea>
  </div>
);

/* ===========================
   Income Line Chart Card
   =========================== */
const IncomeLineCard: FC<{ data: ApiIncomeReport[] }> = ({ data }) => {
  // Ensure months order Jan-Dec; fill missing months with 0
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mapData = months.map((m) => {
    const found = data.find(
      (d) => d.month.substring(0, 3).toLowerCase() === m.toLowerCase()
    );
    return { month: m, income: found ? parseFloat(found.income) : 0 };
  });

  return (
    <div className={`${CARD} ${SECTION_PAD}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Income (12 months)</div>
          <div className="text-xs text-muted-foreground">
            Monthly income trend
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {data.length} months
        </div>
      </div>

      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mapData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v: number) => `${v.toFixed(2)}`} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ===========================
   Three.js hero (small, no images)
   - draws a set of vertical bars scaled by stats
   - animates with GSAP for subtle motion
   =========================== */
function useThreeBars(
  containerRef:
    | React.RefObject<HTMLDivElement | null>
    | React.MutableRefObject<HTMLDivElement | null>,
  stats: StatCardProps[]
) {
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Remove previous canvas if present
    while (el.firstChild) el.removeChild(el.firstChild);

    const width = el.clientWidth || 540;
    const height = 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    camera.position.set(0, 6, 14);
    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // ground plane (subtle)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({
        color: 0x0,
        opacity: 0.0,
        transparent: true,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    const group = new THREE.Group();
    scene.add(group);

    const bars: THREE.Mesh[] = [];
    const spacing = 2.4;
    const baseX = -((stats.length - 1) * spacing) / 2;

    const maxValue = Math.max(...stats.map((s) => Number(s.value) || 1), 1);

    stats.forEach((s, idx) => {
      const val = Number(s.value) || 1;
      const heightVal = (val / maxValue) * 6 + 0.5;
      const geom = new THREE.BoxGeometry(1.4, heightVal, 1.4);
      const hue = 230 - idx * 25;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${hue},70%,60%)`),
        metalness: 0.2,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(baseX + idx * spacing, heightVal / 2 - 0.1, 0);
      mesh.userData = { idx };
      group.add(mesh);
      bars.push(mesh);
    });

    // subtle floating
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(group.rotation, { y: 0.12, duration: 6, ease: "sine.inOut" }, 0);
    tl.to(group.position, { y: 0.12, duration: 6, ease: "sine.inOut" }, 0);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // responsive: resize observer
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || 540;
      const h = 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    sceneRef.current = { scene, camera, renderer, group, bars, tl, ro };

    return () => {
      ro.disconnect();
      tl.kill();
      cancelAnimationFrame(frameId);
      renderer.dispose();
      // remove canvas
      while (el.firstChild) el.removeChild(el.firstChild);
    };
  }, [containerRef, stats]);
}

/* ===========================
   Main Dashboard page (no header, professional layout)
   =========================== */

const SchoolDashboardPage: FC = () => {
  const [stats, setStats] = useState<StatCardProps[]>([]);
  const [genderData, setGenderData] = useState<GenderData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [facultyPerfData, setFacultyPerfData] = useState<PerformanceData[]>([]);
  const [classPerfData, setClassPerfData] = useState<PerformanceData[]>([]);
  const [eventsData, setEventsData] = useState<EventData[]>([]);
  const [examsData, setExamsData] = useState<ExamData[]>([]);
  const [profAttendanceData, setProfAttendanceData] = useState<
    AttendanceData[]
  >([]);
  const [incomeData, setIncomeData] = useState<ApiIncomeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const threeRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [avgIncome, setAvgIncome] = useState<number>(0); // new

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const baseUrl = `${API_URL}/admin_dashboard`;
      const config = { withCredentials: true };
      try {
        const [
          summaryRes,
          genderRes,
          attendanceRes,
          facultyPerfRes,
          classPerfRes,
          incomeRes,
          eventsRes,
          examsRes,
          profAttendanceRes,
        ] = await Promise.all([
          axios.get<ApiSummaryCards>(`${baseUrl}/summary-cards`, config),
          axios.get<ApiGenderDist[]>(`${baseUrl}/gender-distribution`, config),
          axios.get<ApiAttendanceReport[]>(
            `${baseUrl}/faculty-attendance-report`,
            config
          ),
          axios.get<ApiFacultyPerformance[]>(
            `${baseUrl}/faculty-performance`,
            config
          ),
          axios.get<ApiClassPerformance[]>(
            `${baseUrl}/class-performance`,
            config
          ),
          axios.get<ApiIncomeReport[]>(`${baseUrl}/income-report`, config),
          axios.get<ApiUpcomingEvent[]>(`${baseUrl}/upcoming-events`, config),
          axios.get<ApiUpcomingExam[]>(`${baseUrl}/upcoming-exams`, config),
          axios.get<ApiAttendanceReport[]>(
            `${baseUrl}/attendance-report`,
            config
          ),
        ]);

        const s = summaryRes.data;
        // remove Admissions - only Students and Teachers
        setStats([
          { title: "Students", value: String(s.students) },
          { title: "Teachers", value: String(s.teachers) },
        ]);

        if (genderRes.data?.length)
          setGenderData(
            genderRes.data.map((i) => ({
              name: i.gender,
              value: parseInt(i.count, 10),
            }))
          );
        if (attendanceRes.data?.length)
          setAttendanceData(
            attendanceRes.data.map((i) => ({
              name: i.day.substring(0, 3),
              present: parseInt(i.present ?? "0", 10),
              absent: parseInt(i.absent ?? "0", 10),
            }))
          );
        if (facultyPerfRes.data?.length)
          setFacultyPerfData(
            facultyPerfRes.data.map((i) => ({
              name: i.faculty_name,
              avgScore: parseFloat(i.average_score),
            }))
          );
        if (classPerfRes.data?.length)
          setClassPerfData(
            classPerfRes.data.map((i) => ({
              name: i.class_name,
              avgScore: parseFloat(i.average_percentage),
            }))
          );
        if (eventsRes.data?.length)
          setEventsData(
            eventsRes.data.map((i) => ({
              title: i.title,
              time: (i.time || "").substring(0, 5),
              description: i.description,
            }))
          );
        if (examsRes.data?.length)
          setExamsData(
            examsRes.data.map((i) => ({
              subject_name: i.subject_name,
              class_name: i.class_name,
              exam_date: i.exam_date
                ? new Date(i.exam_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "",
              exam_time: (i.start_time || "").substring(0, 5),
              total_marks: String(i.total_marks ?? ""),
            }))
          );
        if (profAttendanceRes.data?.length)
          setProfAttendanceData(
            profAttendanceRes.data.map((i) => ({
              name: i.day.substring(0, 3),
              present: parseInt(i.present ?? "0", 10),
              absent: parseInt(i.absent ?? "0", 10),
            }))
          );

        // income data
        if (incomeRes.data?.length)
          setIncomeData(incomeRes.data as ApiIncomeReport[]);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [API_URL]);

  useEffect(() => {
    // months Jan-Dec
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // map incomeData to months with zeros for missing
    const mapped = months.map((m) => {
      const found = incomeData.find(
        (d) => d.month.substring(0, 3).toLowerCase() === m.toLowerCase()
      );
      return found ? parseFloat(found.income) || 0 : 0;
    });

    const sum = mapped.reduce((a, b) => a + b, 0);
    const avg = sum / 12;
    setAvgIncome(avg);
  }, [incomeData]);

  // Entrance animation for cards
  useEffect(() => {
    if (!rootRef.current) return;
    const nodes = rootRef.current.querySelectorAll("[data-animate='card']");
    if (!nodes || !nodes.length) return;
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out" }
    );
  }, [loading, stats, genderData]);

  // initialize three bars with stats
  useThreeBars(threeRef, stats);

  if (loading) {
    return (
      <div className={`${CONTAINER} flex items-center justify-center`}>
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }
  if (error) {
    return (
      <div
        className={`${CONTAINER} flex items-center justify-center text-red-600`}
      >
        {error}
      </div>
    );
  }

  /* ===========================
     Layout (no header)
     - Top: Hero with 3D canvas + small stat tiles on right
     - Middle: Stats grid + primary charts in two columns
     - Right column (sticky on large screens): professor, calendar, events, exams
     =========================== */
  return (
    <div className={CONTAINER}>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        ref={rootRef}
      >
        {/* Average income box at top */}
        {/* === TOP ROW: Avg Income + Students + Teachers === */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avg Monthly Income */}
          <div
            className={`${CARD} ${SECTION_PAD} flex items-center justify-between`}
            data-animate="card"
          >
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Avg Monthly Income
              </div>

              {/* INR formatting */}
              <div className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(avgIncome)}
              </div>
            </div>

            <div
              aria-hidden
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(167,139,250,0.08))",
              }}
            >
              <div className="text-indigo-600 font-bold text-xl">₹</div>
            </div>
          </div>

          {/* Students */}
          {/* Students */}
          <div
            className={`${CARD} ${SECTION_PAD} flex items-center justify-between`}
            data-animate="card"
          >
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Students
              </div>
              <div className="text-2xl font-bold mt-1">
                {stats.find((s) => s.title === "Students")?.value}
              </div>
            </div>

            <div
              aria-hidden
              className="w-12 h-12 rounded-lg flex items-center justify-center
    bg-indigo-100 dark:bg-indigo-900/40"
            >
              <Users className="text-indigo-600" size={26} />
            </div>
          </div>

          {/* Teachers */}
          <div
            className={`${CARD} ${SECTION_PAD} flex items-center justify-between`}
            data-animate="card"
          >
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Teachers
              </div>
              <div className="text-2xl font-bold mt-1">
                {stats.find((s) => s.title === "Teachers")?.value}
              </div>
            </div>

            <div
              aria-hidden
              className="w-12 h-12 rounded-lg flex items-center justify-center
    bg-indigo-100 dark:bg-indigo-900/40"
            >
              <UserCog className="text-indigo-600" size={26} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gender smaller, Attendance larger */}
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              data-animate="card"
            >
              {/* Smaller Gender Chart */}
              <div className="md:col-span-1">
                <DonutCard data={genderData} />
              </div>

              {/* Bigger Attendance Chart */}
              <div className="md:col-span-2">
                <AttendanceBarCard data={attendanceData} />
              </div>
            </div>

            {/* FULL WIDTH Income Chart */}

            {/* Now Faculty Performance becomes its own row */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-animate="card"
            >
              <SimpleBarCard
                title="Faculty Performance"
                data={facultyPerfData}
                color="#3b82f6"
              />
              <SimpleBarCard
                title="Class Performance"
                data={classPerfData}
                color="#0ea5a0"
              />
            </div>
            <div className="grid grid-cols-1 gap-4" data-animate="card">
              <IncomeLineCard data={incomeData} />
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-animate="card"
            >
              {/* empty placeholder to keep layout balanced */}
              <div />
            </div>
          </div>

          {/* Right sticky column */}
          <aside className="lg:col-span-1">
            <div className="space-y-4 sticky top-8">
              <div data-animate="card">
                <ProfessorAttendanceCard data={profAttendanceData} />
              </div>
              <div data-animate="card">
                <CalendarCard />
              </div>
              <div data-animate="card">
                <EventsCard eventsData={eventsData} />
              </div>
              <div data-animate="card">
                <UpcomingExamsCard examsData={examsData} />
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default SchoolDashboardPage;
