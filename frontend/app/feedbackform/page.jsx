"use client";
import React, { useState } from "react";

export default function SubmitFeedback() {
  const [legislation, setLegislation] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // dummy legislation list (later fetch from gov uploads API)
  const legislations = [
    "Data Privacy Bill 2025",
    "Clean Energy Act",
    "Digital India Policy",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (legislation && comment) {
      // API call goes here
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}

      {/* Main Form Section */}
      <section className="flex flex-grow items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center">
                Submit Your Feedback
              </h2>

              {/* Dropdown */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Select Legislation
                </label>
                <select
                  value={legislation}
                  onChange={(e) => setLegislation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Choose Legislation --</option>
                  {legislations.map((item, index) => (
                    <option key={index} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Enter your comments
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Write your comments here..."
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                Submit
              </button>
            </form>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-600">
                ✅ Thank you for your feedback!
              </h2>
              <p className="mt-4 text-gray-600">
                Your comments have been submitted successfully.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
