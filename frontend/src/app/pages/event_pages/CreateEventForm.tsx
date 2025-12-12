"use client";

import { useState, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns"; // Import isValid
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Calendar as CalendarIcon,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Data Types ---
interface Event {
  id: number;
  title: string;
  event_date: string; // ISO string format from API
  event_time: string; // This is a FULL TIMESTAMP string
  location: string;
  description: string;
  class_id?: number; // --- NEW: Added class_id ---
}

interface Class {
  id: number;
  standard: string;
  division: string;
}

// --- Edit Event Form Component ---
const EditEventFormDialog = ({
  event,
  onSave,
  classes, // --- NEW: Receive classes prop ---
}: {
  event: Event;
  onSave: () => void;
  classes: Class[]; // --- NEW: Prop type ---
}) => {
  // --- FIX: Use event_time as the single source of truth for date/time ---
  const initialDate =
    event.event_time && isValid(parseISO(event.event_time))
      ? format(parseISO(event.event_time), "yyyy-MM-dd")
      : "";

  const initialTime =
    event.event_time && isValid(parseISO(event.event_time))
      ? format(parseISO(event.event_time), "HH:mm")
      : "";
  // --- END FIX ---

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [location, setLocation] = useState(event.location);
  const [description, setDescription] = useState(event.description);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // --- NEW: State for selected class ---
  const [selectedClassId, setSelectedClassId] = useState<string>(
    event.class_id ? String(event.class_id) : ""
  );
  // --- END NEW ---

  const handleUpdate = async () => {
    setIsSaving(true);
    const params = new URLSearchParams();
    params.append("title", title);
    params.append("event_date", date);
    const fullTimestamp = `${date} ${time}`;
    params.append("event_time", fullTimestamp);
    params.append("location", location);
    params.append("description", description);
    params.append("class_id", selectedClassId); // --- NEW: Send class_id ---

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/event/${event.id}`,
        params,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true,
        }
      );
      toast.success("Event updated successfully!");
      onSave();
      setIsOpen(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to update event.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          {/* --- NEW: Grid for Location and Class --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-event-class">Class</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger id="edit-event-class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.standard} {cls.division}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading classes...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* --- END NEW --- */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpdate} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Component (Only change is passing props) ---
export function CreateEventForm() {
  // State for form inputs
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // State for data and loading
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --- CRUD Functions ---

  const fetchClasses = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`,
        {
          withCredentials: true,
        }
      );

      setClasses(res.data.classes || []);
    } catch (error) {
      console.log("Failed to fetch classes:", error);
      toast.error("Failed to fetch classes.");
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const [upcomingRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event`, {
          withCredentials: true,
        }),
      ]);
      console.log(upcomingRes.data);

      setUpcomingEvents(upcomingRes.data || []);
      console.log(upcomingRes.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchClasses();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !title ||
      !date ||
      !time ||
      !location ||
      !description ||
      !selectedClassId
    ) {
      toast.error("Please fill out all fields, including the class.");
      return;
    }
    setIsSubmitting(true);

    const formattedDate = format(date, "yyyy-MM-dd");
    const fullTimestamp = `${formattedDate} ${time}`;

    const params = new URLSearchParams();
    params.append("title", title);
    params.append("event_date", formattedDate);
    params.append("event_time", fullTimestamp);
    params.append("location", location);
    params.append("description", description);
    params.append("class_id", selectedClassId);

    try {
      // --- FIX 1: Post to the correct route ---
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/event`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true,
      });
      // --- END FIX 1 ---

      toast.success("Slot created successfully!");
      setTitle("");
      setDate(undefined);
      setTime("");
      setLocation("");
      setDescription("");
      setSelectedClassId("");
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    setDeletingId(eventId);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/event/${eventId}`,
        {
          withCredentials: true,
        }
      );
      toast.success("Event deleted successfully.");
      fetchEvents();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Slot</CardTitle>
          <CardDescription>
            Fill in the details below to schedule a new slot for a class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Physics Lab Session"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="event-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-location">Location / Venue</Label>
                <Input
                  id="event-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Room 10B"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-class">Class</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger id="event-class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={String(cls.id)}>
                          {cls.standard} {cls.division}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading classes...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief description of the slot..."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Saving..." : "Save Slot"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Upcoming Events Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events/Slots</CardTitle>
          <CardDescription>
            Manage your scheduled upcoming items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  let parsedDate = null;
                  let isValidDate = false;

                  if (event.event_time) {
                    try {
                      parsedDate = parseISO(event.event_time);
                      isValidDate = isValid(parsedDate);
                    } catch (e) {
                      console.error("Failed to parse date:", e);
                      isValidDate = false;
                    }
                  }

                  return (
                    <TableRow key={event.id}>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>
                        {isValidDate ? (
                          <>
                            {format(parsedDate!, "PPP")} at{" "}
                            {format(parsedDate!, "p")}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Invalid date
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {/* --- NEW: Pass classes prop --- */}
                              <EditEventFormDialog
                                event={event}
                                onSave={fetchEvents}
                                classes={classes}
                              />
                              {/* --- END NEW --- */}
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the event &quot;
                                {event.title}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(event.id)}
                                disabled={deletingId === event.id}
                              >
                                {deletingId === event.id && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {deletingId === event.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No upcoming events scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
