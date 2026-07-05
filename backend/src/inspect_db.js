require("dotenv").config();
const supabase = require("./services/supabase");

async function main() {
  try {
    const { data: readings, error: err1, count: readingsCount } = await supabase
      .from("machine_readings")
      .select("*", { count: "exact" });

    if (err1) {
      console.error("Error fetching readings:", err1);
    } else {
      console.log(`Successfully fetched ${readings.length} readings. Total count in DB: ${readingsCount}`);
      if (readings.length > 0) {
        console.log("Sample reading:", readings[0]);
      }
    }

    const { data: alerts, error: err2, count: alertsCount } = await supabase
      .from("alerts")
      .select("*", { count: "exact" });

    if (err2) {
      console.error("Error fetching alerts:", err2);
    } else {
      console.log(`Successfully fetched ${alerts.length} alerts. Total count in DB: ${alertsCount}`);
      if (alerts.length > 0) {
        console.log("Sample alert:", alerts[0]);
      }
    }
  } catch (err) {
    console.error("Error in main:", err);
  }
  process.exit(0);
}

main();
