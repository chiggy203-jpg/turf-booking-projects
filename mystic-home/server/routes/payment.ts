import { RequestHandler } from "express";
import crypto from "crypto";
import { getUserByToken } from "./auth";

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

// In-memory payment records
const payments = new Map<
  string,
  {
    id: string;
    orderId: string;
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    status: "pending" | "completed" | "failed";
    paymentMethod: "upi" | "card";
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    createdAt: string;
  }
>();

export const handleCreateOrder: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { bookingId, amount, currency = "INR" } = req.body;

  if (!bookingId || !amount) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    res.status(500).json({
      message:
        "Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
    });
    return;
  }

  const paymentId = `payment_${Date.now()}`;

  // Create payment record
  const payment = {
    id: paymentId,
    orderId: `order_${Date.now()}`,
    bookingId,
    userId: user.id,
    amount: Math.round(amount * 100), // Convert to paise (Razorpay format)
    currency,
    status: "pending" as const,
    paymentMethod: "upi" as const,
    createdAt: new Date().toISOString(),
  };

  payments.set(paymentId, payment);

  // Return order details for Razorpay
  res.json({
    paymentId,
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    razorpayKeyId: RAZORPAY_KEY_ID,
  });
};

export const handleVerifyPayment: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    req.body;

  if (!paymentId || !razorpayOrderId || !razorpayPaymentId) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  const payment = payments.get(paymentId);

  if (!payment) {
    res.status(404).json({ message: "Payment not found" });
    return;
  }

  if (payment.userId !== user.id) {
    res.status(403).json({ message: "Unauthorized payment verification" });
    return;
  }

  // Verify signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    res.status(400).json({ message: "Invalid payment signature" });
    return;
  }

  // Update payment status
  payment.status = "completed";
  payment.razorpayOrderId = razorpayOrderId;
  payment.razorpayPaymentId = razorpayPaymentId;

  res.json({
    message: "Payment verified successfully",
    payment,
  });
};

export const handleGetPaymentStatus: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { paymentId } = req.params;
  const payment = payments.get(paymentId);

  if (!payment) {
    res.status(404).json({ message: "Payment not found" });
    return;
  }

  if (payment.userId !== user.id) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  res.json(payment);
};

export const handleGetPaymentByBooking: RequestHandler = (req, res) => {
  const user = getUserByToken(req.headers.authorization);

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { bookingId } = req.params;

  const payment = Array.from(payments.values()).find(
    (p) => p.bookingId === bookingId && p.userId === user.id
  );

  if (!payment) {
    res.status(404).json({ message: "Payment not found" });
    return;
  }

  res.json(payment);
};

export { payments };
