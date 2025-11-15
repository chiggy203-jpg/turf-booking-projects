import { RequestHandler } from "express";
import { getUserByToken, users } from "./auth";
import { bookings } from "./bookings";
import { turfs } from "./turfs";

export const handleGetStats: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can view stats" });
    return;
  }

  const totalBookings = bookings.size;
  const totalRevenue = Array.from(bookings.values()).reduce(
    (sum, booking) => sum + (booking.paymentStatus === "completed" ? booking.totalPrice : 0),
    0
  );
  const totalTurfs = turfs.size;
  const totalUsers = Array.from(users.values()).filter(u => u.role === "user").length;

  res.json({
    totalBookings,
    totalRevenue,
    totalTurfs,
    totalUsers,
  });
};

export const handleGetAdminTurfs: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can view turfs" });
    return;
  }

  const turfsList = Array.from(turfs.values());

  res.json(turfsList);
};

export const handleCreateAdminTurf: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can create turfs" });
    return;
  }

  const { name, location, price, amenities } = req.body;

  if (!name || !location || !price) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  const turfId = `turf_${Date.now()}`;

  const newTurf = {
    id: turfId,
    name,
    location,
    price: Number(price),
    rating: 4.5,
    amenities: amenities || [],
  };

  turfs.set(turfId, newTurf);

  res.status(201).json(newTurf);
};

export const handleUpdateAdminTurf: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can update turfs" });
    return;
  }

  const { turfId } = req.params;
  const turf = turfs.get(turfId);

  if (!turf) {
    res.status(404).json({ message: "Turf not found" });
    return;
  }

  const { name, location, price, amenities } = req.body;

  const updatedTurf = {
    ...turf,
    name: name || turf.name,
    location: location || turf.location,
    price: price ? Number(price) : turf.price,
    amenities: amenities || turf.amenities,
  };

  turfs.set(turfId, updatedTurf);

  res.json(updatedTurf);
};

export const handleDeleteAdminTurf: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can delete turfs" });
    return;
  }

  const { turfId } = req.params;
  const deleted = turfs.delete(turfId);

  if (!deleted) {
    res.status(404).json({ message: "Turf not found" });
    return;
  }

  res.json({ message: "Turf deleted successfully" });
};

export const handleGetAdminBookings: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can view all bookings" });
    return;
  }

  const allBookings = Array.from(bookings.values());

  res.json(allBookings);
};
