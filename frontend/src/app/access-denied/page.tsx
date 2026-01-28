import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <ShieldAlert size={40} />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-500 mb-8">
          You do not have permission to access this page. This area is
          restricted to administrators only.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition shadow-md shadow-orange-200"
          >
            Go Back Home
          </Link>

          <Link
            href="/admin/login"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
