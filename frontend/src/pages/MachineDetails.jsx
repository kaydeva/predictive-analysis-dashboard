import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Thermometer, Gauge, Droplets, Zap, Clock, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useMachine } from "../hooks/useMachines";
import StatusBadge from "../components/StatusBadge";

export default function MachineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useMachine(id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl" />
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Machine Not Found</h2>
        <p className="text-gray-400 mb-6">{error?.message || "The requested machine could not be found."}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { machine } = data;
  const readings = machine.historical_readings || [];
  const allReadings = [machine, ...readings];

  const chartData = allReadings
    .slice()
    .reverse()
    .map((r, i) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: r.temperature_celsius,
      vibration: r.vibration_level,
      pressure: r.pressure_psi,
      humidity: r.humidity_percent,
      load: r.load_percentage,
      risk: ((r.failure_probability || 0) * 100).toFixed(1),
    }));

  const metrics = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${machine.temperature_celsius?.toFixed(1)}°C`,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      icon: Gauge,
      label: "Vibration",
      value: `${machine.vibration_level?.toFixed(2)} mm/s`,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${machine.humidity_percent?.toFixed(1)}%`,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Zap,
      label: "Load",
      value: `${machine.load_percentage?.toFixed(0)}%`,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Machine {machine.machine_id}</h1>
            <StatusBadge status={machine.status || "ok"} size="md" />
          </div>
          <p className="text-gray-400 text-sm mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            Last updated: {new Date(machine.timestamp).toLocaleString()}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl ${metric.bg} ${metric.border} border p-5`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${metric.color}`} />
                <span className="text-sm text-gray-400">{metric.label}</span>
              </div>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Temperature Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.95)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: "12px",
                }}
              />
              <Area type="monotone" dataKey="temperature" stroke="#f87171" fill="url(#tempGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Failure Risk Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,39,0.95)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: "12px",
                }}
              />
              <Area type="monotone" dataKey="risk" stroke="#34d399" fill="url(#riskGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">All Sensor Readings</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "rgba(17,24,39,0.95)",
                border: "1px solid rgba(52,211,153,0.2)",
                borderRadius: "12px",
              }}
            />
            <Line type="monotone" dataKey="temperature" stroke="#f87171" strokeWidth={2} name="Temperature" />
            <Line type="monotone" dataKey="vibration" stroke="#fbbf24" strokeWidth={2} name="Vibration" />
            <Line type="monotone" dataKey="pressure" stroke="#06b6d4" strokeWidth={2} name="Pressure" />
            <Line type="monotone" dataKey="humidity" stroke="#a78bfa" strokeWidth={2} name="Humidity" />
            <Line type="monotone" dataKey="load" stroke="#34d399" strokeWidth={2} name="Load" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
