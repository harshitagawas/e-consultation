"use client";
import { useState } from "react";
import Link from "next/link";
export default function LegislationList() {
  const [expandedId, setExpandedId] = useState(null);

  // Demo data (replace with DB/Firebase fetch later)
  const legislations = [
    {
      id: "LEG-101",
      title: "Digital Privacy Act Amendment",
      description: "Amendments related to data protection and digital privacy.",
      startDate: "2025-09-01",
      endDate: "2025-10-15",
      totalComments: 128,
    },
    {
      id: "LEG-102",
      title: "Environmental Protection Bill",
      description: "Draft to strengthen emission controls and penalties.",
      startDate: "2025-09-10",
      endDate: "2025-11-01",
      totalComments: 75,
    },
  ];

  const selectedLaw = legislations.find((law) => law.id === expandedId) || null;

  return (
    <div className="min-h-screen  px-6 py-10">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Legislations</h2>
          <Link href="/addlegislation">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition">
              + Add New Legislation
            </button>
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Deadline</th>
                <th className="px-4 py-2 text-center">Total Comments</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {legislations.map((law) => (
                <tr
                  key={law.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2">{law.title}</td>
                  <td className="px-4 py-2">{law.endDate}</td>
                  <td className="px-4 py-2 text-center">{law.totalComments}</td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === law.id ? null : law.id)
                      }
                      className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      {expandedId === law.id ? "Hide" : "View More"}
                    </button>
                    <button className="px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200">
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Overlay for Expanded Details */}
        {selectedLaw && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setExpandedId(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 relative">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {selectedLaw.title}
                </h3>
                <p className="text-gray-600 mb-4">{selectedLaw.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p>
                    <span className="font-medium">Legislation ID:</span>{" "}
                    {selectedLaw.id}
                  </p>
                  <p>
                    <span className="font-medium">Start Date:</span>{" "}
                    {selectedLaw.startDate}
                  </p>
                  <p>
                    <span className="font-medium">End Date:</span>{" "}
                    {selectedLaw.endDate}
                  </p>
                  <p>
                    <span className="font-medium">Total Comments:</span>{" "}
                    {selectedLaw.totalComments}
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
