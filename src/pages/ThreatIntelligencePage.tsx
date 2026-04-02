import { useThreatLogs } from "@/hooks/useCyberData";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/dashboard/ChartCard";

const sevColor: Record<string, string> = {
  critical: "bg-cyber-red/10 text-cyber-red border-cyber-red/20",
  high: "bg-cyber-amber/10 text-cyber-amber border-cyber-amber/20",
  medium: "bg-cyber-violet/10 text-cyber-violet border-cyber-violet/20",
  low: "bg-cyber-green/10 text-cyber-green border-cyber-green/20",
};

export default function ThreatIntelligencePage() {
  const threats = useThreatLogs(100);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const countries = useMemo(() => [...new Set(threats.map(t => t.country))].sort(), [threats]);

  const filtered = useMemo(() => {
    let result = threats;
    if (search) result = result.filter(t => t.source_ip.includes(search) || t.domain.includes(search));
    if (sevFilter !== "all") result = result.filter(t => t.severity === sevFilter);
    if (countryFilter !== "all") result = result.filter(t => t.country === countryFilter);
    return result;
  }, [threats, search, sevFilter, countryFilter]);

  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(t => { counts[t.country] = (counts[t.country] || 0) + 1; });
    return Object.entries(counts).map(([c, v]) => ({ country: c, threats: v })).sort((a, b) => b.threats - a.threats).slice(0, 10);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Threat Intelligence</h1>
        <p className="text-sm text-muted-foreground font-mono">{filtered.length} active threat sources</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search IP or domain..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-border font-mono text-sm" />
        </div>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="w-[150px] bg-muted border-border font-mono text-sm"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {["critical", "high", "medium", "low"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[140px] bg-muted border-border font-mono text-sm"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 glass-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Source IP", "Country", "Confidence", "Severity", "Reports", "Feed", "Last Reported"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map((t) => (
                  <motion.tr key={t.id} layout className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-sm text-primary">{t.source_ip}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-muted-foreground" />{t.country}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-foreground">{t.abuse_confidence_score}%</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase ${sevColor[t.severity]}`}>{t.severity}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{t.total_reports.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{t.feed_source}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{new Date(t.last_reported_at).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ChartCard title="Threats by Country">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={countryData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} width={40} />
              <Tooltip />
              <Bar dataKey="threats" fill="hsl(40,95%,55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
