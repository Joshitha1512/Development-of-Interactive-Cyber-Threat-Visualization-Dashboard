import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send, User, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useFirestoreThreats } from "@/hooks/useFirestoreThreats";
import { useAssets } from "@/hooks/useCyberData";
import { useAuth } from "@/contexts/AuthContext";
import { addLogEntry, type FirestoreThreat } from "@/services/threatService";
import { TimelinePanel } from "@/components/dashboard/TimelinePanel";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MITRE_PLAYBOOKS: Record<string, string> = {
  T1566: `**MITRE T1566 — Phishing Mitigation Playbook**

1. **Immediate Actions:**
   - Block the source IP at the perimeter firewall
   - Quarantine affected mailboxes
   - Extract and analyze email headers and attachments

2. **Investigation:**
   - Check if any user clicked the phishing link
   - Review authentication logs for the target IP range
   - Cross-reference with threat intelligence feeds

3. **Containment:**
   - Reset credentials for affected accounts
   - Enable MFA on all compromised accounts
   - Update email filtering rules

4. **Recovery:**
   - Scan endpoints for malware dropped via phishing
   - Monitor for lateral movement from compromised hosts
   - Update phishing awareness training materials`,

  T1110: `**MITRE T1110 — Brute Force Login Mitigation Playbook**

1. **Immediate Actions:**
   - Block source IP at network perimeter
   - Lock targeted accounts temporarily
   - Enable rate limiting on authentication endpoints

2. **Investigation:**
   - Analyze failed login attempts pattern
   - Check for credential stuffing indicators
   - Correlate with known breached credential databases

3. **Containment:**
   - Enforce account lockout policies
   - Implement CAPTCHA after N failed attempts
   - Deploy IP reputation-based blocking

4. **Recovery:**
   - Force password reset for targeted accounts
   - Enable MFA enforcement
   - Review and strengthen password policies`,

  T1071: `**MITRE T1071 — Command & Control Beaconing Mitigation Playbook**

1. **Immediate Actions:**
   - Block C2 domain/IP at DNS and firewall level
   - Isolate infected endpoints from the network
   - Capture and preserve network traffic for analysis

2. **Investigation:**
   - Identify beaconing interval and protocol
   - Extract IOCs (domains, IPs, user-agents)
   - Determine scope of compromise

3. **Containment:**
   - Sinkhole C2 domains
   - Deploy network segmentation
   - Update IDS/IPS signatures

4. **Recovery:**
   - Reimage compromised systems
   - Hunt for persistence mechanisms
   - Update threat intelligence feeds with new IOCs`,
};

const exampleQueries = [
  "Show all critical threats with their MITRE techniques",
  "Generate mitigation playbook for phishing attacks",
  "What are the highest risk assets?",
  "Analyze threats from CN and RU",
];

export default function AIAgentPage() {
  const { threats } = useFirestoreThreats();
  const assets = useAssets(50);
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to CyberOps AI Security Agent. I analyze your live threat data and assets to provide security guidance and mitigation playbooks. Ask me anything about your security posture.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-generate playbooks for threats with ai_playbook_enabled
  useEffect(() => {
    const playbookThreats = threats.filter(
      (t) => t.ai_playbook_enabled && t.mitre_technique && MITRE_PLAYBOOKS[t.mitre_technique]
    );

    if (playbookThreats.length > 0) {
      const latest = playbookThreats[0];
      const hasExisting = messages.some(
        (m) => m.role === "assistant" && m.content.includes(`Auto-generated for ${latest.ip_address}`)
      );

      if (!hasExisting && messages.length <= 3) {
        const playbook = MITRE_PLAYBOOKS[latest.mitre_technique];
        const autoMsg: Message = {
          role: "assistant",
          content: `🤖 **Auto-generated Playbook** for ${latest.ip_address} → ${latest.target_ip}\n\n**Threat:** ${latest.threat_type} | **Severity:** ${latest.severity} | **Country:** ${latest.country}\n**Intel Source:** ${latest.intel_source} | **Reputation:** ${latest.reputation_score}\n**Attack Vector:** ${latest.attack_vector} | **Detection:** ${latest.detection_source}\n\n${playbook}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, autoMsg]);

        addLogEntry("AI mitigation playbook generated", user?.email || "unknown", {
          threat_id: latest.id,
          mitre_technique: latest.mitre_technique,
        }).catch(console.error);
      }
    }
  }, [threats]);

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();

    // Playbook generation
    if (q.includes("playbook") || q.includes("mitigat")) {
      if (q.includes("phish") || q.includes("t1566")) {
        return MITRE_PLAYBOOKS.T1566;
      }
      if (q.includes("brute") || q.includes("t1110")) {
        return MITRE_PLAYBOOKS.T1110;
      }
      if (q.includes("c2") || q.includes("beacon") || q.includes("t1071") || q.includes("command")) {
        return MITRE_PLAYBOOKS.T1071;
      }
    }

    // Critical threats
    if (q.includes("critical")) {
      const critical = threats.filter((t) => t.severity === "Critical");
      if (critical.length === 0) return "No critical threats detected at this time.";
      const list = critical.slice(0, 5).map(
        (t) => `• **${t.threat_type}** from ${t.ip_address} (${t.country}) → ${t.target_ip} | MITRE: ${t.mitre_technique || "N/A"} | Rep: ${t.reputation_score}`
      ).join("\n");
      return `Found **${critical.length} critical threats**:\n\n${list}`;
    }

    // High risk assets
    if (q.includes("risk") || q.includes("asset")) {
      const highRisk = assets.filter((a) => a.risk_score >= 75).slice(0, 5);
      const list = highRisk.map(
        (a) => `• **${a.hostname}** (${a.ip_address}) — Risk: ${a.risk_score} | OS: ${a.os_type} | Ports: ${a.open_ports.join(", ")}`
      ).join("\n");
      return `**High Risk Assets (score ≥ 75):**\n\n${list}\n\nTotal high-risk assets: ${assets.filter((a) => a.risk_score >= 75).length}`;
    }

    // Country analysis
    const countryMatch = q.match(/\b([A-Z]{2})\b/);
    if (q.includes("country") || q.includes("from") || countryMatch) {
      const countryCounts: Record<string, number> = {};
      threats.forEach((t) => { countryCounts[t.country] = (countryCounts[t.country] || 0) + 1; });
      const sorted = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
      const list = sorted.slice(0, 8).map(([c, n]) => `• **${c}**: ${n} threats`).join("\n");
      return `**Threat Origins by Country:**\n\n${list}\n\nTotal countries: ${sorted.length}`;
    }

    // Default comprehensive summary
    const activeThreatCount = threats.filter((t) => t.status === "active").length;
    const critCount = threats.filter((t) => t.severity === "Critical").length;
    const mitreThreats = threats.filter((t) => t.mitre_technique);

    return `**Security Posture Summary:**\n\n• **Active Threats:** ${activeThreatCount}\n• **Critical:** ${critCount}\n• **MITRE-Mapped Threats:** ${mitreThreats.length}\n• **Monitored Assets:** ${assets.length}\n• **High-Risk Assets:** ${assets.filter((a) => a.risk_score >= 75).length}\n\nI can generate mitigation playbooks for:\n- Phishing (T1566)\n- Brute Force Login (T1110)\n- C2 Beaconing (T1071)\n\nTry: "Generate playbook for phishing attacks"`;
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = generateResponse(input);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat */}
      <div className="flex flex-1 flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">AI Security Agent</h1>
          <p className="text-sm text-muted-foreground font-mono">Intelligence-driven threat analysis & mitigation</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {exampleQueries.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-[11px] font-mono text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 glass-card rounded-xl border border-border p-4 mb-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-xl p-4 ${msg.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-muted/50 border border-border"}`}>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                  <p className="mt-2 text-[10px] font-mono text-muted-foreground">{msg.timestamp.toLocaleTimeString()}</p>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/20">
                    <User className="h-4 w-4 text-secondary" />
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="rounded-xl bg-muted/50 border border-border p-4">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about threats, assets, or generate mitigation playbooks..."
            className="bg-muted border-border font-mono text-sm"
          />
          <Button onClick={handleSend} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Side panel - Context */}
      <div className="hidden xl:flex w-80 flex-col gap-4">
        <div className="glass-card rounded-xl border border-border p-4">
          <h3 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground mb-3">
            <Zap className="inline h-3 w-3 mr-1 text-primary" />
            Live Context
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Threats</span>
              <span className="text-foreground">{threats.filter((t) => t.status === "active").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monitored Assets</span>
              <span className="text-foreground">{assets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MITRE Mapped</span>
              <span className="text-foreground">{threats.filter((t) => t.mitre_technique).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Playbook Ready</span>
              <span className="text-foreground">{threats.filter((t) => t.ai_playbook_enabled).length}</span>
            </div>
          </div>
        </div>
        <TimelinePanel collectionName="logs" title="AI Activity Log" maxItems={15} />
      </div>
    </div>
  );
}
