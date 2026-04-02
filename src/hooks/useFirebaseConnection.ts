import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useFirebaseConnection() {
  const [status, setStatus] = useState<"connected" | "reconnecting" | "offline">("reconnecting");

  useEffect(() => {
    try {
      const connectedRef = ref(rtdb, ".info/connected");

      const unsub = onValue(connectedRef, (snap) => {
        setStatus(snap.val() === true ? "connected" : "offline");
      });

      return () => unsub();
    } catch {
      // Fall back to online/offline detection if RTDB not available
      const handleOnline = () => setStatus("connected");
      const handleOffline = () => setStatus("offline");

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      setStatus(navigator.onLine ? "connected" : "offline");

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return status;
}
