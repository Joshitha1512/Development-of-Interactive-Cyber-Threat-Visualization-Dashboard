import { useFirestoreLogs } from "@/hooks/useFirestoreLogs";
import { Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface TimelinePanelProps {
  collectionName?: string;
  title?: string;
  maxItems?: number;
}

export function TimelinePanel({ collectionName = "logs", title = "Timeline", maxItems = 30 }: TimelinePanelProps) {
  const { logs, loading } = useFirestoreLogs(collectionName, maxItems);

  return (
    <div className="glass-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">{title}</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground font-mono text-center py-4">No entries yet</p>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-2">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-medium text-foreground">{log.action}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-mono text-muted-foreground">{log.user}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {log.timestamp?.toDate?.()?.toLocaleString?.() || "—"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
