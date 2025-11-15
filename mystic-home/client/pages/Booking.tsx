import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Turf {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  amenities: string[];
}

interface Slot {
  id: string;
  turfId: string;
  time: string;
  available: boolean;
  price: number;
}

export default function Booking() {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<
    "turf" | "date" | "slots" | "payment"
  >("turf");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchTurfs();
  }, [navigate]);

  const fetchTurfs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/turfs");
      if (response.ok) {
        const data = await response.json();
        setTurfs(data);
      }
    } catch (error) {
      console.error("Error fetching turfs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedTurf || !selectedDate) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/slots?turfId=${selectedTurf.id}&date=${selectedDate}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTurfSelect = (turf: Turf) => {
    setSelectedTurf(turf);
    setBookingStep("date");
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleDateSubmit = () => {
    if (selectedDate) {
      fetchSlots();
      setBookingStep("slots");
    }
  };

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId],
    );
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0) {
      alert("Please select at least one slot");
      return;
    }

    if (!selectedTurf) {
      alert("No turf selected");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      console.log("Booking - Token check:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + "...",
      });

      if (!token) {
        alert("You need to login first");
        navigate("/login");
        return;
      }

      const totalPrice = selectedSlots.reduce((sum, slotId) => {
        const slot = slots.find((s) => s.id === slotId);
        return sum + (slot?.price || 0);
      }, 0);

      const bookingData = {
        turfId: selectedTurf.id,
        turfName: selectedTurf.name,
        date: selectedDate,
        slots: selectedSlots,
        totalPrice: totalPrice,
      };

      console.log("Sending booking request:", {
        ...bookingData,
        tokenExists: !!token,
      });

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      // Read response body only once
      let responseData = null;
      try {
        responseData = await response.json();
      } catch (parseErr) {
        console.error("Failed to parse response:", parseErr);
        responseData = null;
      }

      if (response.ok && responseData) {
        console.log("Booking created:", responseData);
        // Redirect to payment page
        navigate(
          `/payment?bookingId=${responseData.id}&amount=${totalPrice}&turfName=${encodeURIComponent(selectedTurf.name)}`,
        );
      } else {
        const errorMessage = String(
          responseData?.message ||
            `HTTP ${response.status} - ${response.statusText}`,
        );
        console.error("Failed to create booking:", errorMessage, {
          status: response.status,
          responseData,
        });
        alert(`Failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const totalPrice = selectedSlots.reduce((sum, slotId) => {
    const slot = slots.find((s) => s.id === slotId);
    return sum + (slot?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-primary">GreenField</div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-gray-700 hover:text-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Book Your Turf
        </h1>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {["turf", "date", "slots", "payment"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  ["turf", "date", "slots", "payment"].indexOf(bookingStep) >=
                  index
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`h-1 w-16 ${
                    ["turf", "date", "slots", "payment"].indexOf(bookingStep) >
                    index
                      ? "bg-primary"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Turf */}
        {bookingStep === "turf" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select a Turf
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading turfs...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {turfs.map((turf) => (
                  <div
                    key={turf.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                    onClick={() => handleTurfSelect(turf)}
                  >
                    <div className="bg-gradient-to-br from-primary/40 to-primary/20 h-48 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-white text-2xl font-bold">
                          {turf.name}
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-2">📍 {turf.location}</p>
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 text-gray-700">
                          {turf.rating}/5
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-primary mb-4">
                        ₹{turf.price}/hour
                      </p>
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Amenities:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {turf.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleTurfSelect(turf)}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date */}
        {bookingStep === "date" && selectedTurf && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select a Date
            </h2>

            <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
              <p className="text-gray-600 mb-4">
                Selected Turf: {selectedTurf.name}
              </p>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Date:
                </label>
                <input
                  type="date"
                  min={getTodayDate()}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setBookingStep("turf");
                    setSelectedTurf(null);
                    setSelectedDate("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleDateSubmit}
                  disabled={!selectedDate || loading}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition"
                >
                  {loading ? "Loading..." : "Next"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Slots */}
        {bookingStep === "slots" && selectedTurf && selectedDate && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select Time Slots
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Slots Selection */}
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading available slots...</p>
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() =>
                          slot.available && handleSlotToggle(slot.id)
                        }
                        disabled={!slot.available}
                        className={`p-4 rounded-lg font-semibold transition ${
                          !slot.available
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : selectedSlots.includes(slot.id)
                              ? "bg-primary text-white"
                              : "bg-white border-2 border-gray-300 text-gray-700 hover:border-primary"
                        }`}
                      >
                        <div className="text-sm">{slot.time}</div>
                        <div className="text-xs mt-1">₹{slot.price}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-gray-600">
                      No slots available for the selected date
                    </p>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Booking Summary
                </h3>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Turf:</span>
                    <span className="font-semibold">{selectedTurf.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-semibold">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slots:</span>
                    <span className="font-semibold">
                      {selectedSlots.length}
                    </span>
                  </div>

                  {selectedSlots.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-gray-600 mb-2">Selected Times:</p>
                      <div className="space-y-1">
                        {selectedSlots.map((slotId) => {
                          const slot = slots.find((s) => s.id === slotId);
                          return (
                            <div
                              key={slotId}
                              className="flex justify-between text-sm"
                            >
                              <span>{slot?.time}</span>
                              <span>₹{slot?.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-6">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{totalPrice}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setBookingStep("date")}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBooking}
                      disabled={selectedSlots.length === 0 || loading}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition"
                    >
                      {loading ? "Processing..." : "Continue to Payment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
