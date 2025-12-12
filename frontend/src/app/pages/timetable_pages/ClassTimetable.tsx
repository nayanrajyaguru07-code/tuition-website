"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const colorPalette = [
  "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
];

// Types
interface Class {
  id: number;
  standard: string;
  division: string;
}
interface Faculty {
  id: number;
  f_name: string;
  l_name?: string;
}
interface Subject {
  id: number;
  subject_name: string;
}
interface TimetableEntry {
  day: string;
  period_number: number;
  subject_name: string;
  f_name: string;
  l_name: string;
  id?: number;
  timetable_id?: number;
  period_id?: number;
  subject_id?: number;
  faculty_id?: number;
  class_id?: number;
}
interface FacultyScheduleEntry {
  day: string;
  period_number: number;
  subject_name: string;
  standard: string;
  division: string;
  id?: number;
}

interface TimetableCellData {
  content: React.ReactNode;
  color?: string;
  meta?: any;
}
interface FormattedTimetable {
  [day: string]: { [period: number]: TimetableCellData };
}

const LoadingSpinner = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center text-muted-foreground py-10 space-y-2">
    <Loader2 className="h-8 w-8 animate-spin" />
    <p>{text}</p>
  </div>
);

const TimetableDisplay = ({
  timetable,
  periods,
  onEdit,
  onDelete,
}: {
  timetable: FormattedTimetable;
  periods: number[];
  onEdit?: (meta: any) => void;
  onDelete?: (meta: any) => void;
}) => {
  if (!periods || periods.length === 0) return null;

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table className="min-w-full table-fixed">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-gray-100 dark:bg-gray-800">
            <TableHead className="font-semibold w-[100px] text-center border-r dark:border-gray-700 px-2 py-3">
              <span className="sr-only">Period / Day</span>
            </TableHead>
            {WEEK_DAYS.map((day) => (
              <TableHead
                key={day}
                className="text-center font-semibold text-gray-700 dark:text-gray-300
                           border-x last:border-r-0 first:border-l-0 dark:border-gray-700 px-2 py-3"
              >
                {day.substring(0, 3)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {periods.map((period) => (
            <TableRow
              key={period}
              className="border-b last:border-b-0 dark:border-gray-700"
            >
              <TableCell className="font-semibold text-center align-middle bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                {`P${period}`}
              </TableCell>

              {WEEK_DAYS.map((day) => {
                const cellData = timetable[day]?.[period];
                const cellColor = cellData?.color || "bg-transparent";

                return (
                  <TableCell
                    key={day}
                    className={`h-20 align-top border-x last:border-r-0 first:border-l-0 dark:border-gray-700 p-0 ${cellColor}`}
                  >
                    {cellData ? (
                      <div className="p-2 h-full flex flex-col justify-center relative">
                        {cellData.content}

                        <div className="absolute top-1 right-1 flex gap-1">
                          {onEdit && (
                            <button
                              className="p-1 rounded-md bg-white/80 dark:bg-black/60 hover:scale-105 transition-transform shadow-sm"
                              onClick={() => onEdit(cellData.meta)}
                              aria-label="Edit slot"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="p-1 rounded-md bg-white/80 dark:bg-black/60 hover:scale-105 transition-transform shadow-sm"
                              onClick={() => onDelete(cellData.meta)}
                              aria-label="Delete slot"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs italic p-1">
                        Free
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export function ClassTimetable() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const [classes, setClasses] = useState<Class[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classTimetable, setClassTimetable] = useState<FormattedTimetable>({});
  const [classPeriods, setClassPeriods] = useState<number[]>([]);
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(
    null
  );
  const [facultyTimetable, setFacultyTimetable] = useState<FormattedTimetable>(
    {}
  );
  const [facultyPeriods, setFacultyPeriods] = useState<number[]>([]);
  const [isFacultyLoading, setIsFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    id: number;
    period_id: number;
    class_id: number;
    subject_id?: number;
    faculty_id?: number;
    day?: string;
    period_number?: number;
  } | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);

  useEffect(() => {
    const fetchFormData = async () => {
      setIsInitialLoading(true);
      try {
        const res = await axios.get(`${API_URL}/add_slot/form-data`, {
          withCredentials: true,
        });
        setClasses(res.data.classes || []);
        setFaculty(res.data.faculty || []);
        setSubjects(res.data.subjects || []);
      } catch (err) {
        console.error("Failed to fetch form-data:", err);
        toast.error("Failed to fetch initial data.");
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchFormData();
  }, [API_URL]);

  const fetchClassTimetable = async (classId: string | null) => {
    if (!classId) {
      setClassTimetable({});
      setClassPeriods([]);
      return;
    }
    setIsClassLoading(true);
    setClassError(null);

    try {
      const res = await axios.get<TimetableEntry[]>(
        `${API_URL}/timetable/class/${classId}`,
        { withCredentials: true }
      );

      // ADD THIS to inspect the exact shape
      console.log("[Timetable] GET /timetable/class res.data:", res.data);

      const uniquePeriods: number[] = [
        ...new Set(res.data.map((e) => e.period_number)),
      ].sort((a, b) => a - b);

      const formatted: FormattedTimetable = {};
      const assignedColors: Record<string, string> = {};
      let colorIndex = 0;

      res.data.forEach((entry) => {
        if (!formatted[entry.day]) formatted[entry.day] = {};

        if (!assignedColors[entry.subject_name]) {
          assignedColors[entry.subject_name] =
            colorPalette[colorIndex % colorPalette.length];
          colorIndex++;
        }

        // Use timetable_id returned by the backend as the canonical slot id
        const slotId = entry.timetable_id ?? entry.id ?? null;

        const meta = {
          id: slotId, // <- critical: used for /add_slot/:id
          timetable_id: entry.timetable_id, // keep original name accessible too
          period_id: entry.period_id ?? entry.period_number ?? null,
          period_number: entry.period_number ?? null,
          class_id: entry.class_id ?? Number(classId),
          subject_id: entry.subject_id ?? null,
          faculty_id: entry.faculty_id ?? null,
          day: entry.day,
        };

        formatted[entry.day][entry.period_number] = {
          content: (
            <div className="text-center">
              <p className="font-medium text-xs sm:text-sm truncate">
                {entry.subject_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.f_name} {entry.l_name}
              </p>
            </div>
          ),
          color: assignedColors[entry.subject_name],
          meta,
        };
      });

      setClassTimetable(formatted);
      setClassPeriods(uniquePeriods);
    } catch (err: any) {
      console.error("Failed to fetch class timetable:", err);
      setClassTimetable({});
      setClassPeriods([]);
      const msg = err?.response?.data?.error || "Failed to fetch timetable.";
      setClassError(msg);
      toast.error(msg);
    } finally {
      setIsClassLoading(false);
    }
  };

  const fetchFacultyTimetable = async (facultyId: string | null) => {
    if (!facultyId) {
      setFacultyTimetable({});
      setFacultyPeriods([]);
      return;
    }
    setIsFacultyLoading(true);
    setFacultyError(null);

    try {
      const res = await axios.get<FacultyScheduleEntry[]>(
        `${API_URL}/timetable/faculty/${facultyId}`,
        { withCredentials: true }
      );

      const uniquePeriods: number[] = [
        ...new Set(res.data.map((e) => e.period_number)),
      ].sort((a, b) => a - b);

      const formatted: FormattedTimetable = {};
      const assignedColors: Record<string, string> = {};
      let colorIndex = 0;

      res.data.forEach((entry) => {
        if (!formatted[entry.day]) formatted[entry.day] = {};
        if (!assignedColors[entry.subject_name]) {
          assignedColors[entry.subject_name] =
            colorPalette[colorIndex % colorPalette.length];
          colorIndex++;
        }
        formatted[entry.day][entry.period_number] = {
          content: (
            <div className="text-center">
              <p className="font-medium text-xs sm:text-sm truncate">
                {entry.subject_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.standard} - {entry.division}
              </p>
            </div>
          ),
          color: assignedColors[entry.subject_name],
          meta: entry,
        };
      });

      setFacultyTimetable(formatted);
      setFacultyPeriods(uniquePeriods);
    } catch (err: any) {
      console.error("Failed to fetch faculty timetable:", err);
      setFacultyTimetable({});
      setFacultyPeriods([]);
      const msg = err?.response?.data?.error || "Failed to fetch schedule.";
      setFacultyError(msg);
      toast.error(msg);
    } finally {
      setIsFacultyLoading(false);
    }
  };

  useEffect(() => {
    fetchClassTimetable(selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    fetchFacultyTimetable(selectedFacultyId);
  }, [selectedFacultyId]);

  const checkDuplicatePeriod = async (
    period_id: number,
    ignoreId?: number | null
  ) => {
    try {
      for (const dayKey of Object.keys(classTimetable)) {
        const periods = classTimetable[dayKey];
        for (const pKey of Object.keys(periods)) {
          const cell = periods[Number(pKey)];
          const meta = cell?.meta;
          if (!meta) continue;

          const metaPeriodId = meta.period_id ?? meta.period_number ?? null;
          const metaRowId = meta.id ?? meta.period_id ?? null;

          if (
            metaPeriodId != null &&
            Number(metaPeriodId) === Number(period_id) &&
            (ignoreId == null || Number(metaRowId) !== Number(ignoreId))
          ) {
            return true;
          }
        }
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateSlot = async (payload: {
    id: number;
    period_id: number;
    class_id: number;
    subject_id: number | null;
    faculty_id: number | null;
  }) => {
    const tryPatch = async (targetId: number | string) => {
      const url = `${API_URL}/add_slot/${targetId}`;

      const params = new URLSearchParams();
      params.append("period_id", String(payload.period_id));
      params.append("class_id", String(payload.class_id)); // required by backend
      if (payload.subject_id !== null && payload.subject_id !== undefined)
        params.append("subject_id", String(payload.subject_id));
      if (payload.faculty_id !== null && payload.faculty_id !== undefined)
        params.append("faculty_id", String(payload.faculty_id));

      console.log("[Timetable] PATCH ->", url);
      console.log("[Timetable] payload:", Object.fromEntries(params));

      const res = await axios.patch(url, params.toString(), {
        withCredentials: true,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return res;
    };

    try {
      const res = await tryPatch(payload.id); // <-- use slot id
      toast.success("Timetable entry updated successfully.");
      if (selectedClassId) await fetchClassTimetable(selectedClassId);
      if (selectedFacultyId) await fetchFacultyTimetable(selectedFacultyId);
      setIsEditOpen(false);
      setEditingEntry(null);
      return res.data;
    } catch (err: any) {
      // fallback: if backend responds 404 for slot id, try with period_id
      if (err?.response?.status === 404 && payload.period_id) {
        try {
          console.warn(
            "PATCH by slot id returned 404 — retrying with period_id..."
          );
          const res2 = await tryPatch(payload.period_id);
          toast.success("Timetable entry updated (using period_id).");
          if (selectedClassId) await fetchClassTimetable(selectedClassId);
          if (selectedFacultyId) await fetchFacultyTimetable(selectedFacultyId);
          setIsEditOpen(false);
          setEditingEntry(null);
          return res2.data;
        } catch (err2: any) {
          toast.error(
            err2?.response?.data?.error || "Failed to update timetable entry."
          );
          return null;
        }
      }

      toast.error(
        err?.response?.data?.error || "Failed to update timetable entry."
      );
      return null;
    }
  };

  const handleDeleteSlot = async (id: number, fallbackPeriodId?: number) => {
    const tryDelete = async (targetId: number | string) => {
      const url = `${API_URL}/add_slot/${targetId}`;
      console.log("[Timetable] DELETE ->", url);
      try {
        const res = await axios.delete(url, {
          withCredentials: true,
          timeout: 15000,
        });
        console.log("[Timetable] DELETE success:", res.status, res.data);
        return res;
      } catch (err: any) {
        console.error("[Timetable] DELETE failed:", err);
        if (err?.response) {
          console.error(
            "[Timetable] err.response.status:",
            err.response.status
          );
          console.error("[Timetable] err.response.data:", err.response.data);
        } else {
          console.error(
            "[Timetable] No response from server — possible Network/CORS."
          );
        }
        throw err;
      }
    };

    try {
      await tryDelete(id);
      toast.success("Timetable entry deleted successfully.");
      if (selectedClassId) await fetchClassTimetable(selectedClassId);
      if (selectedFacultyId) await fetchFacultyTimetable(selectedFacultyId);
      setIsDeleteOpen(false);
      setDeletingEntryId(null);
    } catch (err: any) {
      if (err?.response?.status === 404 && fallbackPeriodId) {
        try {
          console.warn(
            "[Timetable] DELETE by id returned 404 — retrying with period_id..."
          );
          await tryDelete(fallbackPeriodId);
          toast.success(
            "Timetable entry deleted successfully (using period_id)."
          );
          if (selectedClassId) await fetchClassTimetable(selectedClassId);
          if (selectedFacultyId) await fetchFacultyTimetable(selectedFacultyId);
          setIsDeleteOpen(false);
          setDeletingEntryId(null);
          return;
        } catch (err2: any) {
          const backendMsg =
            err2?.response?.data?.error || err2?.response?.data?.message;
          toast.error(backendMsg || "Failed to delete timetable entry.");
          return;
        }
      }
      const backendMsg =
        err?.response?.data?.error || err?.response?.data?.message;
      toast.error(backendMsg || "Failed to delete timetable entry.");
    }
  };

  const handleCellEdit = (meta: any) => {
    console.log("[Timetable] handleCellEdit meta:", meta);

    // Prefer timetable_id, fall back to id if present
    const slotId = meta?.timetable_id ?? meta?.id ?? null;
    if (!slotId) {
      console.error(
        "[Timetable] Cannot edit: timetable_id not found in meta",
        meta
      );
      toast.error("Unable to determine slot id for editing.");
      return;
    }

    const periodId = meta?.period_id ?? meta?.period_number ?? 0;
    const classId =
      meta?.class_id ?? (selectedClassId ? Number(selectedClassId) : 0);

    setEditingEntry({
      id: Number(slotId), // <- this will be used for /add_slot/:timetable_id
      period_id: Number(periodId),
      class_id: Number(classId),
      subject_id: meta?.subject_id ?? undefined,
      faculty_id: meta?.faculty_id ?? undefined,
      day: meta?.day,
      period_number: meta?.period_number,
    });

    setIsEditOpen(true);
  };

  const handleCellDelete = (meta: any) => {
    const id = meta?.id ?? meta?.period_id ?? null;
    if (!id) {
      toast.error("Can't determine entry id to delete.");
      return;
    }
    setDeletingEntryId(Number(id));
    // keep editingEntry.period_id available as fallback if present
    setIsDeleteOpen(true);
  };

  if (isInitialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timetable Viewer</CardTitle>
          <CardDescription>
            View the weekly schedule for a specific class or teacher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading initial data..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetable Viewer</CardTitle>
        <CardDescription>
          View the weekly schedule for a specific class or teacher. You can
          update or delete timetable slots directly from the edit dialog.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="class-wise">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="class-wise">Class-wise</TabsTrigger>
            <TabsTrigger value="teacher-wise">Teacher-wise</TabsTrigger>
          </TabsList>

          <TabsContent value="class-wise" className="mt-0 pt-4">
            <div className="mb-4">
              <Label htmlFor="class-select">Select Class</Label>
              <Select
                onValueChange={(v) => setSelectedClassId(v || null)}
                disabled={classes.length === 0}
              >
                <SelectTrigger
                  id="class-select"
                  className="w-full md:w-[280px] mt-1"
                >
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={String(c.id)}
                      >{`${c.standard} - ${c.division}`}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-center text-muted-foreground">
                      No classes found.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {isClassLoading && <LoadingSpinner text="Loading timetable..." />}
            {classError && (
              <p className="text-center text-red-500 py-10">{classError}</p>
            )}

            {!isClassLoading &&
              !classError &&
              selectedClassId &&
              classPeriods.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  No schedule has been created for this class yet.
                </p>
              )}

            {!isClassLoading && !classError && selectedClassId && (
              <TimetableDisplay
                timetable={classTimetable}
                periods={classPeriods}
                onEdit={handleCellEdit}
                onDelete={handleCellDelete}
              />
            )}

            {!selectedClassId && !isClassLoading && !classError && (
              <p className="text-center text-muted-foreground py-10">
                Please select a class to view its timetable.
              </p>
            )}
          </TabsContent>

          <TabsContent value="teacher-wise" className="mt-0 pt-4">
            <div className="mb-4">
              <Label htmlFor="teacher-select">Select Teacher</Label>
              <Select
                onValueChange={(v) => setSelectedFacultyId(v || null)}
                disabled={faculty.length === 0}
              >
                <SelectTrigger
                  id="teacher-select"
                  className="w-full md:w-[280px] mt-1"
                >
                  <SelectValue placeholder="Choose a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {faculty.length > 0 ? (
                    faculty.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.f_name} {f.l_name ?? ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-center text-muted-foreground">
                      No faculty found.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {isFacultyLoading && <LoadingSpinner text="Loading schedule..." />}
            {facultyError && (
              <p className="text-center text-red-500 py-10">{facultyError}</p>
            )}

            {!isFacultyLoading &&
              !facultyError &&
              selectedFacultyId &&
              facultyPeriods.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  No schedule has been created for this teacher yet.
                </p>
              )}

            {!isFacultyLoading && !facultyError && selectedFacultyId && (
              <TimetableDisplay
                timetable={facultyTimetable}
                periods={facultyPeriods}
                onEdit={handleCellEdit}
                onDelete={handleCellDelete}
              />
            )}

            {!selectedFacultyId && !isFacultyLoading && !facultyError && (
              <p className="text-center text-muted-foreground py-10">
                Please select a teacher to view their schedule.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => !open && setIsEditOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timetable Slot</DialogTitle>
          </DialogHeader>

          {editingEntry ? (
            <div className="space-y-4 py-2">
              <div>
                <Label>Period (numeric)</Label>
                <Input
                  type="number"
                  value={editingEntry.period_id}
                  onChange={(e) =>
                    setEditingEntry((prev) =>
                      prev
                        ? { ...prev, period_id: Number(e.target.value) }
                        : prev
                    )
                  }
                />
              </div>

              <div>
                <Label>Class</Label>
                <Select
                  value={String(editingEntry.class_id)}
                  onValueChange={(v) =>
                    setEditingEntry((prev) =>
                      prev ? { ...prev, class_id: Number(v) } : prev
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.standard} - {c.division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subject</Label>
                <Select
                  value={
                    editingEntry.subject_id
                      ? String(editingEntry.subject_id)
                      : ""
                  }
                  onValueChange={(v) =>
                    setEditingEntry((prev) =>
                      prev ? { ...prev, subject_id: Number(v) } : prev
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Faculty</Label>
                <Select
                  value={
                    editingEntry.faculty_id
                      ? String(editingEntry.faculty_id)
                      : ""
                  }
                  onValueChange={(v) =>
                    setEditingEntry((prev) =>
                      prev ? { ...prev, faculty_id: Number(v) } : prev
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.f_name} {f.l_name ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingEntry(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!editingEntry) return; // TS + runtime safety

                    await handleUpdateSlot({
                      id: editingEntry.id, // timetable_id used in the URL
                      period_id: editingEntry.period_id,
                      class_id: editingEntry.class_id, // required by backend
                      subject_id: editingEntry.subject_id ?? null,
                      faculty_id: editingEntry.faculty_id ?? null,
                    });
                  }}
                >
                  Save changes
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!editingEntry) return;
                    setDeletingEntryId(editingEntry.id); // timetable_id
                    setIsDeleteOpen(true);
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8">
              <LoadingSpinner text="Preparing editor..." />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => !open && setIsDeleteOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timetable Entry</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteOpen(false);
                setDeletingEntryId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const primary = deletingEntryId ?? editingEntry?.id;
                if (!primary) {
                  toast.error("Nothing to delete.");
                  return;
                }
                const fallback = editingEntry?.period_id ?? undefined;
                await handleDeleteSlot(primary, fallback); // handleDeleteSlot should try primary then fallback
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
