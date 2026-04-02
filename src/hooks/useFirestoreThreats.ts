import { useEffect, useRef, useState } from "react";
import { subscribeToActiveThreats, startThreatSimulation, stopThreatSimulation, subscribeToThreats, type FirestoreThreat } from "@/services/threatService";
import { toast } from "sonner";

export function useFirestoreThreats(activeOnly = false) {
  const [threats, setThreats] = useState<FirestoreThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    startThreatSimulation(7000);

    const subscribeFn = activeOnly ? subscribeToActiveThreats : subscribeToThreats;
    const unsub = subscribeFn((data) => {
      setThreats(data);
      setLoading(false);

      const prevIds = prevIdsRef.current;
      if (prevIds.size > 0) {
        data.forEach((t) => {
          if (!prevIds.has(t.id) && (t.severity === "Critical" || t.severity === "High")) {
            toast.error(`${t.severity} Threat Detected`, {
              description: `${t.threat_type} from ${t.ip_address} (${t.country})`,
              duration: 5000,
            });
          }
        });
      }
      prevIdsRef.current = new Set(data.map((t) => t.id));
    });

    return () => {
      unsub();
      stopThreatSimulation();
    };
  }, [activeOnly]);

  const totalThreats = threats.length;
  const criticalCount = threats.filter((t) => t.severity === "Critical").length;
  const highCount = threats.filter((t) => t.severity === "High").length;
  const activeCount = threats.filter((t) => t.status === "active").length;
  const resolvedCount = threats.filter((t) => t.status === "resolved").length;
  const avgReputation = threats.length
    ? Math.round(threats.reduce((s, t) => s + t.reputation_score, 0) / threats.length)
    : 0;

  return { threats, loading, totalThreats, criticalCount, highCount, activeCount, resolvedCount, avgReputation };
}
