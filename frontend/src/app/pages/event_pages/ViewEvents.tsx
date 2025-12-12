"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Event {
  id: number;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  description: string;
  class_id?: number;
  standard?: string;
  division?: string;
}

// ✨ Beautiful Animated Event Card ✨
function EventCard({ event }: { event: Event }) {
  const date = new Date(event.event_time);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-md hover:shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 transition-all duration-300">
        {/* Subtle gradient accent bar on top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {event.title}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            {dateStr} • {timeStr} — {event.location}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-1">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {event.description}
          </p>

          {(event.standard || event.division) && (
            <div className="mt-3 inline-block rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-3 py-1">
              Class: {event.standard ?? "N/A"}
              {event.division ? ` - ${event.division}` : ""}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ViewEvents() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event`, {
          withCredentials: true,
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event?filter=past`, {
          withCredentials: true,
        }),
      ]);
      setUpcomingEvents(upcomingRes.data || []);
      setPastEvents(pastRes.data || []);
    } catch (error) {
      toast.error("Failed to fetch events.");
      console.error("Fetch Events Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-center text-muted-foreground animate-pulse">
          Loading events...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 p-4 md:p-6 lg:p-8">
      {/* 🌟 Upcoming Events */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            🎉 Upcoming Events
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Don&apos;t miss out on these exciting upcoming events!
          </p>
        </div>

        {upcomingEvents.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        ) : (
          <p className="text-center text-slate-500 py-8">
            No upcoming events scheduled.
          </p>
        )}
      </section>

      {/* 🕰️ Past Events */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            🕰️ Past Events
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            A look back at our memorable past events.
          </p>
        </div>

        {pastEvents.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            {pastEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0.6 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-center text-slate-500 py-8">
            No past events found.
          </p>
        )}
      </section>
    </div>
  );
}
