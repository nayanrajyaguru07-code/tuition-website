"use client"; // Required to use React hooks like useState

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // Import the loader icon

// Define a type for the period data for better type safety
interface Period {
  id: number;
  day: string;
  period_number: string;
  start_time: string;
  end_time: string;
}

export function AssignPeriods() {
  const [periodName, setPeriodName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [day, setDay] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for button loading
  const [isLoading, setIsLoading] = useState(true); // State for table loading

  // --- Function to fetch the list of periods ---
  const fetchPeriods = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/add_slot/form-data`,
        {
          withCredentials: true,
        }
      );
      setPeriods(response.data.periods || []);
    } catch (error) {
      console.error("Error fetching periods:", error);
      toast.error("Could not fetch the period list.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- useEffect to run fetchPeriods when the component first loads ---
  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleAddPeriod = async () => {
    if (!day || !periodName.trim() || !startTime || !endTime) {
      toast.error("Please fill out all fields.");
      return;
    }
    setIsSubmitting(true); // Start loading
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/add_period`,
        {
          day,
          period_number: periodName,
          start_time: startTime,
          end_time: endTime,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success("Period added successfully!");
      setDay("");
      setPeriodName("");
      setStartTime("");
      setEndTime("");
      fetchPeriods(); // Re-fetch the periods to update the table
    } catch (error) {
      console.error("Error adding period:", error);
      toast.error("Failed to add period. Please try again.");
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Assign Periods</CardTitle>
          <CardDescription>
            Define the time slots for school periods for each day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="day">Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Select a day..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period-name">Period Number</Label>
              <Input
                id="period-name"
                placeholder="e.g., 1"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAddPeriod} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Adding..." : "Add Period"}
          </Button>

          {/* Styled Table to Display Existing Periods */}
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-2">Existing Periods</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-muted/50">Day</TableHead>
                    <TableHead className="w-[150px] bg-muted/50">
                      Period Number
                    </TableHead>
                    <TableHead className="bg-muted/50">Start Time</TableHead>
                    <TableHead className="bg-muted/50">End Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        Loading periods...
                      </TableCell>
                    </TableRow>
                  ) : periods.length > 0 ? (
                    periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="font-medium">
                          {period.day}
                        </TableCell>
                        <TableCell>{period.period_number}</TableCell>
                        <TableCell>{period.start_time}</TableCell>
                        <TableCell>{period.end_time}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No periods found. Add one above to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
