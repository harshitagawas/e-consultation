import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION_NAME = "legislation";

function computeStatusForDates(currentDate, endDate) {
  try {
    if (!(currentDate instanceof Date)) currentDate = new Date(currentDate);
    if (!(endDate instanceof Date)) endDate = new Date(endDate);

    // Check if dates are valid
    if (isNaN(currentDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date provided");
    }

    const currentYmd = new Date(
      Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      )
    );
    const endYmd = new Date(
      Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    );
    return currentYmd <= endYmd ? "active" : "inactive";
  } catch (error) {
    console.error("Error computing status for dates:", error);
    return "active"; // Default status
  }
}

export async function addLegislation({
  legislationId,
  title,
  description,
  startDate,
  endDate,
}) {
  try {
    console.log("Adding legislation with data:", {
      legislationId,
      title,
      description,
      startDate,
      endDate,
    });

    // Validate required fields
    if (!legislationId || !title || !description || !startDate || !endDate) {
      throw new Error(
        `Missing required fields for legislation. Received: ${JSON.stringify({
          legislationId: !!legislationId,
          title: !!title,
          description: !!description,
          startDate: !!startDate,
          endDate: !!endDate,
        })}`
      );
    }

    // Validate Firebase connection
    if (!db) {
      throw new Error("Firebase database connection not available");
    }

    const status = computeStatusForDates(new Date(), endDate);

    // Use legislationId as document ID directly
    const docRef = doc(db, COLLECTION_NAME, legislationId);

    const legislationData = {
      legislationId,
      title,
      description,
      status,
      startDate, // expected format: YYYY-MM-DD
      endDate, // expected format: YYYY-MM-DD
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("Attempting to save legislation data:", legislationData);

    await setDoc(docRef, legislationData);

    console.log("Successfully added legislation with ID:", docRef.id);
    return { id: docRef.id, status };
  } catch (error) {
    console.error("Error adding legislation:", error);
    throw new Error(`Failed to add legislation: ${error.message}`);
  }
}

export async function getLegislationById(legislationId) {
  try {
    if (!legislationId) {
      throw new Error("legislationId is required");
    }

    console.log("Fetching legislation with ID:", legislationId);

    const ref = doc(db, COLLECTION_NAME, legislationId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log("No legislation found with ID:", legislationId);
      return null;
    }

    const data = { id: snap.id, ...snap.data() };
    console.log("Retrieved legislation:", data);
    return data;
  } catch (error) {
    console.error("Error getting legislation by ID:", error);
    throw new Error(`Failed to get legislation: ${error.message}`);
  }
}

export async function listLegislation({ status } = {}) {
  try {
    console.log("Listing legislation with status filter:", status);

    let q;
    if (status) {
      q = query(
        collection(db, COLLECTION_NAME),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    }

    const res = await getDocs(q);
    const legislations = res.docs.map((d) => ({ id: d.id, ...d.data() }));

    console.log(`Retrieved ${legislations.length} legislations`);
    return legislations;
  } catch (error) {
    console.error("Error listing legislation:", error);
    throw new Error(`Failed to list legislation: ${error.message}`);
  }
}

export { computeStatusForDates };

// Comments helpers
const COMMENTS_COLLECTION = "comments";

export async function addComment({
  legislationId,
  text,
  rating,
  sentimentLabel,
  sentimentScore,
}) {
  try {
    if (!legislationId || !text) {
      throw new Error("Missing required fields for comment");
    }

    const commentId = `${legislationId}_${Date.now()}`;
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);

    const commentData = {
      commentId,
      legislationId,
      text,
      rating: typeof rating === "number" ? rating : null,
      sentimentLabel: sentimentLabel || null,
      sentimentScore:
        typeof sentimentScore === "number" ? sentimentScore : null,
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, commentData);
    return { id: docRef.id };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw new Error(`Failed to add comment: ${error.message}`);
  }
}

export async function listComments({ legislationId } = {}) {
  try {
    let q;
    if (legislationId) {
      // Only filter by legislationId without ordering
      q = query(
        collection(db, COMMENTS_COLLECTION),
        where("legislationId", "==", legislationId)
      );
    } else {
      // Get all comments without ordering
      q = collection(db, COMMENTS_COLLECTION);
    }
    const res = await getDocs(q);
    
    // Sort comments by createdAt client-side
    const comments = res.docs.map((d) => ({ id: d.id, ...d.data() }));
    return comments.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA; // descending order
    });
  } catch (error) {
    console.error("Error listing comments:", error);
    throw new Error(`Failed to list comments: ${error.message}`);
  }
}

// Analysis sub-database helpers
const ANALYSIS_COLLECTION = "analysis";

export async function saveAnalysis({
  legislationId,
  totalComments,
  positiveCommentCount,
  negativeCommentCount,
  neutralCommentCount,
  overallSummary,
  topWords,
}) {
  try {
    if (!legislationId) {
      throw new Error("Missing required field: legislationId");
    }

    const analysisId = `${legislationId}_analysis_${Date.now()}`;
    const docRef = doc(db, ANALYSIS_COLLECTION, analysisId);

    const analysisData = {
      legislationId,
      totalComments: totalComments || 0,
      positiveCommentCount: positiveCommentCount || 0,
      negativeCommentCount: negativeCommentCount || 0,
      neutralCommentCount: neutralCommentCount || 0,
      overallSummary: overallSummary || "",
      topWords: topWords || [],
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, analysisData);
    return { id: docRef.id };
  } catch (error) {
    console.error("Error saving analysis:", error);
    throw new Error(`Failed to save analysis: ${error.message}`);
  }
}

export async function getAnalysisByLegislationId(legislationId) {
  try {
    if (!legislationId) {
      throw new Error("Missing required field: legislationId");
    }

    const q = query(
      collection(db, ANALYSIS_COLLECTION),
      where("legislationId", "==", legislationId),
      orderBy("timestamp", "desc")
    );

    const res = await getDocs(q);
    return res.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting analysis by legislation ID:", error);
    throw new Error(`Failed to get analysis: ${error.message}`);
  }
}

export async function getAllAnalysis() {
  try {
    const q = query(
      collection(db, ANALYSIS_COLLECTION),
      orderBy("timestamp", "desc")
    );
    const res = await getDocs(q);
    return res.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting all analysis:", error);
    throw new Error(`Failed to get all analysis: ${error.message}`);
  }
}
