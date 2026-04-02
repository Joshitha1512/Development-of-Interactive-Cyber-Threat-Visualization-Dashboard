import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import type { FirestoreThreat } from "@/services/threatService";
import "leaflet/dist/leaflet.css";

const sevColors: Record<string, string> = {
  Critical: "hsl(0, 85%, 55%)",
  High: "hsl(40, 95%, 55%)",
  Medium: "hsl(270, 80%, 60%)",
  Low: "hsl(145, 80%, 50%)",
};

const isValidLatLng = (lat: number, lng: number) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

function ArcLayer({ threats }: { threats: FirestoreThreat[] }) {
  const recent = threats.slice(0, 20);

  return (
    <>
      {recent.map((t) => {
        const origin: [number, number] = [t.lat, t.lng];
        const target: [number, number] = [t.target_lat, t.target_lng];
        const latDrift = ((t.lat + t.target_lat) % 6) - 3;
        const mid: [number, number] = [
          (t.lat + t.target_lat) / 2 + latDrift,
          (t.lng + t.target_lng) / 2,
        ];
        const color = sevColors[t.severity] || sevColors.Low;

        return (
          <div key={t.id}>
            <Polyline
              positions={[origin, mid, target]}
              pathOptions={{ color, weight: 1.5, opacity: 0.6, dashArray: "4 6" }}
            />
            <CircleMarker
              center={origin}
              radius={5}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}
            >
              <Tooltip>
                <div className="text-xs font-mono">
                  <p className="font-bold">{t.threat_type}</p>
                  <p>{t.ip_address} ({t.country})</p>
                  <p>Severity: {t.severity}</p>
                </div>
              </Tooltip>
            </CircleMarker>
            <CircleMarker
              center={target}
              radius={4}
              pathOptions={{ color: "hsl(185, 100%, 50%)", fillColor: "hsl(185, 100%, 50%)", fillOpacity: 0.9, weight: 1 }}
            />
          </div>
        );
      })}
    </>
  );
}

interface ThreatMapProps {
  threats: FirestoreThreat[];
  className?: string;
}

export function ThreatMap({ threats, className = "" }: ThreatMapProps) {
  const safeThreats = threats.filter((t) => isValidLatLng(t.lat, t.lng) && isValidLatLng(t.target_lat, t.target_lng));

  if (safeThreats.length === 0) {
    return (
      <div className={`rounded-xl overflow-hidden border border-border bg-muted/30 ${className}`} style={{ height: 380 }}>
        <div className="flex h-full items-center justify-center text-xs font-mono text-muted-foreground">
          Waiting for valid geolocation threat data...
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`} style={{ height: 380 }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "hsl(220, 30%, 6%)" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ArcLayer threats={safeThreats} />
      </MapContainer>
    </div>
  );
}
