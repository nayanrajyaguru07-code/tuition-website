"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import toast from "react-hot-toast";
import { 
  Plus, 
  Trash2, 
  DoorOpen, 
  Users, 
  LayoutGrid, 
  DollarSign,
  Briefcase
} from "lucide-react";

export default function RoomManager() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "add">("list");
  const [formData, setFormData] = useState({
    roomNumber: "",
    type: "Double",
    capacity: "2",
    price: "0"
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/room/all-rooms");
      setRooms(res.data.rooms);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("/api/room/add-room", formData);
      toast.success("Room added successfully");
      setFormData({ roomNumber: "", type: "Double", capacity: "2", price: "0" });
      setTab("list");
      fetchRooms();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add room");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await API.delete(`/api/room/delete-room/${id}`);
      toast.success("Room deleted successfully");
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete room");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Room Management</h1>
              <p className="text-orange-50 mt-1 font-medium opacity-90">Manage hostel inventory and availability</p>
            </div>
            <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20">
              <button
                onClick={() => setTab("list")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === "list" ? "bg-white text-orange-600 shadow-lg" : "text-white hover:bg-white/10"
                }`}
              >
                <LayoutGrid size={18} />
                Room List
              </button>
              <button
                onClick={() => setTab("add")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  tab === "add" ? "bg-white text-orange-600 shadow-lg" : "text-white hover:bg-white/10"
                }`}
              >
                <Plus size={18} />
                Add Room
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8">
          {tab === "list" ? (
            loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <DoorOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">No Rooms Found</h3>
                <p className="text-gray-500 mt-2">Start by adding your first room to the hostel.</p>
                <button 
                  onClick={() => setTab("add")}
                  className="mt-6 px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all"
                >
                  Create Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="group bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <DoorOpen size={28} />
                      </div>
                      <button 
                        onClick={() => handleDelete(room.id)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900">Room {room.roomNumber}</h3>
                    <p className="text-gray-500 text-sm font-medium mb-4">{room.type}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users size={16} />
                          <span className="text-sm font-semibold">Occupancy</span>
                        </div>
                        <span className={`text-sm font-bold ${room._count.students >= room.capacity ? 'text-red-500' : 'text-green-600'}`}>
                          {room._count.students} / {room.capacity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign size={16} />
                          <span className="text-sm font-semibold">Base Price</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">₹{room.price}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                        <span>Fill Level</span>
                        <span>{Math.round((room._count.students / room.capacity) * 100)}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            room._count.students >= room.capacity ? 'bg-red-500' : 'bg-orange-600'
                          }`}
                          style={{ width: `${(room._count.students / room.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="max-w-2xl mx-auto py-10">
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Room Number</label>
                    <input
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium"
                      placeholder="e.g., 101"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Room Type</label>
                    <select
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium appearance-none"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Single">Single Seater</option>
                      <option value="Double">Double Seater</option>
                      <option value="Triple">Triple Seater</option>
                      <option value="Dormitory">Dormitory</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Capacity</label>
                    <input
                      type="number"
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium"
                      placeholder="e.g., 2"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Price per Month (₹)</label>
                    <input
                      type="number"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium"
                      placeholder="e.g., 5000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-95 transition-all mt-10"
                >
                  Create New Room
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
