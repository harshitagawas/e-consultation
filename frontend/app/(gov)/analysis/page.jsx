"use client";
import React, { useEffect, useMemo, useState } from "react";
import { listComments, listLegislation, saveAnalysis } from "@/lib/legislation";

export default function AnalysisPage() {
  const [comments, setComments] = useState([]);
  const [legislations, setLegislations] = useState([]);
  const [selectedLeg, setSelectedLeg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentiments, setSentiments] = useState({});
  const [summary, setSummary] = useState("");
  const [wordcloudB64, setWordcloudB64] = useState("");
  const [wordcloudWords, setWordcloudWords] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [savingAnalysis, setSavingAnalysis] = useState(false);

  const apiBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_SENTIMENT_API || "http://localhost:8000";
  }, []);

  // Helper function to calculate sentiment counts
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
          case "neutral":
          default:
            neutralCount++;
            break;
        }
      } else {
        neutralCount++;
      }
    });

    return { positiveCount, negativeCount, neutralCount };
  };

  // Helper function to extract top words from comments
  const extractTopWords = (comments, limit = 20) => {
    const wordCount = {};
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
      "my",
      "your",
      "his",
      "her",
      "its",
      "our",
      "their",
    ]);

    comments.forEach((comment) => {
      const words = comment.text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.has(word));

      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  };

  // Function to save analysis data
  const saveAnalysisData = async () => {
    if (!selectedLeg || comments.length === 0) {
      alert(
        "Please select a legislation and ensure there are comments to analyze"
      );
      return;
    }

    setSavingAnalysis(true);
    try {
      const { positiveCount, negativeCount, neutralCount } =
        calculateSentimentCounts(comments, sentiments);

      // Use the word cloud words that were already fetched
      const topWordsFromCloud = wordcloudWords;

      const analysisPayload = {
        legislationId: selectedLeg,
        totalComments: comments.length,
        positiveCommentCount: positiveCount,
        negativeCommentCount: negativeCount,
        neutralCommentCount: neutralCount,
        overallSummary: summary,
        topWords: topWordsFromCloud,
      };

      await saveAnalysis(analysisPayload);
      setAnalysisData(analysisPayload);
      alert("Analysis data saved successfully!");
    } catch (error) {
      console.error("Failed to save analysis data:", error);
      alert("Failed to save analysis data. Please try again.");
    } finally {
      setSavingAnalysis(false);
    }
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
      // Clear previous data immediately on new selection
      setComments([]);
      setSentiments({});
      setSummary("");
      setWordcloudWords([]);
      const items = await listComments({ legislationId });
      // Sort client-side by createdAt desc (if timestamp exists)
      const sorted = [...items].sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setComments(sorted);
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
      if (comments.length === 0) {
        setSentiments({});
        setSummary("");
        return;
      }
      const legAtStart = selectedLeg;
      try {
        // Prefer stored sentiment from Firestore
        const byId = {};
        comments.forEach((c) => {
          if (c.sentimentLabel) {
            byId[c.id] = { label: c.sentimentLabel, score: c.sentimentScore };
          }
        });
        if (legAtStart === selectedLeg) setSentiments(byId);

        // Fetch summary for these comments
        const sres = await fetch(`${apiBase}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: comments.map((c) => c.text) }),
        });
        if (sres.ok) {
          const sdata = await sres.json();
          if (legAtStart === selectedLeg) setSummary(sdata.summary || "");
        } else {
          if (legAtStart === selectedLeg) setSummary("");
        }

        // Fetch wordcloud image
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
        } else {
          if (legAtStart === selectedLeg) {
            setWordcloudB64("");
            setWordcloudWords([]);
          }
        }
      } catch (err) {
        console.error("Sentiment analysis failed", err);
        if (legAtStart === selectedLeg) {
          setSentiments({});
          setSummary("");
          setWordcloudB64("");
          setWordcloudWords([]);
        }
      }
    };
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, apiBase]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block mb-2">Select Legislation</label>
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
      </div>

      <div className="space-y-2">
        {comments.length > 0 && (
          <div className="border rounded p-3 bg-blue-50">
            <div className="font-medium mb-2">Analysis Statistics</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-600">Total Comments</div>
                <div className="text-lg font-bold">{comments.length}</div>
              </div>
              <div>
                <div className="font-medium text-green-600">Positive</div>
                <div className="text-lg font-bold text-green-600">
                  {calculateSentimentCounts(comments, sentiments).positiveCount}
                </div>
              </div>
              <div>
                <div className="font-medium text-red-600">Negative</div>
                <div className="text-lg font-bold text-red-600">
                  {calculateSentimentCounts(comments, sentiments).negativeCount}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-600">Neutral</div>
                <div className="text-lg font-bold text-gray-600">
                  {calculateSentimentCounts(comments, sentiments).neutralCount}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={saveAnalysisData}
                disabled={savingAnalysis || !summary}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {savingAnalysis ? "Saving..." : "Save Analysis Data"}
              </button>
            </div>
          </div>
        )}

        {summary && (
          <div className="border rounded p-3 bg-gray-50">
            <div className="font-medium mb-1">Summary</div>
            <div className="text-sm">{summary}</div>
          </div>
        )}
        {wordcloudB64 && (
          <div className="border rounded p-3 bg-gray-50">
            <div className="font-medium mb-2">Word Cloud</div>
            <img
              alt="wordcloud"
              className="w-full h-auto"
              src={`data:image/png;base64,${wordcloudB64}`}
            />
          </div>
        )}

        {wordcloudWords.length > 0 && (
          <div className="border rounded p-3 bg-gray-50">
            <div className="font-medium mb-2">Top Words (from Word Cloud)</div>
            <div className="flex flex-wrap gap-2">
              {wordcloudWords.map((word, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
        {loading && <div>Loading...</div>}
        {!loading && comments.length === 0 && <div>No comments</div>}
        {!loading &&
          comments.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="text-sm text-gray-600">{c.legislationId}</div>
              <div className="mt-1">{c.text}</div>
              {sentiments[c.id] && (
                <div className="mt-2 text-xs">
                  sentiment: {sentiments[c.id].label || "-"},{" "}
                  {Number(sentiments[c.id].score || 0).toFixed(4)}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
