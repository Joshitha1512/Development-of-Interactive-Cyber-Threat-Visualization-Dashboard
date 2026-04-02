import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ThreatFiltersProps {
  severity: string;
  onSeverityChange: (val: string) => void;
  threatType: string;
  onThreatTypeChange: (val: string) => void;
}

export function ThreatFilters({ severity, onSeverityChange, threatType, onThreatTypeChange }: ThreatFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={severity} onValueChange={onSeverityChange}>
        <SelectTrigger className="w-[140px] bg-muted border-border font-mono text-sm">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severity</SelectItem>
          <SelectItem value="Critical">Critical</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Select value={threatType} onValueChange={onThreatTypeChange}>
        <SelectTrigger className="w-[140px] bg-muted border-border font-mono text-sm">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="DDoS">DDoS</SelectItem>
          <SelectItem value="SQLi">SQLi</SelectItem>
          <SelectItem value="Phishing">Phishing</SelectItem>
          <SelectItem value="Malware">Malware</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
