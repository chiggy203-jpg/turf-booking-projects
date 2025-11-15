import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleRegister,
  handleLogin,
  handleGetMe,
} from "./routes/auth";
import {
  handleGetTurfs,
  handleGetTurfById,
  handleCreateTurf,
  handleUpdateTurf,
  handleDeleteTurf,
} from "./routes/turfs";
import { handleGetSlots, handleGetSlotById } from "./routes/slots";
import {
  handleCreateBooking,
  handleGetMyBookings,
  handleGetAllBookings,
  handleGetBookingById,
  handleCancelBooking,
  handleUpdateBookingStatus,
} from "./routes/bookings";
import {
  handleGetStats,
  handleGetAdminTurfs,
  handleCreateAdminTurf,
  handleUpdateAdminTurf,
  handleDeleteAdminTurf,
  handleGetAdminBookings,
} from "./routes/admin";
import {
  handleCreateOrder,
  handleVerifyPayment,
  handleGetPaymentStatus,
  handleGetPaymentByBooking,
} from "./routes/payment";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Error handling middleware for body parsing
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ message: "Invalid JSON in request body" });
        return;
      }
      next(err);
    }
  );

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", handleGetMe);

  // Turfs routes
  app.get("/api/turfs", handleGetTurfs);
  app.get("/api/turfs/:turfId", handleGetTurfById);
  app.post("/api/turfs", handleCreateTurf);
  app.put("/api/turfs/:turfId", handleUpdateTurf);
  app.delete("/api/turfs/:turfId", handleDeleteTurf);

  // Slots routes
  app.get("/api/slots", handleGetSlots);
  app.get("/api/slots/:slotId", handleGetSlotById);

  // Bookings routes
  app.post("/api/bookings", handleCreateBooking);
  app.get("/api/bookings/my-bookings", handleGetMyBookings);
  app.get("/api/bookings/all", handleGetAllBookings);
  app.get("/api/bookings/:bookingId", handleGetBookingById);
  app.delete("/api/bookings/:bookingId", handleCancelBooking);
  app.put("/api/bookings/:bookingId/status", handleUpdateBookingStatus);

  // Admin routes
  app.get("/api/admin/stats", handleGetStats);
  app.get("/api/admin/turfs", handleGetAdminTurfs);
  app.post("/api/admin/turfs", handleCreateAdminTurf);
  app.put("/api/admin/turfs/:turfId", handleUpdateAdminTurf);
  app.delete("/api/admin/turfs/:turfId", handleDeleteAdminTurf);
  app.get("/api/admin/bookings", handleGetAdminBookings);

  // Payment routes
  app.post("/api/payments/create-order", handleCreateOrder);
  app.post("/api/payments/verify", handleVerifyPayment);
  app.get("/api/payments/:paymentId", handleGetPaymentStatus);
  app.get("/api/payments/booking/:bookingId", handleGetPaymentByBooking);

  // Global error handler
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("Server error:", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Internal server error" });
    }
  );

  return app;
}
