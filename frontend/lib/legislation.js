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
  if (!(currentDate instanceof Date)) currentDate = new Date(currentDate);
  if (!(endDate instanceof Date)) endDate = new Date(endDate);
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
}

export async function addLegislation({
  legislationId,
  title,
  description,
  startDate,
  endDate,
}) {
  if (!legislationId || !title || !description || !startDate || !endDate) {
    throw new Error("Missing required fields for legislation");
  }

  const status = computeStatusForDates(new Date(), endDate);

  const docRef = doc(collection(db, COLLECTION_NAME), legislationId);
  await setDoc(docRef, {
    legislationId,
    title,
    description,
    status,
    startDate, // expected format: YYYY-MM-DD
    endDate, // expected format: YYYY-MM-DD
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, status };
}

export async function getLegislationById(legislationId) {
  const ref = doc(db, COLLECTION_NAME, legislationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listLegislation({ status } = {}) {
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
  return res.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export { computeStatusForDates };


