"use client";
import React, { useState } from "react";

export default function GovAuth() {
  const [activeTab, setActiveTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const allowedSuffixes = [
    ".gov",
    ".gov.in",
    ".nic.in",
    ".gov.uk",
    ".gov.au",
    ".gov.ca",
    ".gov.za",
  ];

  function isGovEmail(email) {
    if (!email) return false;
    email = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    return allowedSuffixes.some((suf) => email.endsWith(suf));
  }

  function passwordOk(p) {
    return (
      p &&
      p.length >= 8 &&
      /[a-z]/.test(p) &&
      /[A-Z]/.test(p) &&
      /[0-9]/.test(p)
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);

    if (activeTab === "signup" && !name.trim()) {
      setMessage({ type: "error", text: "Please enter your full name." });
      return;
    }
    if (!isGovEmail(email)) {
      setMessage({
        type: "error",
        text: "Email is not recognized as a government address.",
      });
      return;
    }
    if (!passwordOk(password)) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 chars and include uppercase, lowercase, and number.",
      });
      return;
    }
    if (activeTab === "signup" && password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setMessage({
        type: "success",
        text:
          activeTab === "login"
            ? "Login successful (Demo)."
            : "Account created successfully (Demo).",
      });
      setLoading(false);
    }, 1000);
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

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => {
              setActiveTab("login");
              setMessage(null);
            }}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "login"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setMessage(null);
            }}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "signup"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. A. K. Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          )}

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
            <p className="text-xs text-gray-500 mt-1">
              Allowed: <code>.gov</code>, <code>.gov.in</code>,{" "}
              <code>.nic.in</code>, etc.
            </p>
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

          {activeTab === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
          )}

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
            {loading
              ? activeTab === "login"
                ? "Logging in..."
                : "Signing up..."
              : activeTab === "login"
              ? "Login"
              : "Sign Up"}
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
