import { useQuery } from "@tanstack/react-query";
import { getMachines, getMachine } from "../services/api";

export function useMachines(params = {}) {
  return useQuery({
    queryKey: ["machines", params],
    queryFn: () => getMachines(params),
    placeholderData: (prev) => prev,   // keeps old data while refetching
    staleTime: 30_000,
    retry: 2,
    select: (data) => {
      // Ensure machines array always has correctly-shaped records
      if (!data || !data.machines) return data;
      return {
        ...data,
        machines: data.machines.map(normalizeReading),
      };
    },
  });
}

export function useMachine(id) {
  return useQuery({
    queryKey: ["machine", id],
    queryFn: () => getMachine(id),
    enabled: !!id,
    staleTime: 20_000,
    retry: 2,
    select: (data) => {
      if (!data || !data.machine) return data;
      const machine = normalizeReading(data.machine);
      const historical_readings = (data.machine.historical_readings || []).map(normalizeReading);
      return { ...data, machine: { ...machine, historical_readings } };
    },
  });
}

/** Normalise a raw machine_readings row returned from the backend */
function normalizeReading(r) {
  if (!r) return r;
  return {
    ...r,
    // Status: backend already lowercases, but guard anyway
    status: (r.status || "ok").toLowerCase(),
    // anomaly_score: backend normalises >1 values, but guard client-side too
    anomaly_score:
      r.anomaly_score != null && r.anomaly_score > 1.0
        ? r.anomaly_score / 100.0
        : r.anomaly_score ?? 0,
    // Ensure numeric fields are numbers, not strings
    failure_probability: Number(r.failure_probability ?? 0),
    temperature_celsius: Number(r.temperature_celsius ?? 0),
    vibration_level: Number(r.vibration_level ?? 0),
    pressure_psi: Number(r.pressure_psi ?? 0),
    humidity_percent: Number(r.humidity_percent ?? 0),
    operating_hours: Number(r.operating_hours ?? 0),
    load_percentage: Number(r.load_percentage ?? 0),
    // maintenance_required may be stored as bigint (0/1) in DB — coerce to boolean
    maintenance_required: Boolean(r.maintenance_required),
  };
}
