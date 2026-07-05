import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, Clock } from "lucide-react";

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "shadow-red-500/10",
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/10",
  },
  medium: {
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    glow: "shadow-yellow-500/10",
  },
  low: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
  },
};

export default function AlertItem({ alert, index = 0 }) {
  const config = severityConfig[alert.severity] || severityConfig.medium;
  const Icon = config.icon;

  const timeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-4 p-4 rounded-xl ${config.bg} ${config.border} border ${config.glow} group hover:bg-white/5 transition-all`}
    >
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold uppercase ${config.color}`}>
            {alert.severity}
          </span>
          <span className="text-xs text-gray-500">
            Machine {alert.machine_id}
          </span>
        </div>
        <p className="text-sm text-gray-300">{alert.message}</p>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {timeAgo(alert.timestamp)}
        </div>
      </div>
    </motion.div>
  );
}
