"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function GovAuth() {
  const [govId, setGovId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Basic format check only; domain allow-listing is enforced via Firestore pre-approval
  function emailLooksValid(e) {
    if (!e) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!govId.trim()) {
      setMessage({ type: "error", text: "Please enter your Government ID." });
      return;
    }
    if (!emailLooksValid(email)) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting login with:", { govId, email, password });

      // Pre-approved email check in govOfficials collection
      const officialsRef = collection(db, "govOfficials");
      const q = query(
        officialsRef,
        where("email", "==", email.trim().toLowerCase())
      );
      const snap = await getDocs(q);

      console.log(
        "Query results:",
        snap.empty ? "No records found" : `${snap.docs.length} records found`
      );

      if (snap.empty) {
        setMessage({
          type: "error",
          text: "This email is not pre-approved for access.",
        });
        setLoading(false);
        return;
      }

      const record = snap.docs[0].data();
      console.log("Found record:", record);

      const storedGovId = String(record.gov_id || "").trim();
      const storedPassword = String(record.password || "").trim();
      const inputGovId = govId.trim();
      const inputPassword = password.trim();

      console.log("Comparing:", {
        storedGovId,
        inputGovId,
        govIdMatch: storedGovId === inputGovId,
        storedPassword,
        inputPassword,
        passwordMatch: storedPassword === inputPassword,
      });

      if (storedGovId !== inputGovId) {
        setMessage({
          type: "error",
          text: `Government ID does not match our records. Expected: ${storedGovId}, Got: ${inputGovId}`,
        });
        setLoading(false);
        return;
      }

      if (storedPassword !== inputPassword) {
        setMessage({
          type: "error",
          text: `Incorrect password. Expected: ${storedPassword}, Got: ${inputPassword}`,
        });
        setLoading(false);
        return;
      }

      setMessage({
        type: "success",
        text: `Welcome, ${record.name || "Official"}.`,
      });
      // Optional redirect to dashboard
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err) {
      console.error("Login error:", err);
      setMessage({
        type: "error",
        text: `Unexpected error during login: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg p-6">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold">
            Gov
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              Government Portal
            </h1>
            <p className="text-sm text-gray-500">
              Access restricted to authorized officials only.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Government ID
            </label>
            <input
              type="text"
              placeholder="Enter your Gov ID"
              value={govId}
              onChange={(e) => setGovId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Official Email
            </label>
            <input
              type="email"
              placeholder="you@department.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use a strong password (uppercase, lowercase, number).
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg p-2 text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-green-50 text-green-600 border border-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <footer className="text-center text-gray-400 text-xs mt-4">
          &copy; {new Date().getFullYear()} Government Access — Authorized
          personnel only
        </footer>
      </div>
    </div>
  );
}
