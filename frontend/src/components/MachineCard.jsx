import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Cpu, Thermometer, Gauge, Droplets, Zap } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function MachineCard({ machine, index = 0 }) {
  const navigate = useNavigate();

  const metrics = [
    { icon: Thermometer, label: "Temp", value: `${machine.temperature_celsius?.toFixed(1)}°C` },
    { icon: Gauge, label: "Vibration", value: `${machine.vibration_level?.toFixed(2)} mm/s` },
    { icon: Droplets, label: "Humidity", value: `${machine.humidity_percent?.toFixed(1)}%` },
    { icon: Zap, label: "Load", value: `${machine.load_percentage?.toFixed(0)}%` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.01 }}
      onClick={() => navigate(`/machine/${machine.machine_id}`)}
      className="glass-card rounded-2xl p-6 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Machine {machine.machine_id}
            </h3>
            <p className="text-xs text-gray-500">
              {machine.operating_hours?.toFixed(0)} operating hours
            </p>
          </div>
        </div>
        <StatusBadge status={machine.status || "ok"} size="sm" />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4 relative z-10">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="text-center p-2 rounded-lg bg-white/5">
              <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">{metric.label}</p>
              <p className="text-sm font-semibold text-white">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 relative z-10">
        <span>
          Failure Risk:{" "}
          <span
            className={`font-semibold ${
              (machine.failure_probability || 0) > 0.7
                ? "text-red-400"
                : (machine.failure_probability || 0) > 0.4
                ? "text-yellow-400"
                : "text-emerald-400"
            }`}
          >
            {((machine.failure_probability || 0) * 100).toFixed(1)}%
          </span>
        </span>
        <span className="group-hover:text-emerald-400 transition-colors">View Details →</span>
      </div>
    </motion.div>
  );
}
