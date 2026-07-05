import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

export const getMachines = (params = {}) => api.get("/machine_readings", { params });

export const getMachine = (id) => api.get(`/machine_readings/${id}`);

export const getAlerts = (params = {}) => api.get("/alerts", { params });

export const getRecentAlerts = () => api.get("/alerts/recent");

export const predictReading = (data) => api.post("/predict", data);

export const getHealth = () => api.get("/health");

export default api;
