const express = require("express");
const { query, validationResult } = require("express-validator");
const supabase = require("../services/supabase");
const NodeCache = require("node-cache");

const router = express.Router();
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

const getAlertDetails = (reading) => {
  const prob = reading.failure_probability || 0;
  let severity = "low";
  let message = "System functioning within normal parameters.";

  if (prob > 0.8) {
    severity = "critical";
    message = "Critical failure probability detected.";
  } else if (prob > 0.5) {
    severity = "high";
    message = "High risk of component failure.";
  } else if (prob > 0.3) {
    severity = "medium";
    message = "Elevated failure risk observed.";
  }

  return { severity, message };
};

router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
    query("severity").optional().isIn(["low", "medium", "high", "critical"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: "Invalid query parameters", details: errors.array() });
      }

      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const severity = req.query.severity;

      const cacheKey = `alerts_${page}_${limit}_${severity || "all"}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      let dbQuery = supabase
        .from("machine_readings")
        .select("*", { count: "exact" });

      if (severity) {
        // Check if severity column exists in database
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

      const offset = (page - 1) * limit;
      dbQuery = dbQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await dbQuery
        .order("timestamp", { ascending: false });

      if (error) throw error;

      const alerts = (data || []).map(item => {
        const normalized = {
          ...item,
          status: item.status ? item.status.toLowerCase() : "ok",
          anomaly_score: (item.anomaly_score && item.anomaly_score > 1.0) ? item.anomaly_score / 100.0 : item.anomaly_score,
        };
        return {
          ...normalized,
          ...getAlertDetails(normalized)
        };
      });

      const result = {
        alerts,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };

      cache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/recent", async (req, res, next) => {
  try {
    const cacheKey = "alerts_recent";
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    // Get critical and warning status readings
    const { data, error } = await supabase
      .from("machine_readings")
      .select("*")
      .or("status.ilike.warning,status.ilike.critical")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (error) throw error;

    const alerts = (data || []).map(item => {
      const normalized = {
        ...item,
        status: item.status ? item.status.toLowerCase() : "ok",
        anomaly_score: (item.anomaly_score && item.anomaly_score > 1.0) ? item.anomaly_score / 100.0 : item.anomaly_score,
      };
      return {
        ...normalized,
        ...getAlertDetails(normalized)
      };
    });

    const result = { alerts };
    cache.set(cacheKey, result, 15);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
