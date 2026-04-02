import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FirestoreThreat } from "@/services/threatService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DownloadReportProps {
  threats: FirestoreThreat[];
  totalThreats: number;
  criticalCount: number;
  highCount: number;
}

export function DownloadReport({ threats, totalThreats, criticalCount, highCount }: DownloadReportProps) {
  const handleDownload = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("CyberOps Threat Intelligence Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Summary
    doc.setFontSize(12);
    doc.text("Summary", 14, 42);
    doc.setFontSize(10);
    doc.text(`Total Threats: ${totalThreats}`, 14, 50);
    doc.text(`Critical: ${criticalCount}`, 14, 56);
    doc.text(`High: ${highCount}`, 14, 62);
    doc.text(`Medium: ${threats.filter((t) => t.severity === "Medium").length}`, 14, 68);
    doc.text(`Low: ${threats.filter((t) => t.severity === "Low").length}`, 14, 74);

    // Table
    const tableData = threats.slice(0, 50).map((t) => [
      t.ip_address,
      t.target_ip,
      t.threat_type,
      t.severity,
      t.country,
      t.timestamp?.toDate?.()?.toLocaleString?.() || "—",
    ]);

    autoTable(doc, {
      startY: 82,
      head: [["Source IP", "Target IP", "Type", "Severity", "Country", "Timestamp"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 188, 212] },
    });

    doc.save("cyberops-threat-report.pdf");
  };

  return (
    <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2 font-mono text-xs border-border">
      <Download className="h-3.5 w-3.5" />
      DOWNLOAD REPORT
    </Button>
  );
}
