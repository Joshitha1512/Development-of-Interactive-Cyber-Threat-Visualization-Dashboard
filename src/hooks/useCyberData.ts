import { useState, useEffect, useCallback, useRef } from "react";

// Types
export interface Asset {
  id: string;
  ip_address: string;
  hostname: string;
  os_type: string;
  open_ports: number[];
  services: string[];
  scan_time: string;
  risk_score: number;
  created_at: string;
}

export interface ThreatLog {
  id: string;
  source_ip: string;
  abuse_confidence_score: number;
  country: string;
  usage_type: string;
  isp: string;
  domain: string;
  total_reports: number;
  last_reported_at: string;
  severity: "critical" | "high" | "medium" | "low";
  feed_source: string;
  created_at: string;
}

export interface MitreEntry {
  mitre_id: string;
  technique_name: string;
  tactic: string;
  severity_level: "critical" | "high" | "medium" | "low";
}

export interface TrafficFlow {
  id: string;
  destination_port: number;
  flow_duration: number;
  total_fwd_packets: number;
  total_backward_packets: number;
  flow_bytes_per_sec: number;
  flow_packets_per_sec: number;
  label: "benign" | "malicious" | "suspicious";
}

export interface KPIData {
  totalAssets: number;
  highRiskAssets: number;
  activeThreatSources: number;
  criticalMitre: number;
  avgRiskScore: number;
  liveAlerts: number;
}

// Data generators
const countries = ["US", "CN", "RU", "DE", "BR", "IN", "KR", "JP", "IR", "NG", "UA", "RO", "NL", "GB", "FR"];
const osTypes = ["Linux", "Windows Server 2022", "Ubuntu 22.04", "CentOS 8", "Windows 11", "macOS Ventura", "FreeBSD 14", "Debian 12"];
const hostPrefixes = ["web", "db", "api", "auth", "proxy", "cache", "mail", "dns", "vpn", "fw", "ids", "log", "app", "cdn", "lb"];
const domains = ["malware-c2.net", "phish-kit.xyz", "botnet-relay.ru", "darkweb-market.onion", "exploit-kit.cn", "ransom-pay.io"];
const isps = ["OVH SAS", "DigitalOcean", "Hetzner", "Alibaba Cloud", "Linode", "Vultr", "AWS", "Azure", "GCP"];
const feedSources = ["AbuseIPDB", "AlienVault OTX", "VirusTotal", "Shodan", "GreyNoise", "Censys", "ThreatFox"];
const services = ["nginx/1.24", "Apache/2.4", "OpenSSH/9.5", "MySQL/8.0", "PostgreSQL/16", "Redis/7.2", "MongoDB/7.0", "Elasticsearch/8.12", "Docker/25.0"];
const mitreTechniques: MitreEntry[] = [
  { mitre_id: "T1190", technique_name: "Exploit Public-Facing App", tactic: "Initial Access", severity_level: "critical" },
  { mitre_id: "T1059", technique_name: "Command & Scripting Interpreter", tactic: "Execution", severity_level: "high" },
  { mitre_id: "T1053", technique_name: "Scheduled Task/Job", tactic: "Persistence", severity_level: "medium" },
  { mitre_id: "T1078", technique_name: "Valid Accounts", tactic: "Defense Evasion", severity_level: "critical" },
  { mitre_id: "T1003", technique_name: "OS Credential Dumping", tactic: "Credential Access", severity_level: "critical" },
  { mitre_id: "T1021", technique_name: "Remote Services", tactic: "Lateral Movement", severity_level: "high" },
  { mitre_id: "T1071", technique_name: "Application Layer Protocol", tactic: "Command & Control", severity_level: "high" },
  { mitre_id: "T1048", technique_name: "Exfiltration Over Alternative Protocol", tactic: "Exfiltration", severity_level: "critical" },
  { mitre_id: "T1486", technique_name: "Data Encrypted for Impact", tactic: "Impact", severity_level: "critical" },
  { mitre_id: "T1566", technique_name: "Phishing", tactic: "Initial Access", severity_level: "high" },
  { mitre_id: "T1055", technique_name: "Process Injection", tactic: "Privilege Escalation", severity_level: "high" },
  { mitre_id: "T1070", technique_name: "Indicator Removal", tactic: "Defense Evasion", severity_level: "medium" },
];

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomIp = () => `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;

function generateAsset(i: number): Asset {
  const ports = Array.from({ length: randomInt(1, 6) }, () => randomItem([22, 80, 443, 3306, 5432, 6379, 8080, 8443, 27017, 3389, 21, 25, 53, 9200, 9300]));
  return {
    id: `asset-${i}`,
    ip_address: `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    hostname: `${randomItem(hostPrefixes)}-${String(randomInt(1, 99)).padStart(2, "0")}.corp.local`,
    os_type: randomItem(osTypes),
    open_ports: [...new Set(ports)],
    services: [...new Set(ports)].slice(0, 3).map(() => randomItem(services)),
    scan_time: new Date(Date.now() - randomInt(0, 86400000)).toISOString(),
    risk_score: randomInt(5, 100),
    created_at: new Date(Date.now() - randomInt(0, 30 * 86400000)).toISOString(),
  };
}

function generateThreatLog(i: number): ThreatLog {
  const severities: ThreatLog["severity"][] = ["critical", "high", "medium", "low"];
  return {
    id: `threat-${i}`,
    source_ip: randomIp(),
    abuse_confidence_score: randomInt(10, 100),
    country: randomItem(countries),
    usage_type: randomItem(["Data Center/Web Hosting", "ISP", "Content Delivery", "Enterprise", "Government"]),
    isp: randomItem(isps),
    domain: randomItem(domains),
    total_reports: randomInt(1, 5000),
    last_reported_at: new Date(Date.now() - randomInt(0, 604800000)).toISOString(),
    severity: randomItem(severities),
    feed_source: randomItem(feedSources),
    created_at: new Date(Date.now() - randomInt(0, 30 * 86400000)).toISOString(),
  };
}

function generateTrafficFlow(i: number): TrafficFlow {
  return {
    id: `flow-${i}`,
    destination_port: randomItem([80, 443, 22, 3389, 8080, 53, 25, 3306, 5432, 445]),
    flow_duration: randomInt(100, 300000),
    total_fwd_packets: randomInt(1, 10000),
    total_backward_packets: randomInt(1, 8000),
    flow_bytes_per_sec: randomInt(100, 5000000),
    flow_packets_per_sec: randomInt(1, 50000),
    label: randomItem(["benign", "benign", "benign", "malicious", "suspicious"]),
  };
}

// Hooks
export function useAssets(count = 50) {
  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => {
    setAssets(Array.from({ length: count }, (_, i) => generateAsset(i)));
    const interval = setInterval(() => {
      setAssets(prev => {
        const updated = [...prev];
        const idx = randomInt(0, updated.length - 1);
        updated[idx] = { ...updated[idx], risk_score: randomInt(5, 100), scan_time: new Date().toISOString() };
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [count]);
  return assets;
}

export function useThreatLogs(count = 80) {
  const [logs, setLogs] = useState<ThreatLog[]>([]);
  useEffect(() => {
    setLogs(Array.from({ length: count }, (_, i) => generateThreatLog(i)));
    const interval = setInterval(() => {
      setLogs(prev => [generateThreatLog(Date.now()), ...prev.slice(0, count - 1)]);
    }, 5000);
    return () => clearInterval(interval);
  }, [count]);
  return logs;
}

export function useMitreMap() {
  return mitreTechniques;
}

export function useTrafficFlows(count = 200) {
  const [flows, setFlows] = useState<TrafficFlow[]>([]);
  useEffect(() => {
    setFlows(Array.from({ length: count }, (_, i) => generateTrafficFlow(i)));
    const interval = setInterval(() => {
      setFlows(prev => {
        const updated = [generateTrafficFlow(Date.now()), ...prev.slice(0, count - 1)];
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [count]);
  return flows;
}

export function useKPIs(assets: Asset[], threats: ThreatLog[], mitre: MitreEntry[]) {
  const [kpis, setKpis] = useState<KPIData>({
    totalAssets: 0, highRiskAssets: 0, activeThreatSources: 0,
    criticalMitre: 0, avgRiskScore: 0, liveAlerts: 0,
  });
  useEffect(() => {
    const highRisk = assets.filter(a => a.risk_score >= 75).length;
    const avg = assets.length ? Math.round(assets.reduce((s, a) => s + a.risk_score, 0) / assets.length) : 0;
    const critical = mitre.filter(m => m.severity_level === "critical").length;
    setKpis({
      totalAssets: assets.length,
      highRiskAssets: highRisk,
      activeThreatSources: threats.length,
      criticalMitre: critical,
      avgRiskScore: avg,
      liveAlerts: randomInt(3, 25),
    });
  }, [assets, threats, mitre]);
  return kpis;
}

export function useRealtimeStatus() {
  const [status, setStatus] = useState<"connected" | "reconnecting" | "offline">("connected");
  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.random();
      setStatus(r > 0.05 ? "connected" : "reconnecting");
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  return status;
}

export function useTrafficTimeSeries() {
  const [series, setSeries] = useState<{ time: string; bytes: number; packets: number; threats: number }[]>([]);
  const counterRef = useRef(0);
  
  useEffect(() => {
    const initial = Array.from({ length: 30 }, (_, i) => ({
      time: new Date(Date.now() - (30 - i) * 2000).toLocaleTimeString(),
      bytes: randomInt(500000, 5000000),
      packets: randomInt(1000, 50000),
      threats: randomInt(0, 15),
    }));
    setSeries(initial);
    
    const interval = setInterval(() => {
      setSeries(prev => [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString(),
          bytes: randomInt(500000, 5000000),
          packets: randomInt(1000, 50000),
          threats: randomInt(0, 15),
        },
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return series;
}
