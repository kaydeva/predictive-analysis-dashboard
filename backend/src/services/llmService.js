const OpenAI = require("openai");

// ── DeepSeek client (OpenAI-compatible) ────────────────────────────────────
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

// ── Groq client (OpenAI-compatible) ────────────────────────────────────────
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ── Gemini helper (REST via axios – avoids bundling the full SDK) ───────────
const axios = require("axios");

async function geminiChat(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const { data } = await axios.post(url, body, { timeout: 20000 });
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── Shared prompt builder ───────────────────────────────────────────────────
function buildPrompt(reading) {
  return `You are an industrial predictive-maintenance AI.
Analyze the sensor reading below and provide a concise 2-3 sentence insight about the machine's health, highlight any concerning trends, and recommend the most important maintenance action.

Machine ID: ${reading.machine_id}
Status: ${reading.status}
Failure Probability: ${(reading.failure_probability * 100).toFixed(1)}%
Anomaly Score: ${(reading.anomaly_score * 100).toFixed(1)}%
Temperature: ${reading.temperature_celsius}°C
Vibration: ${reading.vibration_level} mm/s
Pressure: ${reading.pressure_psi} PSI
Humidity: ${reading.humidity_percent}%
Load: ${reading.load_percentage}%
Operating Hours: ${reading.operating_hours}

Respond with ONLY the insight text. No headers, no bullet points.`;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze a machine reading using DeepSeek (primary), Groq (secondary), or
 * Gemini (tertiary). Returns { insight, provider }.
 */
async function analyzeMachineReading(reading) {
  const prompt = buildPrompt(reading);

  // 1. Try DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const resp = await deepseek.chat.completions.create({
        model: "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
        temperature: 0.4,
      });
      return { insight: resp.choices[0].message.content.trim(), provider: "deepseek" };
    } catch (err) {
      console.warn("DeepSeek unavailable:", err.message);
    }
  }

  // 2. Try Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const resp = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
        temperature: 0.4,
      });
      return { insight: resp.choices[0].message.content.trim(), provider: "groq" };
    } catch (err) {
      console.warn("Groq unavailable:", err.message);
    }
  }

  // 3. Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await geminiChat(prompt);
      return { insight: text.trim(), provider: "gemini" };
    } catch (err) {
      console.warn("Gemini unavailable:", err.message);
    }
  }

  return { insight: "AI analysis unavailable. Check API keys and connectivity.", provider: "none" };
}

/**
 * Generate a fleet-level summary from an array of machine readings.
 * Uses Groq for speed (fast inference), falls back to DeepSeek.
 */
async function fleetSummary(machines) {
  const critical = machines.filter((m) => m.status === "critical").length;
  const warning = machines.filter((m) => m.status === "warning").length;
  const avgRisk = machines.length
    ? machines.reduce((s, m) => s + (m.failure_probability || 0), 0) / machines.length
    : 0;

  const prompt = `You are an industrial predictive-maintenance AI.
Fleet summary:
- Total machines: ${machines.length}
- Critical: ${critical}
- Warning: ${warning}
- Average failure probability: ${(avgRisk * 100).toFixed(1)}%

Provide a 2-sentence executive summary of fleet health and the top priority action.
Respond with ONLY the summary text.`;

  // Try Groq first for fleet (faster)
  if (process.env.GROQ_API_KEY) {
    try {
      const resp = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });
      return { summary: resp.choices[0].message.content.trim(), provider: "groq" };
    } catch (err) {
      console.warn("Groq fleet summary failed:", err.message);
    }
  }

  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const resp = await deepseek.chat.completions.create({
        model: "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });
      return { summary: resp.choices[0].message.content.trim(), provider: "deepseek" };
    } catch (err) {
      console.warn("DeepSeek fleet summary failed:", err.message);
    }
  }

  return { summary: "AI fleet summary unavailable.", provider: "none" };
}

module.exports = { analyzeMachineReading, fleetSummary };
