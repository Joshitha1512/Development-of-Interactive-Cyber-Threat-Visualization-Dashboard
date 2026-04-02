import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "cyan" | "violet" | "green" | "amber" | "red";
}

const variantStyles = {
  cyan: "border-cyber-cyan/20 glow-cyan",
  violet: "border-cyber-violet/20 glow-violet",
  green: "border-cyber-green/20 glow-green",
  amber: "border-cyber-amber/20",
  red: "border-cyber-red/20 glow-red",
};

const iconVariant = {
  cyan: "text-cyber-cyan bg-cyber-cyan/10",
  violet: "text-cyber-violet bg-cyber-violet/10",
  green: "text-cyber-green bg-cyber-green/10",
  amber: "text-cyber-amber bg-cyber-amber/10",
  red: "text-cyber-red bg-cyber-red/10",
};

export function KPICard({ title, value, icon: Icon, variant = "cyan" }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl p-5 border ${variantStyles[variant]} transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">{title}</span>
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold font-mono text-foreground"
          >
            {value}
          </motion.span>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconVariant[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full bg-cyber-${variant}`}
          style={{ background: `hsl(var(--cyber-${variant}))` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Number(value) || 50, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
