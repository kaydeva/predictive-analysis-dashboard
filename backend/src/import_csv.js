require("dotenv").config();
const fs = require("fs");
const supabase = require("./services/supabase");

async function main() {
  const csvPath = "c:\\Users\\User\\Downloads\\sensor_readings.csv";
  if (!fs.existsSync(csvPath)) {
    console.error("CSV file not found at:", csvPath);
    process.exit(1);
  }

  console.log("Reading CSV file...");
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split(/\r?\n/);

  if (lines.length <= 1) {
    console.log("CSV is empty or header-only.");
    process.exit(0);
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  console.log("CSV headers:", headers);

  const readings = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, idx) => {
      const val = (values[idx] || "").trim();

      // Skip id — it is GENERATED ALWAYS AS IDENTITY in the table
      if (header === "id") return;

      if (header === "machine_id") {
        row.machine_id = val;
      } else if (header === "timestamp") {
        row.timestamp = val || new Date().toISOString();
      } else if (header === "error_code") {
        row.error_code = val || null;
      } else if (header === "status") {
        // Normalise CSV values like "OK", "Warning", "Critical" → lowercase
        row.status = val.toLowerCase();
      } else if (header === "maintenance_required") {
        // CSV stores 0 or 1 — map to PostgreSQL boolean
        row.maintenance_required = val === "1" || val === "true";
      } else if (header === "anomaly_score") {
        // CSV stores 0-100 scale → normalize to 0-1
        const raw = parseFloat(val);
        row.anomaly_score = isNaN(raw) ? 0 : raw / 100.0;
      } else if (
        [
          "temperature_celsius",
          "vibration_level",
          "pressure_psi",
          "humidity_percent",
          "operating_hours",
          "load_percentage",
          "failure_probability",
        ].includes(header)
      ) {
        const parsed = parseFloat(val);
        row[header] = isNaN(parsed) ? null : parsed;
      } else {
        row[header] = val;
      }
    });

    readings.push(row);
  }

  console.log(`Parsed ${readings.length} readings. Starting import...`);

  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < readings.length; i += batchSize) {
    const batch = readings.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(readings.length / batchSize);

    process.stdout.write(
      `\r  Inserting batch ${batchNum}/${totalBatches} (${i + batch.length}/${readings.length} rows)...`
    );

    const { error } = await supabase.from("machine_readings").insert(batch);

    if (error) {
      console.error(`\nBatch ${batchNum} failed: ${error.message}`);
      console.error(
        "\nIMPORTANT: You must run supabase-schema.sql in the Supabase SQL Editor first to:\n" +
          "  1. Recreate the machine_readings table with all required columns.\n" +
          "  2. Set the RLS policy: FOR ALL USING (true) WITH CHECK (true).\n"
      );
      process.exit(1);
    }

    totalInserted += batch.length;
  }

  console.log(`\n✅ Successfully imported ${totalInserted} rows into machine_readings.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
