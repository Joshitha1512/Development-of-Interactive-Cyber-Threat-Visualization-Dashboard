import { Server, ShieldAlert, AlertTriangle, Activity, Gauge, Bell, CheckCircle, Globe } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Line } from "recharts";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ThreatRadar } from "@/components/dashboard/ThreatRadar";
import { ThreatFilters } from "@/components/dashboard/ThreatFilters";
import { DownloadReport } from "@/components/dashboard/DownloadReport";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TimelinePanel } from "@/components/dashboard/TimelinePanel";
import { useAssets, useKPIs, useTrafficTimeSeries } from "@/hooks/useCyberData";
import { useFirestoreThreats } from "@/hooks/useFirestoreThreats";
import { useMemo, useState } from "react";

const CHART_COLORS = {
  cyan: "hsl(185, 100%, 50%)",
  violet: "hsl(270, 80%, 60%)",
  green: "hsl(145, 80%, 50%)",
  amber: "hsl(40, 95%, 55%)",
  red: "hsl(0, 85%, 55%)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-border px-3 py-2 text-xs font-mono">
      <p className="text-muted-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const assets = useAssets(50);
  const { threats: firestoreThreats, totalThreats, criticalCount, highCount, activeCount, resolvedCount, avgReputation, loading } = useFirestoreThreats();
  const timeSeries = useTrafficTimeSeries();
  const kpis = useKPIs(assets, [], []);

  const [sevFilter, setSevFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredThreats = useMemo(() => {
    let result = firestoreThreats;
    if (sevFilter !== "all") result = result.filter((t) => t.severity === sevFilter);
    if (typeFilter !== "all") result = result.filter((t) => t.threat_type === typeFilter);
    return result;
  }, [firestoreThreats, sevFilter, typeFilter]);

  const severityDist = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    firestoreThreats.forEach(t => counts[t.severity]++);
    return [
      { name: "Critical", value: counts.Critical, color: CHART_COLORS.red },
      { name: "High", value: counts.High, color: CHART_COLORS.amber },
      { name: "Medium", value: counts.Medium, color: CHART_COLORS.violet },
      { name: "Low", value: counts.Low, color: CHART_COLORS.green },
    ];
  }, [firestoreThreats]);

  const countryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredThreats.forEach(t => { counts[t.country] = (counts[t.country] || 0) + 1; });
    return Object.entries(counts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredThreats]);

  const typeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredThreats.forEach(t => { counts[t.threat_type] = (counts[t.threat_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredThreats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground font-mono">Real-time security posture overview</p>
        </div>
        <div className="flex items-center gap-3">
          <ThreatFilters severity={sevFilter} onSeverityChange={setSevFilter} threatType={typeFilter} onThreatTypeChange={setTypeFilter} />
          <DownloadReport threats={filteredThreats} totalThreats={totalThreats} criticalCount={criticalCount} highCount={highCount} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard title="Total Threats" value={totalThreats} icon={ShieldAlert} variant="amber" />
        <KPICard title="Active Threats" value={activeCount} icon={AlertTriangle} variant="red" />
        <KPICard title="Resolved" value={resolvedCount} icon={CheckCircle} variant="green" />
        <KPICard title="Critical" value={criticalCount} icon={Activity} variant="red" />
        <KPICard title="Avg Reputation" value={avgReputation} icon={Gauge} variant="cyan" />
        <KPICard title="Top Country" value={countryDist[0]?.country || "—"} icon={Globe} variant="amber" />
      </div>

      {/* Threat Map */}
      <ThreatRadar threats={filteredThreats} />

      {/* Activity Feed + Timeline */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActivityFeed threats={filteredThreats} loading={loading} />
        <TimelinePanel collectionName="logs" title="Security Timeline" />
      </div>

      {/* Row 1: Traffic + Severity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Traffic Flow Trends (Live)" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.cyan} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="bytes" stroke={CHART_COLORS.cyan} fill="url(#flowGrad)" strokeWidth={2} name="Bytes/sec" dot={false} />
              <Line type="monotone" dataKey="threats" stroke={CHART_COLORS.red} strokeWidth={2} name="Threats" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Threat Severity Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={severityDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                {severityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {severityDist.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-mono text-muted-foreground">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Top Threat Countries">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={countryDist}>
              <XAxis dataKey="country" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Threats" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Threats by Type">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none" paddingAngle={2}>
                {typeDist.map((_, i) => <Cell key={i} fill={[CHART_COLORS.red, CHART_COLORS.amber, CHART_COLORS.violet, CHART_COLORS.cyan][i % 4]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {typeDist.map((o) => (
              <span key={o.name} className="text-[10px] font-mono text-muted-foreground">{o.name}: {o.value}</span>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
