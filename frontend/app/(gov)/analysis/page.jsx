"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { listComments, listLegislation, saveAnalysis } from "@/lib/legislation";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalysisPage() {
  const [comments, setComments] = useState([]);
  const [legislations, setLegislations] = useState([]);
  const [selectedLeg, setSelectedLeg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentiments, setSentiments] = useState({});
  const [summary, setSummary] = useState("");
  const [wordcloudB64, setWordcloudB64] = useState("");
  const [wordcloudWords, setWordcloudWords] = useState([]);
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [ratingCounts, setRatingCounts] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

  const [viewComment, setViewComment] = useState(null);

  const apiBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_SENTIMENT_API || "http://localhost:8000";
  }, []);

  // calculate sentiment counts
  const calculateSentimentCounts = (comments, sentiments) => {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    comments.forEach((comment) => {
      const sentiment = sentiments[comment.id];
      if (sentiment) {
        switch (sentiment.label?.toLowerCase()) {
          case "positive":
            positiveCount++;
            break;
          case "negative":
            negativeCount++;
            break;
          default:
            neutralCount++;
        }
      } else neutralCount++;
    });

    return { positiveCount, negativeCount, neutralCount };
  };

  const { positiveCount, negativeCount, neutralCount } = useMemo(
    () => calculateSentimentCounts(comments, sentiments),
    [comments, sentiments]
  );

  // Check if legislation needs urgent attention
  const needsUrgentAttention = useMemo(() => {
    if (comments.length === 0) return false;

    const totalSentimentComments = positiveCount + negativeCount;
    if (totalSentimentComments === 0) return false;

    const negativePercentage = (negativeCount / totalSentimentComments) * 100;
    const positivePercentage = (positiveCount / totalSentimentComments) * 100;

    // If negative comments are 20% or more higher than positive comments
    return negativePercentage >= positivePercentage + 20;
  }, [positiveCount, negativeCount, comments.length]);

  // rating counts
  const calculateRatingCounts = (comments) => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    comments.forEach((c) => {
      if (c.rating && c.rating >= 1 && c.rating <= 5) {
        counts[c.rating]++;
      }
    });
    return counts;
  };

  useEffect(() => {
    (async () => {
      try {
        const leg = await listLegislation();
        setLegislations(leg);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchComments = async (legislationId) => {
    setLoading(true);
    try {
      setComments([]);
      setSentiments({});
      setSummary("");
      setWordcloudWords([]);
      const items = await listComments({ legislationId });
      const sorted = [...items].sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setComments(sorted);
      setRatingCounts(calculateRatingCounts(sorted));
    } catch (e) {
      console.error("Failed to load comments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLeg) fetchComments(selectedLeg);
  }, [selectedLeg]);

  useEffect(() => {
    const analyze = async () => {
      if (comments.length === 0) return;
      const legAtStart = selectedLeg;
      try {
        const byId = {};
        comments.forEach((c) => {
          if (c.sentimentLabel) {
            byId[c.id] = { label: c.sentimentLabel, score: c.sentimentScore };
          }
        });
        if (legAtStart === selectedLeg) setSentiments(byId);

        const sres = await fetch(`${apiBase}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: comments.map((c) => c.text) }),
        });
        if (sres.ok) {
          const sdata = await sres.json();
          if (legAtStart === selectedLeg) setSummary(sdata.summary || "");
        }

        const wres = await fetch(`${apiBase}/wordcloud`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: comments.map((c) => c.text) }),
        });
        if (wres.ok) {
          const wdata = await wres.json();
          if (legAtStart === selectedLeg) {
            setWordcloudB64(wdata.image_base64 || "");
            setWordcloudWords(wdata.top_words || []);
          }
        }
      } catch (err) {
        console.error("analysis failed", err);
      }
    };
    analyze();
  }, [comments, apiBase, selectedLeg]);

  // Pie chart data
  const pieData = [
    { name: "Positive", value: positiveCount },
    { name: "Negative", value: negativeCount },
    { name: "Neutral", value: neutralCount },
  ];
  const pieColors = ["#22c55e", "#ef4444", "#9ca3af"];

  // Bar chart data
  const ratingData = Object.keys(ratingCounts).map((r) => ({
    rating: r,
    count: ratingCounts[r],
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Select Legislation */}
      <div>
        <label className="block mb-2 font-medium">Select Legislation</label>
        <div className="flex items-center gap-3">
          <select
            className="border px-3 py-2 rounded"
            value={selectedLeg}
            onChange={(e) => setSelectedLeg(e.target.value)}
          >
            <option value="">All</option>
            {legislations.map((l) => (
              <option key={l.id} value={l.legislationId || l.id}>
                {l.title}
              </option>
            ))}
          </select>
          {selectedLeg && needsUrgentAttention && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Requires Immediate Attention
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded p-4 text-center">
          <div className="text-gray-500">Total Comments</div>
          <div className="text-xl font-bold">{comments.length}</div>
        </div>
        <div className="bg-green-100 shadow rounded p-4 text-center">
          <div className="text-green-600">Positive</div>
          <div className="text-xl font-bold">{positiveCount}</div>
        </div>
        <div className="bg-red-100 shadow rounded p-4 text-center">
          <div className="text-red-600">Negative</div>
          <div className="text-xl font-bold">{negativeCount}</div>
        </div>
        <div className="bg-gray-100 shadow rounded p-4 text-center">
          <div className="text-gray-600">Neutral</div>
          <div className="text-xl font-bold">{neutralCount}</div>
        </div>
      </div>

      {/* Alert Banner for Urgent Attention */}
      {selectedLeg && needsUrgentAttention && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                High Negative Sentiment Detected
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p>
                  This legislation has received significantly more negative
                  feedback than positive. Consider reviewing and addressing
                  stakeholder concerns to improve public sentiment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-medium mb-2">Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={90} label>
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-medium mb-2">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Word Cloud & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wordcloudB64 && (
          <div className="bg-white shadow rounded p-4">
            <h3 className="font-medium mb-2">Word Cloud</h3>
            <img
              src={`data:image/png;base64,${wordcloudB64}`}
              alt="Word Cloud"
              className="w-full"
            />
          </div>
        )}
        {summary && (
          <div className="bg-white shadow rounded p-4">
            <h3 className="font-medium mb-2">Summary</h3>
            <p className="text-sm text-gray-700">{summary}</p>
          </div>
        )}
      </div>

      {/* Comments Table */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="font-medium mb-4">Comments</h3>
        {loading ? (
          <div>Loading...</div>
        ) : comments.length === 0 ? (
          <div>No comments available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">Legislation ID</th>
                  <th className="px-3 py-2 border">Comment</th>
                  <th className="px-3 py-2 border">Sentiment</th>
                  <th className="px-3 py-2 border">Score</th>
                  <th className="px-3 py-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="px-3 py-2 border">{c.legislationId}</td>
                    <td className="px-3 py-2 border">
                      {c.text.length > 40
                        ? c.text.slice(0, 40) + "..."
                        : c.text}
                    </td>
                    <td className="px-3 py-2 border">
                      {sentiments[c.id]?.label || "-"}
                    </td>
                    <td className="px-3 py-2 border">
                      {Number(sentiments[c.id]?.score || 0).toFixed(3)}
                    </td>
                    <td className="px-3 py-2 border text-center">
                      <button
                        onClick={() => setViewComment(c)}
                        className="text-blue-600 underline"
                      >
                        View More
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for View More */}
      {viewComment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-3">Comment Details</h3>
            <p className="mb-2">
              <strong>Legislation:</strong> {viewComment.legislationId}
            </p>
            <p className="mb-2">
              <strong>Comment:</strong> {viewComment.text}
            </p>
            <p className="mb-2">
              <strong>Sentiment:</strong>{" "}
              {sentiments[viewComment.id]?.label || "-"}
            </p>
            <p className="mb-4">
              <strong>Score:</strong>{" "}
              {Number(sentiments[viewComment.id]?.score || 0).toFixed(3)}
            </p>
            <button
              onClick={() => setViewComment(null)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
