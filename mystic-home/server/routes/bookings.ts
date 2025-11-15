import { RequestHandler } from "express";
import { getUserByToken } from "./auth";
import { markSlotsAsBooked, markSlotsAsAvailable } from "./slots";

interface Booking {
  id: string;
  userId: string;
  turfId: string;
  turfName: string;
  date: string;
  slots: string[];
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled";
  paymentStatus: "pending" | "completed" | "refunded";
  createdAt: string;
}

// In-memory bookings database
const bookings = new Map<string, Booking>();

export const handleCreateBooking: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { turfId, turfName, date, slots: slotIds, totalPrice } = req.body;

  if (!turfId || !date || !slotIds || !totalPrice) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  const bookingId = `booking_${Date.now()}`;

  // Mark slots as booked
  markSlotsAsBooked(slotIds);

  const newBooking: Booking = {
    id: bookingId,
    userId: user.id,
    turfId,
    turfName,
    date,
    slots: slotIds,
    totalPrice,
    status: "confirmed",
    paymentStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  bookings.set(bookingId, newBooking);

  res.status(201).json(newBooking);
};

export const handleGetMyBookings: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const userBookings = Array.from(bookings.values()).filter(
    (booking) => booking.userId === user.id
  );

  res.json(userBookings);
};

export const handleGetAllBookings: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can view all bookings" });
    return;
  }

  const allBookings = Array.from(bookings.values());

  res.json(allBookings);
};

export const handleGetBookingById: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  const { bookingId } = req.params;

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const booking = bookings.get(bookingId);

  if (!booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  // Check if user owns the booking or is admin
  if (booking.userId !== user.id && user.role !== "admin") {
    res.status(403).json({ message: "You don't have access to this booking" });
    return;
  }

  res.json(booking);
};

export const handleCancelBooking: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  const { bookingId } = req.params;

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const booking = bookings.get(bookingId);

  if (!booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  if (booking.userId !== user.id && user.role !== "admin") {
    res.status(403).json({ message: "You don't have access to this booking" });
    return;
  }

  if (booking.status === "cancelled") {
    res.status(400).json({ message: "Booking is already cancelled" });
    return;
  }

  // Mark slots as available
  markSlotsAsAvailable(booking.slots);

  booking.status = "cancelled";
  booking.paymentStatus = "refunded";

  res.json({ message: "Booking cancelled successfully", booking });
};

export const handleUpdateBookingStatus: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);
  const { bookingId } = req.params;
  const { status, paymentStatus } = req.body;

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Only admins can update booking status" });
    return;
  }

  const booking = bookings.get(bookingId);

  if (!booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  if (status) booking.status = status;
  if (paymentStatus) booking.paymentStatus = paymentStatus;

  res.json(booking);
};

export { bookings };
