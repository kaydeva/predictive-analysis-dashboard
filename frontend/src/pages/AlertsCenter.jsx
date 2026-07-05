import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Filter } from "lucide-react";
import { useAlerts } from "../hooks/useAlerts";
import AlertItem from "../components/AlertItem";

const severityFilters = ["all", "critical", "high", "medium", "low"];

export default function AlertsCenter() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const params = { page, limit: 20 };
  if (filter !== "all") params.severity = filter;

  const { data, isLoading } = useAlerts(params);
  const alerts = data?.alerts || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">Alerts Center</h1>
            <p className="text-gray-400 mt-1">Monitor and manage system alerts</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">
              {pagination?.total || 0} Total
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <Filter className="w-4 h-4 text-gray-400" />
        {severityFilters.map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === s
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 border"
                : "bg-white/5 border-transparent text-gray-400 hover:text-white hover:bg-white/10 border"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </motion.div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-16 text-center"
          >
            <BellOff className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Alerts</h3>
            <p className="text-gray-400">
              {filter !== "all"
                ? `No ${filter} severity alerts found.`
                : "All machines are operating within normal parameters."}
            </p>
          </motion.div>
        ) : (
          alerts.map((alert, i) => (
            <AlertItem key={alert.id || i} alert={alert} index={i} />
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 px-4">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
