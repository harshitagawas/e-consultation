"use client";
import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-grow text-center px-6 bg-gradient-to-b from-indigo-50 to-white">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
          AI-powered eConsultation Feedback Analyzer
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          Collect, analyze, and visualize stakeholder feedback to support
          informed governance.
        </p>

        <div className="mt-8 flex space-x-4">
          <Link
            href="/feedbackform"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Submit Feedback
          </Link>
          <Link
            href="/govlogin"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 transition"
          >
            Gov Login
          </Link>
        </div>
      </section>
    </div>
  );
}
