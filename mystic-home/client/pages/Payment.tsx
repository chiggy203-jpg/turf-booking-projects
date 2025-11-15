import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "qr">("upi");
  const [qrCode, setQrCode] = useState<string>("");

  const bookingId = searchParams.get("bookingId");
  const amount = searchParams.get("amount");
  const turfName = searchParams.get("turfName");

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Generate QR code if method is QR
    if (paymentMethod === "qr" && amount) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        `upi://pay?pa=greenfield@okhdfcbank&pn=GreenField&am=${amount}&tr=${bookingId}`,
      )}`;
      setQrCode(qrUrl);
    }
  }, [paymentMethod, amount, bookingId]);

  const handleUPIPayment = async () => {
    if (!bookingId || !amount) {
      setError("Missing booking or amount information");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Create order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          amount: parseFloat(amount),
          currency: "INR",
        }),
      });

      const orderData = await orderResponse.json().catch(() => null);

      if (!orderResponse.ok) {
        setError(
          orderData?.message ||
            "Failed to create payment order. Please configure Razorpay API keys.",
        );
        setLoading(false);
        return;
      }

      if (!orderData) {
        setError("Invalid response from server");
        setLoading(false);
        return;
      }

      // Get user email
      const userResponse = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json().catch(() => ({
        name: "User",
        email: "",
        phone: "",
      }));

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GreenField Turf Booking",
        description: `Booking for ${turfName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                paymentId: orderData.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyResponse.ok) {
              navigate(
                `/payment-success?bookingId=${bookingId}&paymentId=${orderData.paymentId}`,
              );
            } else {
              setError("Payment verification failed");
            }
          } catch (err) {
            setError("Error verifying payment");
            console.error(err);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: userData.name,
          email: userData.email,
          contact: userData.phone,
        },
        theme: {
          color: "#00A850",
        },
        method: {
          upi: true,
          netbanking: true,
          card: true,
          wallet: true,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  const handleQRPayment = async () => {
    if (!bookingId) {
      setError("Missing booking information");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Mark as pending payment (in real implementation, would wait for UPI app confirmation)
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          amount: parseFloat(amount || "0"),
          currency: "INR",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Show success message
        navigate(
          `/payment-success?bookingId=${bookingId}&paymentId=${data.paymentId}&method=qr`,
        );
      } else {
        setError("Failed to process payment");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!bookingId || !amount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">
            Invalid payment request
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-primary text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-primary">GreenField</div>
            <button
              onClick={() => navigate("/booking")}
              className="px-4 py-2 text-gray-700 hover:text-primary transition"
            >
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Payment Page */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Complete Your Payment
          </h1>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Turf Name:</span>
                <span className="font-semibold text-gray-900">{turfName}</span>
              </div>
              <div className="flex justify-between text-2xl border-t pt-3">
                <span className="font-semibold text-gray-900">Amount:</span>
                <span className="font-bold text-primary">₹{amount}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Payment Method
              </h3>

              {/* UPI Method */}
              <label
                className="flex items-center p-4 border-2 rounded-lg cursor-pointer mb-4 hover:bg-gray-50 transition"
                style={{
                  borderColor: paymentMethod === "upi" ? "#00A850" : "#e5e7eb",
                  backgroundColor:
                    paymentMethod === "upi" ? "#f0fdf4" : "white",
                }}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                  className="w-4 h-4 text-primary"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">UPI Payment</p>
                  <p className="text-sm text-gray-600">
                    Pay using Google Pay, PhonePe, Paytm, or BHIM
                  </p>
                </div>
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </label>

              {/* QR Code Method */}
              <label
                className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                style={{
                  borderColor: paymentMethod === "qr" ? "#00A850" : "#e5e7eb",
                  backgroundColor: paymentMethod === "qr" ? "#f0fdf4" : "white",
                }}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="qr"
                  checked={paymentMethod === "qr"}
                  onChange={() => setPaymentMethod("qr")}
                  className="w-4 h-4 text-primary"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Scan QR Code</p>
                  <p className="text-sm text-gray-600">
                    Scan the QR code with your UPI app
                  </p>
                </div>
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </label>
            </div>

            {/* UPI Payment Content */}
            {paymentMethod === "upi" && (
              <div>
                <p className="text-gray-600 mb-4 text-sm">
                  You will be redirected to Razorpay's secure payment gateway
                  where you can choose your preferred UPI app.
                </p>
                <button
                  onClick={handleUPIPayment}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                >
                  {loading ? "Processing..." : "Pay with UPI"}
                </button>
              </div>
            )}

            {/* QR Code Payment Content */}
            {paymentMethod === "qr" && (
              <div className="flex flex-col items-center">
                <p className="text-gray-600 mb-4 text-sm">
                  Scan this QR code with any UPI app to complete payment
                </p>
                {qrCode && (
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                    <img src={qrCode} alt="UPI QR Code" className="w-64 h-64" />
                  </div>
                )}
                <button
                  onClick={handleQRPayment}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                >
                  {loading ? "Processing..." : "I've Paid via QR Code"}
                </button>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Your payment is secure
                </p>
                <p className="text-sm text-blue-700">
                  Powered by Razorpay, India's most trusted payment gateway.
                  Your data is encrypted and secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
