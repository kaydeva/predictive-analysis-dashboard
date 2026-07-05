-- Predictive Maintenance System - Supabase Schema
-- Run this SQL in the Supabase SQL Editor to set up the database

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS machine_readings;

-- Create machine_readings table matching CSV schema
CREATE TABLE machine_readings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  machine_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  temperature_celsius DOUBLE PRECISION,
  vibration_level DOUBLE PRECISION,
  pressure_psi DOUBLE PRECISION,
  humidity_percent DOUBLE PRECISION,
  operating_hours DOUBLE PRECISION,
  load_percentage DOUBLE PRECISION,
  error_code TEXT,
  maintenance_required BOOLEAN,
  failure_probability DOUBLE PRECISION,
  anomaly_score DOUBLE PRECISION,
  status TEXT
);

-- Create alerts table
CREATE TABLE alerts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  machine_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_alerts_machine_id ON alerts(machine_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_machine_readings_machine_id ON machine_readings(machine_id);
CREATE INDEX idx_machine_readings_status ON machine_readings(status);
CREATE INDEX idx_machine_readings_timestamp ON machine_readings(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for anon key access
CREATE POLICY "Allow all on alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on machine_readings" ON machine_readings FOR ALL USING (true) WITH CHECK (true);
