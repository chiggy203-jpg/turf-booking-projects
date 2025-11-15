import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch((err) => {
        console.error("Failed to parse response:", err);
        return null;
      });

      if (!response.ok) {
        console.error("Login failed:", data);
        setError(data?.message || "Login failed");
        return;
      }

      if (!data || !data.token) {
        console.error("Invalid response - no token:", data);
        setError("Invalid response from server");
        return;
      }

      console.log("Login successful, storing token:", {
        hasToken: !!data.token,
        tokenLength: data.token?.length,
        userId: data.userId,
        role: data.role,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);

      // Verify token was stored
      const storedToken = localStorage.getItem("token");
      console.log("Token stored verification:", {
        stored: !!storedToken,
        matches: storedToken === data.token,
      });

      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GreenField</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Login to your account
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 bg-white hover:border-gray-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <svg
                  className="w-5 h-5 text-gray-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-500 bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 bg-white hover:border-gray-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <svg
                  className="w-5 h-5 text-gray-600 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-500 bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end mb-4">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline text-sm"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-700">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-semibold"
            >
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
