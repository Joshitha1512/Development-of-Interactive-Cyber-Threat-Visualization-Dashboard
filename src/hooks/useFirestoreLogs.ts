import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, limit, Timestamp } from "firebase/firestore";

export interface LogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: Timestamp | null;
  [key: string]: unknown;
}

export function useFirestoreLogs(collectionName = "logs", maxItems = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, collectionName),
      orderBy("timestamp", "desc"),
      limit(maxItems)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LogEntry[];
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error(`Failed to subscribe to ${collectionName}:`, error);
      setLoading(false);
    });

    return unsub;
  }, [collectionName, maxItems]);

  return { logs, loading };
}
