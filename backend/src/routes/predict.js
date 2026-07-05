const express = require("express");
const { body, validationResult } = require("express-validator");
const supabase = require("../services/supabase");
const { predictFailure } = require("../services/aiService");
const { checkAndCreateAlert } = require("../services/alertService");
const { sendAlertEmail } = require("../services/emailService");
const { analyzeMachineReading } = require("../services/llmService");

const router = express.Router();

router.post(
  "/",
  [
    body("machine_id").isString().notEmpty().withMessage("machine_id is required"),
    body("temperature_celsius").isFloat({ min: 0, max: 200 }).withMessage("temperature_celsius must be 0-200"),
    body("vibration_level").isFloat({ min: 0, max: 50 }).withMessage("vibration_level must be 0-50"),
    body("pressure_psi").isFloat({ min: 0, max: 500 }).withMessage("pressure_psi must be 0-500"),
    body("humidity_percent").isFloat({ min: 0, max: 100 }).withMessage("humidity_percent must be 0-100"),
    body("load_percentage").isFloat({ min: 0, max: 100 }).withMessage("load_percentage must be 0-100"),
    body("operating_hours").isFloat({ min: 0 }).withMessage("operating_hours must be positive"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: "Validation failed", details: errors.array() });
      }

      const { machine_id, ...sensorData } = req.body;

      const prediction = await predictFailure(sensorData);

      const { error: insertError } = await supabase.from("machine_readings").insert({
        machine_id,
        timestamp: new Date().toISOString(),
        ...sensorData,
        failure_probability: prediction.failure_probability,
        anomaly_score: prediction.anomaly_score,
        status: prediction.status,
        error_code: prediction.failure_probability > 0.7 ? "HIGH_RISK" : "NONE",
        maintenance_required: prediction.failure_probability > 0.5,
      });

      if (insertError) {
        console.error("Failed to insert reading:", insertError.message);
      }

      const alert = await checkAndCreateAlert(machine_id, prediction, sensorData);

      if (alert) {
        sendAlertEmail(alert).catch((err) =>
          console.error("Failed to send alert email:", err.message)
        );
      }

      // Generate AI-powered insights for the prediction
      let aiInsight = null;
      try {
        const readingForAi = {
          machine_id,
          status: prediction.status,
          failure_probability: prediction.failure_probability,
          anomaly_score: prediction.anomaly_score,
          ...sensorData,
        };
        aiInsight = await analyzeMachineReading(readingForAi);
      } catch (aiErr) {
        console.warn("AI insight failed for prediction:", aiErr.message);
      }

      res.json({
        prediction,
        alert_created: !!alert,
        alert,
        ai_insight: aiInsight,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/batch",
  [
    body("readings")
      .isArray({ min: 1, max: 100 })
      .withMessage("readings must be an array of 1-100 readings"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: "Validation failed", details: errors.array() });
      }

      const { readings } = req.body;
      const results = [];

      for (const reading of readings) {
        try {
          const { machine_id, ...sensorData } = reading;
          const prediction = await predictFailure(sensorData);

          const { error: insertError } = await supabase.from("machine_readings").insert({
            machine_id,
            timestamp: new Date().toISOString(),
            ...sensorData,
            failure_probability: prediction.failure_probability,
            anomaly_score: prediction.anomaly_score,
            status: prediction.status,
            error_code: prediction.failure_probability > 0.7 ? "HIGH_RISK" : "NONE",
            maintenance_required: prediction.failure_probability > 0.5,
          });

          const alert = await checkAndCreateAlert(machine_id, prediction, sensorData);
          if (alert) {
            sendAlertEmail(alert).catch((err) =>
              console.error("Failed to send alert email:", err.message)
            );
          }

          results.push({
            machine_id,
            prediction,
            alert_created: !!alert,
            inserted: !insertError,
          });
        } catch (innerError) {
          results.push({
            machine_id: reading.machine_id || "unknown",
            error: innerError.message,
          });
        }
      }

      res.json({ results });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
