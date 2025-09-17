"use client";
import { useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  PlusCircle,
  BarChart3,
  MessageSquare,
} from "lucide-react";

export default function DashboardStats() {
  // Mock legislation data
  const legislations = [
    {
      id: "LEG-101",
      title: "Digital Privacy Act",
      deadline: "2025-09-30",
      active: true,
    },
    {
      id: "LEG-102",
      title: "Environmental Protection Bill",
      deadline: "2025-09-20",
      active: true,
    },
    {
      id: "LEG-103",
      title: "Taxation Reform Draft",
      deadline: "2025-10-15",
      active: false,
    },
  ];

  const today = new Date();
  const expiringSoon = legislations.filter((l) => {
    const deadline = new Date(l.deadline);
    const diffDays = (deadline - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7; // expiring within 7 days
  });

  const total = legislations.length;
  const active = legislations.filter((l) => l.active).length;
  const inactive = total - active;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Dashboard Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Snapshot of legislation activity and deadlines
          </p>
        </div>

        {/* Asymmetric Stats Grid */}
        <div className="grid grid-cols-12 gap-6 mb-10">
          {/* Highlight Card - spans wider */}
          <div className="col-span-12 md:col-span-7 rounded-xl bg-white shadow overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-transparent">
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-indigo-600" />
                <div>
                  <p className="text-gray-600">Total Legislations</p>
                  <h3 className="text-3xl font-bold text-gray-900">{total}</h3>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-xl font-semibold text-emerald-600">
                  {active}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Inactive</p>
                <p className="text-xl font-semibold text-gray-700">
                  {inactive}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Expiring Soon</p>
                <p className="text-xl font-semibold text-rose-600">
                  {expiringSoon.length}
                </p>
              </div>
            </div>
          </div>

          {/* Tall Card - Expiring Soon List */}
          <div className="col-span-12 md:col-span-5 rounded-xl bg-white shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-600" />
                <h4 className="font-semibold text-gray-900">
                  Expiring within 7 days
                </h4>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                {expiringSoon.length} due
              </span>
            </div>
            <ul className="space-y-3">
              {expiringSoon.length === 0 && (
                <li className="text-sm text-gray-500">
                  No upcoming deadlines this week.
                </li>
              )}
              {expiringSoon.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {l.title}
                    </p>
                    <p className="text-xs text-gray-500">ID: {l.id}</p>
                  </div>
                  <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded">
                    {new Date(l.deadline).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Smaller asymmetric tiles */}
          {/* <div className="col-span-12 md:col-span-4 rounded-xl bg-white shadow p-6 flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
            <div>
              <p className="text-gray-500">Active Legislations</p>
              <p className="text-2xl font-bold text-gray-900">{active}</p>
            </div>
          </div> */}
          {/* <div className="col-span-12 md:col-span-8 rounded-xl bg-white shadow p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-purple-600" />
              <div>
                <p className="text-gray-500">Engagement Snapshot</p>
                <p className="text-sm text-gray-500">
                  Comments, analysis and activity
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-md ml-6">
              <div className="h-2 w-full bg-gray-100 rounded">
                <div
                  className="h-2 bg-purple-500 rounded"
                  style={{ width: `${Math.min(100, active * 25)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Approximate activity level based on active items
              </p>
            </div>
          </div> */}
        </div>

        {/* Quick Actions - staggered layout */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-12 gap-4">
            <button className="col-span-12 sm:col-span-5 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow hover:bg-indigo-700 transition">
              <PlusCircle className="w-5 h-5" /> Add Legislation
            </button>
            <button className="col-span-12 sm:col-span-4 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow hover:bg-emerald-700 transition">
              <MessageSquare className="w-5 h-5" /> View Comments
            </button>
            <button className="col-span-12 sm:col-span-3 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg shadow hover:bg-purple-700 transition">
              <BarChart3 className="w-5 h-5" /> Analyze Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
