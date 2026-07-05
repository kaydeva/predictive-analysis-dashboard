const ALERT_THRESHOLD = 0.7;

async function checkAndCreateAlert(machineId, prediction) {
  if (prediction.failure_probability < ALERT_THRESHOLD) return null;

  const fp = prediction.failure_probability;
  const alert = {
    machine_id: machineId,
    timestamp: new Date().toISOString(),
    severity: fp >= 0.9 ? "critical" : "high",
    message: `Machine ${machineId} has a ${Math.round(fp * 100)}% failure probability. ${
      prediction.anomaly_score > 0.7
        ? "Anomalous behavior detected."
        : "Immediate inspection recommended."
    }`,
    failure_probability: fp,
    anomaly_score: prediction.anomaly_score,
    status: prediction.status,
  };

  console.log(`Alert raised for machine ${machineId}: ${alert.message}`);
  return alert;
}

module.exports = { checkAndCreateAlert, ALERT_THRESHOLD };
