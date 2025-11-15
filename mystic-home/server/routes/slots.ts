import { RequestHandler } from "express";
import { turfs } from "./turfs";

interface Slot {
  id: string;
  turfId: string;
  date: string;
  time: string;
  available: boolean;
  price: number;
}

// In-memory slots database
const slots = new Map<string, Slot>();

// Initialize with sample slots
const initializeSlots = () => {
  const today = new Date();
  const times = [
    "6:00 AM - 7:00 AM",
    "7:00 AM - 8:00 AM",
    "8:00 AM - 9:00 AM",
    "5:00 PM - 6:00 PM",
    "6:00 PM - 7:00 PM",
    "7:00 PM - 8:00 PM",
    "8:00 PM - 9:00 PM",
    "9:00 PM - 10:00 PM",
  ];

  for (let daysAhead = 0; daysAhead < 30; daysAhead++) {
    const date = new Date(today);
    date.setDate(date.getDate() + daysAhead);
    const dateStr = date.toISOString().split("T")[0];

    for (const [turfId, turf] of turfs.entries()) {
      times.forEach((time, index) => {
        const slotId = `slot_${turfId}_${dateStr}_${index}`;
        slots.set(slotId, {
          id: slotId,
          turfId,
          date: dateStr,
          time,
          available: Math.random() > 0.3, // 70% slots available
          price: turf.price,
        });
      });
    }
  }
};

// Initialize slots on module load
initializeSlots();

export const handleGetSlots: RequestHandler = (req, res) => {
  const { turfId, date } = req.query;

  if (!turfId || !date) {
    res.status(400).json({ message: "turfId and date are required" });
    return;
  }

  const slotsList = Array.from(slots.values()).filter(
    (slot) => slot.turfId === turfId && slot.date === date
  );

  res.json(slotsList);
};

export const handleGetSlotById: RequestHandler = (req, res) => {
  const { slotId } = req.params;
  const slot = slots.get(slotId);

  if (!slot) {
    res.status(404).json({ message: "Slot not found" });
    return;
  }

  res.json(slot);
};

// Helper function to mark slots as booked
export const markSlotsAsBooked = (slotIds: string[]): boolean => {
  try {
    slotIds.forEach((slotId) => {
      const slot = slots.get(slotId);
      if (slot) {
        slot.available = false;
      }
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to mark slots as available (for cancellation)
export const markSlotsAsAvailable = (slotIds: string[]): boolean => {
  try {
    slotIds.forEach((slotId) => {
      const slot = slots.get(slotId);
      if (slot) {
        slot.available = true;
      }
    });
    return true;
  } catch (error) {
    return false;
  }
};

export { slots };
