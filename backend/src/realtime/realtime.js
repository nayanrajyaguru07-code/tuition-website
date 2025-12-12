// src/realtime/realtime.js
const { Server } = require("socket.io");
const db = require("../db");

module.exports = function initRealtime(httpServer, opts = {}) {
  const io = new Server(httpServer, {
    cors: {
      origin: opts.corsOrigins || ["http://localhost:3000"],
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  const socketRooms = new Map();

  io.on("connection", (socket) => {
    console.log("Realtime connected:", socket.id);

    socket.on("join-room", async (payload = {}) => {
      try {
        const room = payload.room;
        if (!room) return;

        socket.join(room);
        const rooms = socketRooms.get(socket.id) || new Set();
        rooms.add(room);
        socketRooms.set(socket.id, rooms);

        // optional: persist participant (non-blocking)
        try {
          const meetingRes = await db.query(
            `SELECT id FROM meetings WHERE slug = $1`,
            [room]
          );
          if (meetingRes.rows[0]) {
            const meetingId = meetingRes.rows[0].id;
            await db.query(
              `INSERT INTO meeting_participants (meeting_id, user_id, display_name) VALUES ($1,$2,$3)`,
              [meetingId, payload.userId || null, payload.displayName || null]
            );
          }
        } catch (e) {
          console.warn("participant db save failed", e.message);
        }

        socket.to(room).emit("user-joined", {
          socketId: socket.id,
          userId: payload.userId || null,
          displayName: payload.displayName || null,
        });

        const clients = await io.in(room).allSockets();
        socket.emit("room-members", { members: Array.from(clients) });
      } catch (err) {
        console.error("join-room error", err);
      }
    });

    socket.on("signal", (data = {}) => {
      if (!data.to) return;
      io.to(data.to).emit("signal", data);
    });

    socket.on("leave-room", (payload = {}) => {
      const room = payload.room;
      socket.leave(room);
      const rooms = socketRooms.get(socket.id);
      if (rooms) {
        rooms.delete(room);
        if (rooms.size === 0) socketRooms.delete(socket.id);
      }
      socket.to(room).emit("user-left", { socketId: socket.id });
    });

    socket.on("disconnect", () => {
      const rooms = socketRooms.get(socket.id) || [];
      for (const r of rooms) {
        socket.to(r).emit("user-left", { socketId: socket.id });
      }
      socketRooms.delete(socket.id);
      console.log("Realtime disconnected:", socket.id);
    });
  });

  return io;
};
