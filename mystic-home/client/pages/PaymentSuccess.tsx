import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const paymentId = searchParams.get("paymentId");
  const method = searchParams.get("method");

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Your turf booking has been confirmed
            </p>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-semibold text-gray-900 font-mono text-sm">
                {bookingId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-semibold text-gray-900 font-mono text-sm">
                {paymentId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold text-gray-900">
                {method === "qr" ? "UPI QR Code" : "UPI"}
              </span>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              What's Next?
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Check your email for booking confirmation</li>
              <li>View your booking in the dashboard</li>
              <li>Arrive 15 minutes before your slot</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="block w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition text-center"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => navigate("/")}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition"
            >
              Back to Home
            </button>
          </div>

          {/* Auto Redirect Message */}
          <p className="text-xs text-gray-500 mt-4">
            Redirecting to dashboard in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
