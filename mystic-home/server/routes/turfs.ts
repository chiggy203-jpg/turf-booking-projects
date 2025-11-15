import { RequestHandler } from "express";
import { getUserByToken } from "./auth";

interface Turf {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  amenities: string[];
}

// In-memory turf database
const turfs = new Map<string, Turf>();

// Initialize with sample turfs
turfs.set("turf1", {
  id: "turf1",
  name: "Green Valley Turf",
  location: "Downtown, City Center",
  price: 500,
  rating: 4.5,
  amenities: ["Lights", "Parking", "Changing Room"],
});

turfs.set("turf2", {
  id: "turf2",
  name: "Premier Sports Ground",
  location: "Suburbs, North Area",
  price: 600,
  rating: 4.8,
  amenities: ["Lights", "Parking", "Changing Room", "Canteen"],
});

turfs.set("turf3", {
  id: "turf3",
  name: "Urban Turf Arena",
  location: "Business District",
  price: 700,
  rating: 4.2,
  amenities: ["Lights", "Parking", "Changing Room", "Gym Access"],
});

turfs.set("turf4", {
  id: "turf4",
  name: "Community Sports Park",
  location: "Residential Area",
  price: 400,
  rating: 4.0,
  amenities: ["Parking", "Changing Room"],
});

turfs.set("turf5", {
  id: "turf5",
  name: "Elite Sports Complex",
  location: "Premium Zone",
  price: 800,
  rating: 4.9,
  amenities: ["Lights", "Parking", "Changing Room", "Canteen", "Gym Access"],
});

export const handleGetTurfs: RequestHandler = (req, res) => {
  const turfList = Array.from(turfs.values());
  res.json(turfList);
};

export const handleGetTurfById: RequestHandler = (req, res) => {
  const { turfId } = req.params;
  const turf = turfs.get(turfId);

  if (!turf) {
    res.status(404).json({ message: "Turf not found" });
    return;
  }

  res.json(turf);
};

export const handleCreateTurf: RequestHandler = (req, res) => {
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

  const newTurf: Turf = {
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

export const handleUpdateTurf: RequestHandler = (req, res) => {
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

  const updatedTurf: Turf = {
    ...turf,
    name: name || turf.name,
    location: location || turf.location,
    price: price ? Number(price) : turf.price,
    amenities: amenities || turf.amenities,
  };

  turfs.set(turfId, updatedTurf);

  res.json(updatedTurf);
};

export const handleDeleteTurf: RequestHandler = (req, res) => {
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

export { turfs };
