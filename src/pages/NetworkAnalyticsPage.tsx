import { useTrafficFlows, useTrafficTimeSeries } from "@/hooks/useCyberData";
import { useMemo } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const COLORS = {
  cyan: "hsl(185, 100%, 50%)",
  violet: "hsl(270, 80%, 60%)",
  green: "hsl(145, 80%, 50%)",
  amber: "hsl(40, 95%, 55%)",
  red: "hsl(0, 85%, 55%)",
};

export default function NetworkAnalyticsPage() {
  const flows = useTrafficFlows(300);
  const timeSeries = useTrafficTimeSeries();

  const portAttacks = useMemo(() => {
    const counts: Record<number, number> = {};
    flows.filter(f => f.label !== "benign").forEach(f => { counts[f.destination_port] = (counts[f.destination_port] || 0) + 1; });
    return Object.entries(counts).map(([p, c]) => ({ port: `Port ${p}`, attacks: c })).sort((a, b) => b.attacks - a.attacks).slice(0, 8);
  }, [flows]);

  const trafficRatio = useMemo(() => {
    const counts = { benign: 0, malicious: 0, suspicious: 0 };
    flows.forEach(f => counts[f.label]++);
    return [
      { name: "Benign", value: counts.benign, color: COLORS.green },
      { name: "Malicious", value: counts.malicious, color: COLORS.red },
      { name: "Suspicious", value: counts.suspicious, color: COLORS.amber },
    ];
  }, [flows]);

  const durationDist = useMemo(() => {
    const buckets = [
      { range: "<1s", count: 0 }, { range: "1-10s", count: 0 },
      { range: "10-60s", count: 0 }, { range: "1-5m", count: 0 }, { range: ">5m", count: 0 },
    ];
    flows.forEach(f => {
      const d = f.flow_duration;
      if (d < 1000) buckets[0].count++;
      else if (d < 10000) buckets[1].count++;
      else if (d < 60000) buckets[2].count++;
      else if (d < 300000) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [flows]);

  const suspiciousAlerts = useMemo(() =>
    flows.filter(f => f.label !== "benign").slice(0, 8).map(f => ({
      port: f.destination_port,
      label: f.label,
      bytes: f.flow_bytes_per_sec,
      packets: f.flow_packets_per_sec,
    })), [flows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Network Traffic Analytics</h1>
        <p className="text-sm text-muted-foreground font-mono">Real-time flow analysis</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Flow Bytes/sec Trend (Live)" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="bytesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
              <Tooltip />
              <Area type="monotone" dataKey="bytes" stroke={COLORS.cyan} fill="url(#bytesGrad)" strokeWidth={2} dot={false} name="Bytes/sec" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Malicious vs Benign Ratio">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={trafficRatio} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                {trafficRatio.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {trafficRatio.map(r => (
              <div key={r.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-[10px] font-mono text-muted-foreground">{r.name}: {r.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Top Attacked Ports">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={portAttacks}>
              <XAxis dataKey="port" tick={{ fontSize: 9, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="attacks" fill={COLORS.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Packet Rate Analysis">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeSeries}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip />
              <Line type="monotone" dataKey="packets" stroke={COLORS.violet} strokeWidth={2} dot={false} name="Packets/sec" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Flow Duration Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={durationDist}>
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(200,15%,55%)" }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.amber} radius={[4, 4, 0, 0]} name="Flows" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Suspicious Alerts */}
      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="mb-4 text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">Suspicious Traffic Alerts</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          {suspiciousAlerts.map((a, i) => (
            <div key={i} className={`rounded-lg border p-3 ${a.label === "malicious" ? "border-cyber-red/20 bg-cyber-red/5" : "border-cyber-amber/20 bg-cyber-amber/5"}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-foreground">Port {a.port}</span>
                <span className={`text-[10px] font-mono uppercase ${a.label === "malicious" ? "text-cyber-red" : "text-cyber-amber"}`}>{a.label}</span>
              </div>
              <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                {(a.bytes / 1e6).toFixed(2)} MB/s • {a.packets.toLocaleString()} pkt/s
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
