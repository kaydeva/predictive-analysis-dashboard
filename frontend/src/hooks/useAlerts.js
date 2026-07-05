import { useQuery } from "@tanstack/react-query";
import { getAlerts, getRecentAlerts } from "../services/api";

export function useAlerts(params = {}) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => getAlerts(params),
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 2,
    select: (data) => {
      if (!data || !data.alerts) return data;
      return {
        ...data,
        alerts: data.alerts.map(normalizeAlert),
      };
    },
  });
}

export function useRecentAlerts() {
  return useQuery({
    queryKey: ["alerts", "recent"],
    queryFn: getRecentAlerts,
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 2,
    select: (data) => {
      if (!data || !data.alerts) return data;
      return {
        ...data,
        alerts: data.alerts.map(normalizeAlert),
      };
    },
  });
}

/** Normalise a raw alert / machine_readings row returned from the backend */
function normalizeAlert(a) {
  if (!a) return a;

  const status = (a.status || "ok").toLowerCase();

  // Derive severity from failure_probability if the backend didn't already set it
  let severity = a.severity;
  if (!severity) {
    const fp = Number(a.failure_probability ?? 0);
    if (fp > 0.8) severity = "critical";
    else if (fp > 0.5) severity = "high";
    else if (fp > 0.3) severity = "medium";
    else severity = "low";
  }

  // Derive a human-readable message if the backend didn't already set one
  const message =
    a.message ||
    (severity === "critical"
      ? "Critical failure probability detected."
      : severity === "high"
      ? "High risk of component failure."
      : severity === "medium"
      ? "Elevated failure risk observed."
      : "System functioning within normal parameters.");

  return {
    ...a,
    status,
    severity,
    message,
    failure_probability: Number(a.failure_probability ?? 0),
    anomaly_score:
      a.anomaly_score != null && a.anomaly_score > 1.0
        ? a.anomaly_score / 100.0
        : a.anomaly_score ?? 0,
    maintenance_required: Boolean(a.maintenance_required),
  };
}
