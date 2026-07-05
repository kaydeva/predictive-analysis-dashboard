import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, Cpu, TrendingUp, CheckCircle } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useMachines } from "../hooks/useMachines";
import { useRecentAlerts } from "../hooks/useAlerts";
import StatCard from "../components/StatCard";
import MachineCard from "../components/MachineCard";
import AlertItem from "../components/AlertItem";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: machinesData, isLoading: machinesLoading } = useMachines({ limit: 50 });
  const { data: alertsData, isLoading: alertsLoading } = useRecentAlerts();

  const machines = machinesData?.machines || [];
  const alerts = alertsData?.alerts || [];

  const stats = useMemo(() => {
    const total = machines.length;
    const critical = machines.filter((m) => m.status === "critical").length;
    const warning = machines.filter((m) => m.status === "warning").length;
    const ok = machines.filter((m) => m.status === "ok").length;
    const avgRisk = total
      ? machines.reduce((s, m) => s + (m.failure_probability || 0), 0) / total
      : 0;
    return { total, critical, warning, ok, avgRisk };
  }, [machines]);

  const chartData = useMemo(() => {
    return machines.slice(0, 20).map((m) => ({
      name: `M-${m.machine_id}`,
      risk: ((m.failure_probability || 0) * 100).toFixed(1),
      anomaly: ((m.anomaly_score || 0) * 100).toFixed(1),
      temp: m.temperature_celsius,
      vibration: m.vibration_level,
    }));
  }, [machines]);

  const statusData = [
    { name: "OK", value: stats.ok, color: "#34d399" },
    { name: "Warning", value: stats.warning, color: "#fbbf24" },
    { name: "Critical", value: stats.critical, color: "#f87171" },
  ];

  if (machinesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time machine status overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400">Live</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Cpu}
          label="Total Machines"
          value={stats.total}
          color="emerald"
          trend={+12}
        />
        <StatCard
          icon={CheckCircle}
          label="Healthy"
          value={stats.ok}
          color="emerald"
          subtext={`${stats.total ? ((stats.ok / stats.total) * 100).toFixed(0) : 0}% of total`}
        />
        <StatCard
          icon={AlertTriangle}
          label="At Risk"
          value={stats.warning + stats.critical}
          color={stats.critical > 0 ? "red" : "yellow"}
          subtext={`${stats.warning} warning, ${stats.critical} critical`}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Failure Risk"
          value={`${(stats.avgRisk * 100).toFixed(1)}%`}
          color="cyan"
          trend={-5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Failure Risk Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.95)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                }}
              />
              <Area
                type="monotone"
                dataKey="risk"
                stroke="#34d399"
                fill="url(#riskGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="anomaly"
                stroke="#06b6d4"
                fill="none"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Temperature & Vibration</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.95)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: "12px",
                }}
              />
              <Bar dataKey="temp" name="Temperature" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vibration" name="Vibration" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Machines</h3>
              <button
                onClick={() => navigate("/analytics")}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {machines.slice(0, 6).map((machine, i) => (
                <MachineCard key={machine.machine_id} machine={machine} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
              <button
                onClick={() => navigate("/alerts")}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <Activity className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
                  <p className="text-gray-400">No recent alerts</p>
                  <p className="text-xs text-gray-500 mt-1">All machines operating normally</p>
                </div>
              ) : (
                alerts.slice(0, 5).map((alert, i) => (
                  <AlertItem key={alert.id || i} alert={alert} index={i} />
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
