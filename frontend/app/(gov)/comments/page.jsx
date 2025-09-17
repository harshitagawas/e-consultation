"use client";
import { useState } from "react";

export default function CommentsPage() {
  const legislations = [
    { id: "LEG-101", title: "Digital Privacy Act Amendment" },
    { id: "LEG-102", title: "Environmental Protection Bill" },
  ];

  // Mock comments data
  const allComments = [
    {
      legislationId: "LEG-101",
      comment: "This law will greatly improve privacy protections.",
      rating: 5,
      userId: "user001",
      sentiment: "Positive",
      confidence: 92,
    },
    {
      legislationId: "LEG-101",
      comment: "Implementation details are unclear.",
      rating: 3,
      userId: "user002",
      sentiment: "Neutral",
      confidence: 76,
    },
    {
      legislationId: "LEG-102",
      comment: "Too strict, will hurt small businesses.",
      rating: 2,
      userId: "user003",
      sentiment: "Negative",
      confidence: 88,
    },
    {
      legislationId: "LEG-102",
      comment: "Good step for protecting the environment.",
      rating: 4,
      userId: "user004",
      sentiment: "Positive",
      confidence: 95,
    },
  ];

  const [selectedLegislation, setSelectedLegislation] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Filtered & paginated comments
  const filteredComments = allComments.filter(
    (c) =>
      (selectedLegislation === "" || c.legislationId === selectedLegislation) &&
      (sentimentFilter === "All" || c.sentiment === sentimentFilter)
  );

  const commentsPerPage = 10;
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);
  const paginatedComments = filteredComments.slice(
    (page - 1) * commentsPerPage,
    page * commentsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Stakeholder Comments
        </h2>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Legislation Dropdown */}
          <select
            value={selectedLegislation}
            onChange={(e) => {
              setSelectedLegislation(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2 text-gray-700"
          >
            <option value="">-- Select Legislation --</option>
            {legislations.map((law) => (
              <option key={law.id} value={law.id}>
                {law.title}
              </option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => {
              setSentimentFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2 text-gray-700"
          >
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Legislation ID</th>
                <th className="px-4 py-2 text-left">Comment</th>
                <th className="px-4 py-2 text-center">Rating</th>
                <th className="px-4 py-2 text-center">User ID</th>
                <th className="px-4 py-2 text-center">Sentiment</th>
                <th className="px-4 py-2 text-center">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComments.length > 0 ? (
                paginatedComments.map((c, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{c.legislationId}</td>
                    <td className="px-4 py-2">{c.comment}</td>
                    <td className="px-4 py-2 text-center">
                      {"⭐".repeat(c.rating)}
                    </td>
                    <td className="px-4 py-2 text-center">{c.userId}</td>
                    <td
                      className={`px-4 py-2 text-center font-medium ${
                        c.sentiment === "Positive"
                          ? "text-green-600"
                          : c.sentiment === "Negative"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {c.sentiment}
                    </td>
                    <td className="px-4 py-2 text-center">{c.confidence}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">
                    No comments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
