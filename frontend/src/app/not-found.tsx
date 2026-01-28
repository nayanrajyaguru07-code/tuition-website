"use client";

import Link from 'next/link'
import { Home, MoveLeft, FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center space-y-6 border border-gray-100">
        
        {/* Icon */}
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <FileQuestion size={48} className="text-orange-500" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-bold text-gray-800">
            Page Not Found
          </h2>
          <p className="text-gray-500">
            Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link 
            href="/home" 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-all shadow-lg shadow-gray-200 hover:-translate-y-0.5"
          >
            <Home size={18} />
            Go to Home
          </Link>
          
          <Link 
             href="javascript:history.back()"
             className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
             onClick={(e) => {
               e.preventDefault();
               window.history.back();
             }}
          >
            <MoveLeft size={18} />
            Go Back
          </Link>
        </div>
      </div>

      <div className="mt-8 text-gray-400 text-sm font-medium">
        © {new Date().getFullYear()} Tuition Management System
      </div>
    </div>
  )
}
