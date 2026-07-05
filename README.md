# Predictive Maintenance System

📌 Overview
The Predictive Maintenance System is a full‑stack platform designed to monitor industrial machines, detect anomalies, and predict failures using real‑time sensor data.
The system includes:

Responsive React + Tailwind + Framer Motion frontend

Node.js + Express backend

Supabase database

AI‑powered insights using Gemini, DeepSeek, and Groq APIs

Fully responsive UI

Real machine analytics dashboard

Alerts center

Machine details view

Predictive AI engine

📊 Data Model
The system uses mock sensor data imported from a CSV file (sensor_readings.csv) into Supabase.
The CSV contains 2000+ machine readings with fields such as:

temperature

vibration

pressure

humidity

operating hours

load percentage

error codes

maintenance flags

failure probability

anomaly score

machine status

This mock dataset simulates real industrial IoT data and can be replaced with live data from any company.

An AI-powered predictive maintenance system that analyzes industrial machine sensor data to predict failures, detect anomalies, and provide real-time insights.


## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd predictive-maintenance-system

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install AI service dependencies
cd ../ai-service && pip install -r requirements.txt
```



### 5. Start the Backend

```bash
cd backend
npm run dev              # Starts on port 3001
```

### 6. Start the Frontend

```bash
cd frontend
npm run dev              # Starts on port 5173, opens browser
```

---

---

## AI Model

The system uses a **RandomForestClassifier** with 200 estimators trained on 6 features:
- Temperature (°C)
- Vibration (mm/s)
- Pressure (PSI)
- Humidity (%)
- Load (%)
- Operating Hours

**Anomaly detection** uses **IsolationForest** (contamination=0.1).

**Status thresholds:**
- `ok`: failure probability < 0.4
- `warning`: 0.4 ≤ failure probability < 0.7
- `critical`: failure probability ≥ 0.7

When failure probability ≥ 0.7, the system:
1. Inserts an alert into Supabase
2. Sends an email alert (if SendGrid is configured)

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
vercel --prod
```


```

### AI Service → Railway

```bash
cd ai-service
# Push to GitHub and connect to Railway
# Set PORT=$PORT in Railway dashboard
# Use Dockerfile for deployment
```

---

## Performance & Security

- **Security:** Helmet, CORS, rate limiting, input validation via express-validator
- **Caching:** NodeCache (60s TTL for machines, 30s for alerts)
- **Code Splitting:** React lazy loading, manualChunks in Vite
- **Bundle:** Tree-shaking, minification via terser
- **AI Concurrency:** Gunicorn with 4 Uvicorn workers
- **Database:** Indexed columns, pagination, range queries



## Live Demo:

https://predictive-analysis-dashboard-i5ce.vercel.app/
