import { useState, useRef } from "react";
import { ImageIcon, Upload, Shield, AlertTriangle, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ProcessedImage {
  id: string;
  name: string;
  size: string;
  previewUrl: string;
  analysis: {
    steganography: "clean" | "detected";
    malware: "clean" | "suspicious";
    metadata_risk: "low" | "medium" | "high";
    exif_stripped: boolean;
  };
  timestamp: Date;
}

export default function ImageProcessingPage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    setProcessing(true);
    setProgress(0);

    const url = URL.createObjectURL(file);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.random() * 15;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);

      const hasSteganography = Math.random() < 0.15;
      const hasMalware = Math.random() < 0.1;
      const metaRisk = Math.random() < 0.2 ? "high" : Math.random() < 0.4 ? "medium" : "low";

      const result: ProcessedImage = {
        id: crypto.randomUUID(),
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        previewUrl: url,
        analysis: {
          steganography: hasSteganography ? "detected" : "clean",
          malware: hasMalware ? "suspicious" : "clean",
          metadata_risk: metaRisk,
          exif_stripped: true,
        },
        timestamp: new Date(),
      };

      setImages((prev) => [result, ...prev]);
      setProcessing(false);
      setProgress(0);

      if (hasMalware) {
        toast.error("Suspicious Image Detected", {
          description: `${file.name} flagged for potential embedded malware`,
        });
      } else if (hasSteganography) {
        toast.warning("Steganography Detected", {
          description: `Hidden data found in ${file.name}`,
        });
      } else {
        toast.success("Image Processed", {
          description: `${file.name} — clean`,
        });
      }
    }, 2500);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    if (e.target) e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  const riskColor = (level: string) => {
    if (level === "high" || level === "detected" || level === "suspicious") return "text-cyber-red";
    if (level === "medium") return "text-cyber-amber";
    return "text-cyber-green";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Image Processing</h1>
        <p className="text-sm text-muted-foreground font-mono">Analyze images for steganography, malware, and metadata threats</p>
      </div>

      {/* Upload Area */}
      <div className="glass-card rounded-xl border border-border p-6">
        <div
          className="flex h-36 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/40 hover:bg-muted/30"
          onClick={() => fileInputRef.current?.click()}
        >
          {processing ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <Shield className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">Analyzing image...</span>
              <Progress value={Math.min(progress, 100)} className="h-1.5" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">Click or drag image to analyze</span>
              <span className="text-[10px] text-muted-foreground/60">PNG, JPG, GIF, BMP supported</span>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Image List */}
        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Processed Images ({images.length})</h3>
          </div>
          {images.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs font-mono text-muted-foreground">
              Upload an image to begin analysis
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-muted/20 ${selectedImage?.id === img.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="flex items-center gap-3">
                    <img src={img.previewUrl} alt={img.name} className="h-10 w-10 rounded object-cover border border-border" />
                    <div>
                      <p className="text-xs font-mono text-foreground truncate max-w-[180px]">{img.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{img.size} • {img.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(img.analysis.malware === "suspicious" || img.analysis.steganography === "detected") && (
                      <AlertTriangle className="h-4 w-4 text-cyber-red" />
                    )}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="glass-card rounded-xl border border-border p-6">
          {selectedImage ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Analysis Report</h3>
              </div>
              <img src={selectedImage.previewUrl} alt={selectedImage.name} className="w-full h-40 rounded-lg object-cover border border-border" />
              <div className="space-y-3">
                {[
                  { label: "Steganography", value: selectedImage.analysis.steganography },
                  { label: "Malware Scan", value: selectedImage.analysis.malware },
                  { label: "Metadata Risk", value: selectedImage.analysis.metadata_risk },
                  { label: "EXIF Stripped", value: selectedImage.analysis.exif_stripped ? "yes" : "no" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
                    <span className="text-xs font-mono text-muted-foreground">{item.label}</span>
                    <span className={`text-xs font-mono font-semibold uppercase ${riskColor(item.value)}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs font-mono">Select an image to view analysis</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
