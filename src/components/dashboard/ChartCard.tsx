import { motion } from "framer-motion";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl border border-border p-5 ${className}`}
    >
      <h3 className="mb-4 text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">{title}</h3>
      {children}
    </motion.div>
  );
}
