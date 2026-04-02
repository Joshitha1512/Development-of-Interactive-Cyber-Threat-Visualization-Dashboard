import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
  type Unsubscribe,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface FirestoreThreat {
  id: string;
  ip_address: string;
  target_ip: string;
  threat_type: "DDoS" | "SQLi" | "Phishing" | "Malware";
  severity: "Low" | "Medium" | "High" | "Critical";
  country: string;
  timestamp: Timestamp | null;
  lat: number;
  lng: number;
  target_lat: number;
  target_lng: number;
  status: "active" | "resolved";
  intel_source: string;
  reputation_score: number;
  mitre_technique: string;
  attack_vector: string;
  detection_source: string;
  ai_playbook_enabled: boolean;
}

const THREAT_TYPES: FirestoreThreat["threat_type"][] = ["DDoS", "SQLi", "Phishing", "Malware"];
const SEVERITIES: FirestoreThreat["severity"][] = ["Low", "Medium", "High", "Critical"];

const COUNTRIES: { name: string; lat: number; lng: number }[] = [
  { name: "US", lat: 38.0, lng: -97.0 },
  { name: "CN", lat: 35.0, lng: 105.0 },
  { name: "RU", lat: 55.75, lng: 37.62 },
  { name: "DE", lat: 51.17, lng: 10.45 },
  { name: "BR", lat: -14.24, lng: -51.93 },
  { name: "IN", lat: 20.59, lng: 78.96 },
  { name: "KR", lat: 35.91, lng: 127.77 },
  { name: "JP", lat: 36.2, lng: 138.25 },
  { name: "IR", lat: 32.43, lng: 53.69 },
  { name: "NG", lat: 9.08, lng: 8.68 },
  { name: "UA", lat: 48.38, lng: 31.17 },
  { name: "GB", lat: 55.38, lng: -3.44 },
  { name: "FR", lat: 46.23, lng: 2.21 },
  { name: "NL", lat: 52.13, lng: 5.29 },
  { name: "RO", lat: 45.94, lng: 24.97 },
];

const INTEL_SOURCES = ["AbuseIPDB", "AlienVault OTX", "VirusTotal", "Shodan", "GreyNoise", "Censys", "ThreatFox"];
const ATTACK_VECTORS = ["Network", "Email", "Web Application", "DNS", "Supply Chain", "Brute Force"];
const DETECTION_SOURCES = ["IDS/IPS", "SIEM", "Firewall", "EDR", "Honeypot", "Threat Intel Feed"];
const MITRE_TECHNIQUES = [
  { id: "T1566", name: "Phishing" },
  { id: "T1110", name: "Brute Force Login" },
  { id: "T1071", name: "Command and Control Beaconing" },
  { id: "", name: "" },
];

const TARGET = { lat: 37.77, lng: -122.42 };

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomIp = () => `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;

const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const isValidLatLng = (lat: number, lng: number) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export function normalizeThreat(id: string, data: Record<string, unknown>): FirestoreThreat | null {
  const severity = typeof data.severity === "string" && SEVERITIES.includes(data.severity as FirestoreThreat["severity"])
    ? (data.severity as FirestoreThreat["severity"])
    : "Low";

  const threatType = typeof data.threat_type === "string" && THREAT_TYPES.includes(data.threat_type as FirestoreThreat["threat_type"])
    ? (data.threat_type as FirestoreThreat["threat_type"])
    : "Malware";

  const lat = toFiniteNumber(data.lat);
  const lng = toFiniteNumber(data.lng);
  const targetLat = toFiniteNumber(data.target_lat);
  const targetLng = toFiniteNumber(data.target_lng);

  if (
    lat === null || lng === null || targetLat === null || targetLng === null ||
    !isValidLatLng(lat, lng) || !isValidLatLng(targetLat, targetLng)
  ) {
    return null;
  }

  return {
    id,
    ip_address: typeof data.ip_address === "string" ? data.ip_address : "0.0.0.0",
    target_ip: typeof data.target_ip === "string" ? data.target_ip : "0.0.0.0",
    threat_type: threatType,
    severity,
    country: typeof data.country === "string" ? data.country : "Unknown",
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp : null,
    lat,
    lng,
    target_lat: targetLat,
    target_lng: targetLng,
    status: typeof data.status === "string" ? (data.status as "active" | "resolved") : "active",
    intel_source: typeof data.intel_source === "string" ? data.intel_source : "Unknown",
    reputation_score: typeof data.reputation_score === "number" ? data.reputation_score : randomInt(10, 100),
    mitre_technique: typeof data.mitre_technique === "string" ? data.mitre_technique : "",
    attack_vector: typeof data.attack_vector === "string" ? data.attack_vector : "Unknown",
    detection_source: typeof data.detection_source === "string" ? data.detection_source : "Unknown",
    ai_playbook_enabled: typeof data.ai_playbook_enabled === "boolean" ? data.ai_playbook_enabled : false,
  };
}

function generateThreatDoc() {
  const origin = randomItem(COUNTRIES);
  const mitre = randomItem(MITRE_TECHNIQUES);
  const threatType = randomItem(THREAT_TYPES);
  return {
    ip_address: randomIp(),
    target_ip: `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    threat_type: threatType,
    severity: randomItem(SEVERITIES),
    country: origin.name,
    timestamp: serverTimestamp(),
    lat: origin.lat + (Math.random() - 0.5) * 5,
    lng: origin.lng + (Math.random() - 0.5) * 5,
    target_lat: TARGET.lat + (Math.random() - 0.5) * 2,
    target_lng: TARGET.lng + (Math.random() - 0.5) * 2,
    status: "active",
    intel_source: randomItem(INTEL_SOURCES),
    reputation_score: randomInt(10, 100),
    mitre_technique: mitre.id,
    attack_vector: randomItem(ATTACK_VECTORS),
    detection_source: randomItem(DETECTION_SOURCES),
    ai_playbook_enabled: Math.random() > 0.6,
  };
}

const threatsCol = collection(db, "threats");

export function subscribeToThreats(
  callback: (threats: FirestoreThreat[]) => void,
  maxItems = 200
): Unsubscribe {
  const q = query(threatsCol, orderBy("timestamp", "desc"), limit(maxItems));

  return onSnapshot(
    q,
    (snapshot) => {
      const threats = snapshot.docs
        .map((doc) => normalizeThreat(doc.id, doc.data() as Record<string, unknown>))
        .filter((threat): threat is FirestoreThreat => Boolean(threat));
      callback(threats);
    },
    (error) => {
      console.error("Failed to subscribe to threats:", error);
      callback([]);
    },
  );
}

export function subscribeToActiveThreats(
  callback: (threats: FirestoreThreat[]) => void,
  maxItems = 200
): Unsubscribe {
  const q = query(
    threatsCol,
    where("status", "==", "active"),
    orderBy("timestamp", "desc"),
    limit(maxItems)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const threats = snapshot.docs
        .map((doc) => normalizeThreat(doc.id, doc.data() as Record<string, unknown>))
        .filter((threat): threat is FirestoreThreat => Boolean(threat));
      callback(threats);
    },
    (error) => {
      console.error("Failed to subscribe to active threats:", error);
      callback([]);
    },
  );
}

export async function resolveThreat(threatId: string, userEmail: string) {
  await updateDoc(doc(db, "threats", threatId), { status: "resolved" });
  await addDoc(collection(db, "logs"), {
    action: "Threat Resolved",
    user: userEmail,
    threat_id: threatId,
    timestamp: serverTimestamp(),
  });
}

export async function addLogEntry(action: string, userEmail: string, extra?: Record<string, unknown>) {
  await addDoc(collection(db, "logs"), {
    action,
    user: userEmail,
    timestamp: serverTimestamp(),
    ...extra,
  });
}

let simulationInterval: ReturnType<typeof setInterval> | null = null;

export function startThreatSimulation(intervalMs = 7000) {
  if (simulationInterval) return;

  addDoc(threatsCol, generateThreatDoc()).catch((error) => {
    console.error("Failed to seed threat simulation:", error);
  });

  simulationInterval = setInterval(() => {
    addDoc(threatsCol, generateThreatDoc()).catch((error) => {
      console.error("Failed to create simulated threat:", error);
    });
  }, intervalMs);
}

export function stopThreatSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}
