import express from "express";
import Prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";

const roomRouter = express.Router();

// 1. ADD ROOM
roomRouter.post("/add-room", authMiddleware, async (req, res) => {
  try {
    const { roomNumber, type, capacity, price } = req.body;
    const hostelId = req.user.id;

    if (!roomNumber || !capacity) {
      return res.status(400).json({ message: "Room Number and Capacity are required" });
    }

    const newRoom = await Prisma.room.create({
      data: {
        roomNumber,
        type: type || "Standard",
        capacity: parseInt(capacity),
        price: parseFloat(price) || 0,
        hostelId,
      },
    });

    res.status(201).json({ message: "Room added successfully", room: newRoom });
  } catch (error) {
    console.error("Add Room Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. GET ALL ROOMS (for management)
roomRouter.get("/all-rooms", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;

    const rooms = await Prisma.room.findMany({
      where: { hostelId },
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Get All Rooms Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. GET AVAILABLE ROOMS (for dropdown)
roomRouter.get("/available-rooms", authMiddleware, async (req, res) => {
  try {
    const hostelId = req.user.id;

    const rooms = await Prisma.room.findMany({
      where: { hostelId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    // Filter rooms where count < capacity
    const availableRooms = rooms.filter((r) => r._count.students < r.capacity);

    res.status(200).json({ rooms: availableRooms });
  } catch (error) {
    console.error("Get Available Rooms Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 4. DELETE ROOM
roomRouter.delete("/delete-room/:id", authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const hostelId = req.user.id;

    const room = await Prisma.room.findFirst({
      where: { id: roomId, hostelId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found or unauthorized" });
    }

    // Optional: Check if room has students
    const studentCount = await Prisma.student.count({ where: { roomId } });
    if (studentCount > 0) {
      return res.status(400).json({ message: "Cannot delete room with allocated students" });
    }

    await Prisma.room.delete({ where: { id: roomId } });

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete Room Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default roomRouter;
