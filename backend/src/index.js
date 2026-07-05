require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const machineRoutes = require("./routes/machines");
const alertRoutes = require("./routes/alerts");
const predictRoutes = require("./routes/predict");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.length === 0 || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

app.use("/api/machines", machineRoutes);
app.use("/api/machine_readings", machineRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/predict", predictRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "predictive-maintenance-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

module.exports = app;
