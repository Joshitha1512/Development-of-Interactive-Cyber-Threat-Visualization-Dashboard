import { useState, useRef, useCallback } from "react";
import { ScanBarcode, Camera, Upload, Copy, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ScanResult {
  id: string;
  value: string;
  format: string;
  timestamp: Date;
  status: "valid" | "suspicious";
}

const MOCK_FORMATS = ["QR Code", "Code 128", "EAN-13", "Data Matrix", "Code 39"];

export default function BarcodeScannerPage() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateScan = useCallback((source: string) => {
    setScanning(true);
    setTimeout(() => {
      const isSuspicious = Math.random() < 0.2;
      const result: ScanResult = {
        id: crypto.randomUUID(),
        value: `${source}-${Math.random().toString(36).substring(2, 14).toUpperCase()}`,
        format: MOCK_FORMATS[Math.floor(Math.random() * MOCK_FORMATS.length)],
        timestamp: new Date(),
        status: isSuspicious ? "suspicious" : "valid",
      };
      setResults((prev) => [result, ...prev]);
      setScanning(false);

      if (isSuspicious) {
        toast.error("Suspicious Barcode Detected", {
          description: `Value: ${result.value} flagged for review`,
        });
      } else {
        toast.success("Barcode Scanned", {
          description: `${result.format}: ${result.value}`,
        });
      }
    }, 1200);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateScan(`IMG-${file.name}`);
  };

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Barcode Scanner</h1>
        <p className="text-sm text-muted-foreground font-mono">Scan and analyze barcodes for threat detection</p>
      </div>

      {/* Scanner Controls */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-card rounded-xl border border-border p-6 flex flex-col items-center gap-4">
          <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
            {scanning ? (
              <div className="flex flex-col items-center gap-2">
                <ScanBarcode className="h-10 w-10 text-primary animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground">Scanning...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-10 w-10 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">Ready to scan</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 w-full">
            <Button
              onClick={() => simulateScan("CAM")}
              disabled={scanning}
              className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Camera className="h-4 w-4" />
              Live Scan
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Scan Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{results.length}</p>
              <p className="text-[10px] font-mono text-muted-foreground">TOTAL SCANS</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-cyber-green">{results.filter((r) => r.status === "valid").length}</p>
              <p className="text-[10px] font-mono text-muted-foreground">VALID</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-cyber-red">{results.filter((r) => r.status === "suspicious").length}</p>
              <p className="text-[10px] font-mono text-muted-foreground">SUSPICIOUS</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-cyber-amber">{new Set(results.map((r) => r.format)).size}</p>
              <p className="text-[10px] font-mono text-muted-foreground">FORMATS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Scan History</h3>
        </div>
        {results.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-xs font-mono text-muted-foreground">
            No scans yet. Use Live Scan or Upload to begin.
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  {r.status === "valid" ? (
                    <CheckCircle className="h-4 w-4 text-cyber-green" />
                  ) : (
                    <XCircle className="h-4 w-4 text-cyber-red" />
                  )}
                  <div>
                    <p className="text-xs font-mono text-foreground">{r.value}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{r.format} • {r.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyValue(r.value)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
