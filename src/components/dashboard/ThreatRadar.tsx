import { useEffect, useRef, useCallback, useState } from "react";
import type { FirestoreThreat } from "@/services/threatService";
import { Globe } from "lucide-react";

const SEV_COLORS: Record<string, string> = {
  Critical: "hsl(0, 85%, 55%)",
  High: "hsl(40, 95%, 55%)",
  Medium: "hsl(270, 80%, 60%)",
  Low: "hsl(145, 80%, 50%)",
};

interface Blip {
  id: string;
  angle: number;
  distance: number;
  severity: string;
  ip: string;
  country: string;
  type: string;
  addedAt: number;
  pulsePhase: number;
}

function toBlip(t: FirestoreThreat): Blip {
  const angle = ((t.lat + 90) / 180) * Math.PI * 2 + ((t.lng + 180) / 360) * Math.PI;
  const distance = 0.2 + (Math.abs(t.lat * t.lng) % 70) / 100 * 0.7;
  return {
    id: t.id,
    angle,
    distance: Math.min(distance, 0.92),
    severity: t.severity,
    ip: t.ip_address,
    country: t.country,
    type: t.threat_type,
    addedAt: Date.now(),
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

interface ThreatRadarProps {
  threats: FirestoreThreat[];
  className?: string;
}

export function ThreatRadar({ threats, className = "" }: ThreatRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blipsRef = useRef<Map<string, Blip>>(new Map());
  const sweepAngleRef = useRef(0);
  const animRef = useRef<number>(0);
  const [hoveredBlip, setHoveredBlip] = useState<Blip | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Sync threats to blips
  useEffect(() => {
    const map = blipsRef.current;
    const existingIds = new Set(map.keys());
    const newIds = new Set(threats.map((t) => t.id));

    // Add new blips
    threats.forEach((t) => {
      if (!existingIds.has(t.id)) {
        map.set(t.id, toBlip(t));
      }
    });

    // Remove old blips (keep max 30)
    const sorted = Array.from(map.entries()).sort((a, b) => b[1].addedAt - a[1].addedAt);
    if (sorted.length > 30) {
      sorted.slice(30).forEach(([id]) => map.delete(id));
    }
  }, [threats]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(cx, cy) - 12;

    // Background
    ctx.clearRect(0, 0, W, H);

    // Outer glow
    const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.05);
    outerGlow.addColorStop(0, "transparent");
    outerGlow.addColorStop(0.7, "hsla(185, 100%, 50%, 0.04)");
    outerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = outerGlow;
    ctx.fillRect(0, 0, W, H);

    // Concentric circles
    for (let i = 1; i <= 4; i++) {
      const r = (R * i) / 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(185, 100%, 50%, ${i === 4 ? 0.25 : 0.08})`;
      ctx.lineWidth = i === 4 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Crosshairs
    ctx.strokeStyle = "hsla(185, 100%, 50%, 0.06)";
    ctx.lineWidth = 0.8;
    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx.lineTo(cx - Math.cos(angle) * R, cy - Math.sin(angle) * R);
      ctx.stroke();
    }

    // Sweep
    sweepAngleRef.current += 0.012;
    const sweep = sweepAngleRef.current;
    // Sweep effect

    // Sweep wedge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sweep - 0.5, sweep);
    ctx.closePath();
    const sweepFill = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    sweepFill.addColorStop(0, "hsla(185, 100%, 50%, 0.15)");
    sweepFill.addColorStop(1, "hsla(185, 100%, 50%, 0.02)");
    ctx.fillStyle = sweepFill;
    ctx.fill();
    ctx.restore();

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
    ctx.strokeStyle = "hsla(185, 100%, 50%, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Blips
    const now = Date.now();
    blipsRef.current.forEach((blip) => {
      const age = (now - blip.addedAt) / 1000;
      const fadeOut = Math.max(0, 1 - age / 25);
      if (fadeOut <= 0) return;

      const bx = cx + Math.cos(blip.angle) * blip.distance * R;
      const by = cy + Math.sin(blip.angle) * blip.distance * R;
      const color = SEV_COLORS[blip.severity] || SEV_COLORS.Low;
      const isCrit = blip.severity === "Critical";
      const pulse = isCrit ? 0.6 + 0.4 * Math.sin(now / 300 + blip.pulsePhase) : 1;
      const radius = isCrit ? 6 : blip.severity === "High" ? 5 : 4;

      // Glow
      ctx.beginPath();
      ctx.arc(bx, by, radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color.replace(")", `, ${0.15 * fadeOut * pulse})`).replace("hsl(", "hsla(");
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fillStyle = color.replace(")", `, ${fadeOut * pulse})`).replace("hsl(", "hsla(");
      ctx.fill();

      // Pin line for critical
      if (isCrit) {
        ctx.beginPath();
        ctx.moveTo(bx, by - radius);
        ctx.lineTo(bx, by - radius - 10);
        ctx.strokeStyle = color.replace(")", `, ${0.6 * fadeOut})`).replace("hsl(", "hsla(");
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Center icon area
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = "hsla(185, 100%, 50%, 0.08)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.strokeStyle = "hsla(185, 100%, 50%, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center crosshair
    ctx.strokeStyle = "hsla(185, 100%, 50%, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy);
    ctx.lineTo(cx + 6, cy);
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx, cy + 6);
    ctx.stroke();

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const R = Math.min(cx, cy) - 12;

    let closest: Blip | null = null;
    let closestDist = 20;

    blipsRef.current.forEach((blip) => {
      const bx = cx + Math.cos(blip.angle) * blip.distance * R;
      const by = cy + Math.sin(blip.angle) * blip.distance * R;
      const d = Math.hypot(mx - bx, my - by);
      if (d < closestDist) {
        closestDist = d;
        closest = blip;
      }
    });

    setHoveredBlip(closest);
    if (closest) {
      setTooltipPos({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10 });
    }
  }, []);

  const liveCount = blipsRef.current.size || threats.slice(0, 30).length;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border bg-card ${className}`} style={{ height: 420 }}>
      {/* Header */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <span className="text-sm font-bold text-foreground">Global Threat Map</span>
      </div>
      <div className="absolute top-3 right-4 z-10 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1">
        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-xs font-mono text-destructive">{liveCount} Live Attacks</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredBlip(null)}
      />

      {/* Center label */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-4 pointer-events-none z-10">
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">Real-time Monitoring</span>
      </div>

      {/* Tooltip */}
      {hoveredBlip && (
        <div
          className="absolute z-20 rounded-lg border border-border bg-popover p-3 shadow-lg pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="text-xs font-mono space-y-1">
            <p className="flex items-center gap-1.5">
              <span className="text-muted-foreground">◉</span>
              <span className="font-bold text-foreground">{hoveredBlip.ip}</span>
            </p>
            <p className="text-muted-foreground">{hoveredBlip.country}</p>
            <p style={{ color: SEV_COLORS[hoveredBlip.severity] }} className="font-semibold">{hoveredBlip.type}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-4 z-10 flex flex-col gap-1">
        {Object.entries(SEV_COLORS).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-mono text-muted-foreground">{sev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
