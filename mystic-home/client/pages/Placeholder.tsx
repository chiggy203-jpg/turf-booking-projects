import { useNavigate, Link } from "react-router-dom";

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-primary">
              GreenField
            </Link>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-gray-700 hover:text-primary transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Placeholder Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-8">{description}</p>
          <p className="text-gray-500 mb-8">
            This page is coming soon. Continue exploring the application or provide feedback to help us build this feature.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
