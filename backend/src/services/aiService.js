const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

async function predictFailure(sensorData) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/predict`, sensorData, {
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("AI Service error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.warn("AI service not available. Using fallback prediction.");
      return fallbackPrediction(sensorData);
    }
    throw new Error("Failed to get prediction from AI service");
  }
}

function fallbackPrediction(sensorData) {
  const {
    temperature_celsius = 0,
    vibration_level = 0,
    pressure_psi = 0,
    humidity_percent = 0,
    load_percentage = 0,
    operating_hours = 0,
  } = sensorData;

  const tempScore = Math.min(temperature_celsius / 120, 1);
  const vibScore = Math.min(vibration_level / 20, 1);
  const pressScore = Math.min(pressure_psi / 200, 1);
  const humidityScore = Math.min(humidity_percent / 100, 1);
  const loadScore = Math.min(load_percentage / 100, 1);
  const hoursScore = Math.min(operating_hours / 10000, 1);

  const failure_probability = Math.min(
    0.25 * tempScore +
      0.2 * vibScore +
      0.15 * pressScore +
      0.1 * humidityScore +
      0.15 * loadScore +
      0.15 * hoursScore,
    1
  );

  const anomaly_score = Math.min(
    0.25 * tempScore +
      0.25 * vibScore +
      0.2 * pressScore +
      0.15 * loadScore +
      0.15 * hoursScore,
    1
  );

  let status = "ok";
  if (failure_probability >= 0.7) status = "critical";
  else if (failure_probability >= 0.4) status = "warning";

  return { failure_probability, anomaly_score, status };
}

module.exports = { predictFailure };
