import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { resolveThreat } from "@/services/threatService";
import { toast } from "sonner";
import type { FirestoreThreat } from "@/services/threatService";

const sevStyle: Record<string, string> = {
  Critical: "bg-cyber-red/10 text-cyber-red border-cyber-red/30",
  High: "bg-cyber-amber/10 text-cyber-amber border-cyber-amber/30",
  Medium: "bg-cyber-violet/10 text-cyber-violet border-cyber-violet/30",
  Low: "bg-cyber-green/10 text-cyber-green border-cyber-green/30",
};

const MITRE_NAMES: Record<string, string> = {
  T1566: "Phishing",
  T1110: "Brute Force Login",
  T1071: "C2 Beaconing",
};

interface ActivityFeedProps {
  threats: FirestoreThreat[];
  loading: boolean;
}

export function ActivityFeed({ threats, loading }: ActivityFeedProps) {
  const { user, isAdmin } = useAuth();

  const handleResolve = async (threatId: string) => {
    try {
      await resolveThreat(threatId, user?.email || "unknown");
      toast.success("Threat resolved successfully");
    } catch (err) {
      toast.error("Failed to resolve threat");
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="mb-4 text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">Activity Feed</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const activeThreats = threats.filter((t) => t.status === "active");

  return (
    <div className="glass-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
          Activity Feed — {activeThreats.length} Active Threats
        </h3>
        <ShieldAlert className="h-4 w-4 text-destructive" />
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-2">
          <AnimatePresence>
            {activeThreats.slice(0, 30).map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`rounded-lg border p-3 ${sevStyle[t.severity]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold">{t.threat_type}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{t.severity}</Badge>
                      {t.mitre_technique && (
                        <Badge className="text-[9px] font-mono bg-primary/20 text-primary border-primary/30">
                          {t.mitre_technique} {MITRE_NAMES[t.mitre_technique] && `• ${MITRE_NAMES[t.mitre_technique]}`}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-mono text-muted-foreground">
                      <span>SRC: {t.ip_address}</span>
                      <span>DST: {t.target_ip}</span>
                      <span>Country: {t.country}</span>
                      <span>Rep: {t.reputation_score}</span>
                      <span>Intel: {t.intel_source}</span>
                      <span>Vector: {t.attack_vector}</span>
                      <span>Detect: {t.detection_source}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-[10px] font-mono gap-1 border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10"
                      onClick={() => handleResolve(t.id)}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Resolve
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
