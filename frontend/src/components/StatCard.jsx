import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, subtext, color = "emerald", trend, onClick }) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
    yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20",
    red: "from-red-500/20 to-red-600/5 border-red-500/20",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
  };

  const iconColors = {
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    purple: "text-purple-400",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[color]} backdrop-blur-xl border p-6 cursor-pointer group`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-500">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-white/5 ${iconColors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          <span className={trend >= 0 ? "text-emerald-400" : "text-red-400"}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
          <span className="text-gray-500">vs last week</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/0 group-hover:to-white/5 transition-all duration-500" />
    </motion.div>
  );
}
