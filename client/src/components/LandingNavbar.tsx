import { Link } from 'react-router-dom';

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight text-gray-900">
          TaskPulse
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-3 py-2 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-3 py-2 rounded-md text-sm font-semibold bg-[#0f172a] text-white hover:opacity-95"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
