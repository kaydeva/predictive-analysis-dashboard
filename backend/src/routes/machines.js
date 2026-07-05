const express = require("express");
const { query, param, validationResult } = require("express-validator");
const supabase = require("../services/supabase");
const NodeCache = require("node-cache");
const { analyzeMachineReading, fleetSummary } = require("../services/llmService");

const router = express.Router();
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Fleet summary AI insights route
router.get("/fleet/summary", async (req, res, next) => {
  try {
    const cacheKey = "fleet_summary";
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const { data, error } = await supabase
      .from("machine_readings")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) throw error;

    // Group by machine_id to get the latest reading for each machine
    const latestMap = {};
    (data || []).forEach((r) => {
      if (!latestMap[r.machine_id]) {
        latestMap[r.machine_id] = {
          ...r,
          status: r.status ? r.status.toLowerCase() : "ok",
          anomaly_score: (r.anomaly_score && r.anomaly_score > 1.0) ? r.anomaly_score / 100.0 : r.anomaly_score,
        };
      }
    });
    const machinesList = Object.values(latestMap);

    const summary = await fleetSummary(machinesList);
    cache.set(cacheKey, summary, 30);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("status").optional().isIn(["ok", "warning", "critical"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: "Invalid query parameters", details: errors.array() });
      }

      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const severity = req.query.severity;

      const cacheKey = `machines_${page}_${limit}_${status || "all"}_${severity || "all"}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      let dbQuery = supabase
        .from("machine_readings")
        .select("*", { count: "exact" });

      if (status) {
        dbQuery = dbQuery.ilike("status", status);
      }

      // Check if severity filtering was requested via query parameter
      if (severity) {
        const { error: colError } = await supabase
          .from("machine_readings")
          .select("severity")
          .limit(1);
        
        const hasSeverity = !colError || colError.code !== "42703";
        if (hasSeverity) {
          dbQuery = dbQuery.eq("severity", severity);
        } else {
          // If column does not exist, map to status as fallback
          const statusMap = { low: "ok", medium: "warning", high: "critical", critical: "critical" };
          const statusVal = statusMap[severity];
          if (statusVal) {
            dbQuery = dbQuery.ilike("status", statusVal);
          }
        }
      }

      const { data, error, count } = await dbQuery
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const machines = (data || []).map((r) => ({
        ...r,
        status: r.status ? r.status.toLowerCase() : "ok",
        anomaly_score: (r.anomaly_score && r.anomaly_score > 1.0) ? r.anomaly_score / 100.0 : r.anomaly_score,
        prediction_summary: {
          failure_probability: r.failure_probability,
          anomaly_score: (r.anomaly_score && r.anomaly_score > 1.0) ? r.anomaly_score / 100.0 : r.anomaly_score,
          status: r.status ? r.status.toLowerCase() : "ok",
        },
      }));

      const result = {
        machines,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };

      cache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  [param("id").isString().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: "Invalid machine ID", details: errors.array() });
      }

      const { id } = req.params;
      const cacheKey = `machine_${id}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const { data, error } = await supabase
        .from("machine_readings")
        .select("*")
        .eq("machine_id", id)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ error: true, message: "Machine not found" });
      }

      const rawLatest = data[0];
      const latestReading = {
        ...rawLatest,
        status: rawLatest.status ? rawLatest.status.toLowerCase() : "ok",
        anomaly_score: (rawLatest.anomaly_score && rawLatest.anomaly_score > 1.0) ? rawLatest.anomaly_score / 100.0 : rawLatest.anomaly_score,
      };

      const historicalData = data.slice(1).map((r) => ({
        ...r,
        status: r.status ? r.status.toLowerCase() : "ok",
        anomaly_score: (r.anomaly_score && r.anomaly_score > 1.0) ? r.anomaly_score / 100.0 : r.anomaly_score,
      }));

      let aiInsight = null;
      try {
        aiInsight = await analyzeMachineReading(latestReading);
      } catch (aiErr) {
        console.warn("Failed to get AI insight for machine:", aiErr.message);
      }

      const result = {
        machine: {
          machine_id: id,
          ...latestReading,
          historical_readings: historicalData,
          ai_insight: aiInsight,
        },
      };

      cache.set(cacheKey, result, 30);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
