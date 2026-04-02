import { useAssets, useThreatLogs, useMitreMap } from "@/hooks/useCyberData";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Server } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Asset } from "@/hooks/useCyberData";

const riskColor = (score: number) =>
  score >= 80 ? "text-cyber-red" : score >= 60 ? "text-cyber-amber" : score >= 40 ? "text-cyber-violet" : "text-cyber-green";

const riskBg = (score: number) =>
  score >= 80 ? "bg-cyber-red/10 border-cyber-red/20" : score >= 60 ? "bg-cyber-amber/10 border-cyber-amber/20" : score >= 40 ? "bg-cyber-violet/10 border-cyber-violet/20" : "bg-cyber-green/10 border-cyber-green/20";

export default function AssetIntelligencePage() {
  const assets = useAssets(50);
  const threats = useThreatLogs(80);
  const mitre = useMitreMap();
  const [search, setSearch] = useState("");
  const [osFilter, setOsFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"risk_score" | "hostname">("risk_score");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const osTypes = useMemo(() => [...new Set(assets.map(a => a.os_type))], [assets]);

  const filtered = useMemo(() => {
    let result = assets;
    if (search) result = result.filter(a => a.hostname.toLowerCase().includes(search.toLowerCase()) || a.ip_address.includes(search));
    if (osFilter !== "all") result = result.filter(a => a.os_type === osFilter);
    return [...result].sort((a, b) => sortBy === "risk_score" ? b.risk_score - a.risk_score : a.hostname.localeCompare(b.hostname));
  }, [assets, search, osFilter, sortBy]);

  const portData = useMemo(() => {
    if (!selectedAsset) return [];
    return selectedAsset.open_ports.map(p => ({ port: String(p), exposure: Math.floor(Math.random() * 100) }));
  }, [selectedAsset]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Asset Intelligence</h1>
        <p className="text-sm text-muted-foreground font-mono">{filtered.length} assets monitored</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search hostname or IP..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-border font-mono text-sm" />
        </div>
        <Select value={osFilter} onValueChange={setOsFilter}>
          <SelectTrigger className="w-[180px] bg-muted border-border font-mono text-sm">
            <SelectValue placeholder="Filter OS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All OS</SelectItem>
            {osTypes.map(os => <SelectItem key={os} value={os}>{os}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[160px] bg-muted border-border font-mono text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="risk_score">Sort by Risk</SelectItem>
            <SelectItem value="hostname">Sort by Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Hostname", "IP Address", "OS Type", "Open Ports", "Services", "Risk Score", "Last Scan"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <motion.tr
                  key={asset.id}
                  layout
                  className="border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <td className="px-4 py-3 font-mono text-sm text-foreground">{asset.hostname}</td>
                  <td className="px-4 py-3 font-mono text-sm text-primary">{asset.ip_address}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{asset.os_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {asset.open_ports.slice(0, 4).map(p => (
                        <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{p}</span>
                      ))}
                      {asset.open_ports.length > 4 && <span className="text-[10px] text-muted-foreground">+{asset.open_ports.length - 4}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-[200px] truncate">{asset.services.join(", ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-sm font-bold ${riskBg(asset.risk_score)} ${riskColor(asset.risk_score)}`}>
                      {asset.risk_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{new Date(asset.scan_time).toLocaleTimeString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <SheetContent className="w-[480px] bg-card border-border overflow-y-auto">
          {selectedAsset && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-foreground font-mono">
                  <Server className="h-5 w-5 text-primary" />
                  {selectedAsset.hostname}
                </SheetTitle>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["IP Address", selectedAsset.ip_address],
                  ["OS Type", selectedAsset.os_type],
                  ["Risk Score", String(selectedAsset.risk_score)],
                  ["Open Ports", String(selectedAsset.open_ports.length)],
                ].map(([label, value]) => (
                  <div key={label} className="glass-card rounded-lg p-3 border border-border">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">{label}</p>
                    <p className="text-sm font-mono font-bold text-foreground mt-1">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground mb-3">Port Exposure</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={portData}>
                    <XAxis dataKey="port" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
                    <Bar dataKey="exposure" fill="hsl(185,100%,50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground mb-3">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAsset.services.map((s, i) => (
                    <span key={i} className="rounded-lg bg-muted px-3 py-1 text-xs font-mono text-foreground border border-border">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground mb-3">Related MITRE Techniques</h4>
                <div className="space-y-2">
                  {mitre.slice(0, 4).map(m => (
                    <div key={m.mitre_id} className="glass-card rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-primary">{m.mitre_id}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${m.severity_level === "critical" ? "bg-cyber-red/10 text-cyber-red" : m.severity_level === "high" ? "bg-cyber-amber/10 text-cyber-amber" : "bg-cyber-violet/10 text-cyber-violet"}`}>{m.severity_level}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{m.technique_name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.tactic}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
