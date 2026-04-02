import { useState } from "react";
import { Database, Wifi, Bot, Wrench, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
  const [dbProvider, setDbProvider] = useState("supabase");
  const [realtime, setRealtime] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [networkTools, setNetworkTools] = useState(true);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");

  const handleSave = () => {
    toast.success("Configuration saved", { description: "Settings will apply on next data refresh." });
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground font-mono">Platform configuration</p>
      </div>

      {/* Database */}
      <div className="glass-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground tracking-wider uppercase">Database Configuration</h2>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Provider</label>
          <Select value={dbProvider} onValueChange={setDbProvider}>
            <SelectTrigger className="mt-1.5 bg-muted border-border font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["supabase", "postgresql", "mysql", "firebase", "fabric"].map(p => (
                <SelectItem key={p} value={p} className="capitalize font-mono">{p === "fabric" ? "Microsoft Fabric" : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Endpoint URL</label>
            <Input value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="https://your-project.supabase.co" className="mt-1.5 bg-muted border-border font-mono text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">API Key</label>
            <Input value={anonKey} onChange={e => setAnonKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." type="password" className="mt-1.5 bg-muted border-border font-mono text-sm" />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="glass-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-bold text-foreground tracking-wider uppercase">Feature Toggles</h2>
        {[
          { label: "Enable Realtime", desc: "Live data subscriptions via WebSocket", icon: Wifi, value: realtime, set: setRealtime },
          { label: "Enable AI Agent", desc: "Natural language security queries", icon: Bot, value: aiEnabled, set: setAiEnabled },
          { label: "Enable Network Tools", desc: "Nmap scanner and web security tools", icon: Wrench, value: networkTools, set: setNetworkTools },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <Switch checked={item.value} onCheckedChange={item.set} />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="bg-primary text-primary-foreground font-mono hover:bg-primary/90">
        <Save className="mr-2 h-4 w-4" />
        Save Configuration
      </Button>
    </div>
  );
}
