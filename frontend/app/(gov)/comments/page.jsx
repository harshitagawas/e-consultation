"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { listLegislation } from "@/lib/legislation";

export default function CommentsPage() {
  const [legislations, setLegislations] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeg, setLoadingLeg] = useState(true);

  // 🔹 Fetch legislations using the same method as feedback form
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const items = await listLegislation();
        if (isMounted) setLegislations(items);
      } catch (e) {
        console.error("Failed to load legislation", e);
      } finally {
        if (isMounted) setLoadingLeg(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 🔹 Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        const commentsRef = collection(db, "comments");
        const commentsQuery = query(commentsRef);
        const querySnapshot = await getDocs(commentsQuery);

        const commentsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            legislationId: data.legislationId,
            comment: data.text,
            rating: data.rating,
            userId: data.commentId,
            sentiment:
              data.sentimentLabel.charAt(0).toUpperCase() +
              data.sentimentLabel.slice(1),
            confidence: Math.round(data.sentimentScore * 100),
            createdAt: data.createdAt?.toDate().toLocaleString(),
          };
        });

        setAllComments(commentsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setLoading(false);
      }
    }

    fetchComments();
  }, []);

  const [selectedLegislation, setSelectedLegislation] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [page, setPage] = useState(1);

  // 🔹 Filtered & paginated comments
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

        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* 🔹 Updated Legislation Dropdown using feedback form pattern */}
          <select
            value={selectedLegislation}
            onChange={(e) => {
              setSelectedLegislation(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" disabled>
              {loadingLeg ? "Loading..." : "-- Select Legislation --"}
            </option>
            {legislations.map((item) => (
              <option key={item.id} value={item.legislationId || item.id}>
                {item.title}
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
                <th className="px-4 py-2 text-center">Sentiment</th>
                <th className="px-4 py-2 text-center">Confidence</th>
                <th className="px-4 py-2 text-center">Created At</th>
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
                    <td className="px-4 py-2 text-center">{c.createdAt}</td>
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
