import { motion } from "framer-motion";

const statusConfig = {
  ok: {
    label: "OK",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-400/20",
  },
  warning: {
    label: "Warning",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    dot: "bg-yellow-400",
    glow: "shadow-yellow-400/20",
  },
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
    glow: "shadow-red-400/20",
  },
};

export default function StatusBadge({ status = "ok", size = "md" }) {
  const config = statusConfig[status] || statusConfig.ok;
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 rounded-full font-medium ${sizes[size]} ${config.bg} ${config.border} ${config.color} border ${config.glow}`}
    >
      <span className="relative flex h-2 w-2">
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {config.label}
    </motion.span>
  );
}
