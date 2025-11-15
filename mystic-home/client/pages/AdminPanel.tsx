import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

interface AdminStats {
  totalBookings: number;
  totalRevenue: number;
  totalTurfs: number;
  totalUsers: number;
}

interface TurfData {
  id: string;
  name: string;
  location: string;
  price: number;
  amenities: string[];
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalTurfs: 0,
    totalUsers: 0,
  });
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "turfs" | "bookings"
  >("dashboard");
  const [turfs, setTurfs] = useState<TurfData[]>([]);
  const [showAddTurf, setShowAddTurf] = useState(false);
  const [editingTurfId, setEditingTurfId] = useState<string | null>(null);
  const [newTurf, setNewTurf] = useState({
    name: "",
    location: "",
    price: "",
    amenities: "",
  });
  const [editTurf, setEditTurf] = useState({
    name: "",
    location: "",
    price: "",
    amenities: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      navigate("/login");
      return;
    }

    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [statsRes, turfsRes] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/turfs", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (turfsRes.ok) {
        const turfsData = await turfsRes.json();
        setTurfs(turfsData);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTurf = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/turfs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTurf.name,
          location: newTurf.location,
          price: parseInt(newTurf.price),
          amenities: newTurf.amenities
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a),
        }),
      });

      if (response.ok) {
        setNewTurf({ name: "", location: "", price: "", amenities: "" });
        setShowAddTurf(false);
        fetchAdminData();
      }
    } catch (error) {
      console.error("Error adding turf:", error);
    }
  };

  const handleEditTurf = (turf: TurfData) => {
    setEditingTurfId(turf.id);
    setEditTurf({
      name: turf.name,
      location: turf.location,
      price: turf.price.toString(),
      amenities: turf.amenities.join(", "),
    });
  };

  const handleUpdateTurf = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/turfs/${editingTurfId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editTurf.name,
          location: editTurf.location,
          price: parseInt(editTurf.price),
          amenities: editTurf.amenities
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a),
        }),
      });

      if (response.ok) {
        setEditingTurfId(null);
        setEditTurf({ name: "", location: "", price: "", amenities: "" });
        fetchAdminData();
      }
    } catch (error) {
      console.error("Error updating turf:", error);
    }
  };

  const handleDeleteTurf = async (turfId: string) => {
    if (!window.confirm("Are you sure you want to delete this turf?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/turfs/${turfId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchAdminData();
      }
    } catch (error) {
      console.error("Error deleting turf:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-primary">
              GreenField Admin
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="mb-8 flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "dashboard"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("turfs")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "turfs"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Turfs
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "bookings"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bookings
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Admin Dashboard
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Bookings */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalBookings}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₹{stats.totalRevenue}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8.16 5.314l4.897-1.596A1 1 0 0115 4.981V10a6 6 0 11-6-6 1 1 0 01.316 1.949z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Turfs */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Turfs</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalTurfs}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V6.5m-11-5v5m5-5v5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Users */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Bookings Over Time
              </h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-600">Chart visualization</p>
              </div>
            </div>
          </div>
        )}

        {/* Turfs Tab */}
        {activeTab === "turfs" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900">Manage Turfs</h1>
              <button
                onClick={() => setShowAddTurf(!showAddTurf)}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition"
              >
                {showAddTurf ? "Cancel" : "Add New Turf"}
              </button>
            </div>

            {/* Add Turf Form */}
            {showAddTurf && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Add New Turf
                </h2>

                <form onSubmit={handleAddTurf} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Turf Name
                    </label>
                    <input
                      type="text"
                      value={newTurf.name}
                      onChange={(e) =>
                        setNewTurf({ ...newTurf, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newTurf.location}
                      onChange={(e) =>
                        setNewTurf({ ...newTurf, location: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Price per Hour (₹)
                    </label>
                    <input
                      type="number"
                      value={newTurf.price}
                      onChange={(e) =>
                        setNewTurf({ ...newTurf, price: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Amenities (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTurf.amenities}
                      onChange={(e) =>
                        setNewTurf({ ...newTurf, amenities: e.target.value })
                      }
                      placeholder="e.g., Lights, Parking, Changing Room"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition"
                  >
                    Add Turf
                  </button>
                </form>
              </div>
            )}

            {/* Turfs List */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading turfs...</p>
              </div>
            ) : turfs.length > 0 ? (
              <div className="space-y-4">
                {turfs.map((turf) => (
                  <div key={turf.id}>
                    {editingTurfId === turf.id ? (
                      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                          Edit Turf
                        </h2>

                        <form
                          onSubmit={handleUpdateTurf}
                          className="space-y-4 max-w-2xl"
                        >
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                              Turf Name
                            </label>
                            <input
                              type="text"
                              value={editTurf.name}
                              onChange={(e) =>
                                setEditTurf({
                                  ...editTurf,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              value={editTurf.location}
                              onChange={(e) =>
                                setEditTurf({
                                  ...editTurf,
                                  location: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                              Price per Hour (₹)
                            </label>
                            <input
                              type="number"
                              value={editTurf.price}
                              onChange={(e) =>
                                setEditTurf({
                                  ...editTurf,
                                  price: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                              Amenities (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={editTurf.amenities}
                              onChange={(e) =>
                                setEditTurf({
                                  ...editTurf,
                                  amenities: e.target.value,
                                })
                              }
                              placeholder="e.g., Lights, Parking, Changing Room"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="flex gap-4">
                            <button
                              type="submit"
                              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTurfId(null)}
                              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {turf.name}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              📍 {turf.location}
                            </p>
                            <p className="text-2xl font-bold text-primary mt-2">
                              ₹{turf.price}/hour
                            </p>
                            {turf.amenities.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                  Amenities:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {turf.amenities.map((amenity, index) => (
                                    <span
                                      key={index}
                                      className="text-xs bg-primary/10 text-primary px-3 py-1 rounded"
                                    >
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditTurf(turf)}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTurf(turf.id)}
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600">
                  No turfs added yet. Add one to get started!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Manage Bookings
            </h1>

            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">
                Booking management interface coming soon
              </p>
              <p className="text-sm text-gray-500">
                View, modify, and manage all user bookings here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
