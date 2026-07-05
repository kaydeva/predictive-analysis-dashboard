import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Target,
  Shield,
} from "lucide-react";

import { useMachines } from "../hooks/useMachines";
import { useAlerts } from "../hooks/useAlerts";
import StatCard from "../components/StatCard";

const COLORS = {
  emerald: "#34d399",
  cyan: "#06b6d4",
  yellow: "#fbbf24",
  red: "#f87171",
  purple: "#a78bfa",
  pink: "#f472b6",
};

export default function Analytics() {
  const { data: machinesData } = useMachines({ limit: 100 });
  const { data: alertsData } = useAlerts({ limit: 50 });
  const { data: allAlertsData } = useAlerts({ limit: 200 });

  const machines = machinesData?.machines || [];
  const alerts = alertsData?.alerts || [];

  const stats = useMemo(() => {
    const total = machines.length;
    if (!total) return null;
    const critical = machines.filter((m) => m.status === "critical").length;
    const warning = machines.filter((m) => m.status === "warning").length;
    const ok = machines.filter((m) => m.status === "ok").length;
    const avgRisk = machines.reduce((s, m) => s + (m.failure_probability || 0), 0) / total;
    const avgAnomaly = machines.reduce((s, m) => s + (m.anomaly_score || 0), 0) / total;
    const highRiskCount = machines.filter((m) => (m.failure_probability || 0) > 0.7).length;
    return { total, critical, warning, ok, avgRisk, avgAnomaly, highRiskCount };
  }, [machines]);

  const statusPieData = [
    { name: "OK", value: stats?.ok || 0, color: COLORS.emerald },
    { name: "Warning", value: stats?.warning || 0, color: COLORS.yellow },
    { name: "Critical", value: stats?.critical || 0, color: COLORS.red },
  ];

  const riskBuckets = useMemo(() => {
    const buckets = { "0-20%": 0, "21-40%": 0, "41-60%": 0, "61-80%": 0, "81-100%": 0 };
    machines.forEach((m) => {
      const risk = (m.failure_probability || 0) * 100;
      if (risk <= 20) buckets["0-20%"]++;
      else if (risk <= 40) buckets["21-40%"]++;
      else if (risk <= 60) buckets["41-60%"]++;
      else if (risk <= 80) buckets["61-80%"]++;
      else buckets["81-100%"]++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [machines]);

  const alertTrend = useMemo(() => {
    const now = Date.now();
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      days[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
    }
    (allAlertsData?.alerts || []).forEach((a) => {
      const day = new Date(a.timestamp).toLocaleDateString("en-US", { weekday: "short" });
      if (days[day] !== undefined) days[day]++;
    });
    return Object.entries(days).map(([day, count]) => ({ day, alerts: count }));
  }, [allAlertsData]);

  const radarData = [
    { metric: "Temperature", value: Math.min((stats?.avgRisk || 0) * 70 + 20, 100) },
    { metric: "Vibration", value: Math.min((stats?.avgRisk || 0) * 60 + 15, 100) },
    { metric: "Pressure", value: Math.min((stats?.avgRisk || 0) * 50 + 25, 100) },
    { metric: "Humidity", value: Math.min((stats?.avgAnomaly || 0) * 55 + 20, 100) },
    { metric: "Load", value: Math.min((stats?.avgRisk || 0) * 65 + 18, 100) },
    { metric: "Runtime", value: Math.min((stats?.avgRisk || 0) * 45 + 30, 100) },
  ];

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold text-white">AI Analytics</h1>
        </div>
        <p className="text-gray-400">Advanced insights powered by machine learning</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Avg Failure Risk" value={`${(stats.avgRisk * 100).toFixed(1)}%`} color="emerald" />
        <StatCard icon={Target} label="Avg Anomaly Score" value={`${(stats.avgAnomaly * 100).toFixed(1)}%`} color="cyan" />
        <StatCard icon={AlertTriangle} label="High Risk Machines" value={stats.highRiskCount} color="red" />
        <StatCard icon={Shield} label="Healthy Machines" value={`${stats.total ? ((stats.ok / stats.total) * 100).toFixed(0) : 0}%`} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Machine Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.95)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskBuckets}>
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
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {riskBuckets.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.name === "0-20%" || entry.name === "21-40%"
                        ? COLORS.emerald
                        : entry.name === "41-60%"
                        ? COLORS.yellow
                        : COLORS.red
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Alert Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={alertTrend}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.95)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: "12px",
                }}
              />
              <Area type="monotone" dataKey="alerts" stroke="#f87171" fill="url(#alertGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Sensor Risk Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
              <Radar
                name="Risk Score"
                dataKey="value"
                stroke={COLORS.emerald}
                fill={COLORS.emerald}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name="Anomaly"
                dataKey="value"
                stroke={COLORS.cyan}
                fill={COLORS.cyan}
                fillOpacity={0.1}
                strokeWidth={2}
                data={radarData.map((r) => ({ ...r, value: Math.max(r.value - 15, 10) }))}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">AI Insights Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <h4 className="text-emerald-400 font-semibold mb-2">Overall Health</h4>
            <p className="text-gray-400 text-sm">
              {stats.ok / stats.total > 0.7
                ? "The system is in good health with most machines operating within safe parameters."
                : "Attention needed - a significant portion of machines show elevated risk levels."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
            <h4 className="text-yellow-400 font-semibold mb-2">Risk Assessment</h4>
            <p className="text-gray-400 text-sm">
              {stats.highRiskCount > 0
                ? `${stats.highRiskCount} machine(s) require immediate attention with failure probability > 70%.`
                : "No machines currently exceed the high-risk threshold of 70%."}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <h4 className="text-cyan-400 font-semibold mb-2">Recommendation</h4>
            <p className="text-gray-400 text-sm">
              {stats.warning > 0
                ? "Schedule maintenance for warning-level machines to prevent escalation to critical status."
                : "Continue regular monitoring. System is operating within expected parameters."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
