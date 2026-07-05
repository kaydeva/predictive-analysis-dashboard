import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from model import predict, train_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Predictive Maintenance AI Service",
    description="AI-powered failure prediction and anomaly detection for industrial machines",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SensorReading(BaseModel):
    temperature_celsius: float = Field(..., ge=0, le=200, description="Temperature in Celsius")
    vibration_level: float = Field(..., ge=0, le=50, description="Vibration level in mm/s")
    pressure_psi: float = Field(..., ge=0, le=500, description="Pressure in PSI")
    humidity_percent: float = Field(..., ge=0, le=100, description="Humidity percentage")
    load_percentage: float = Field(..., ge=0, le=100, description="Load percentage")
    operating_hours: float = Field(..., ge=0, le=100000, description="Total operating hours")

    @validator("temperature_celsius")
    def validate_temperature(cls, v):
        if v < 0 or v > 200:
            raise ValueError("Temperature must be between 0 and 200")
        return v

    @validator("vibration_level")
    def validate_vibration(cls, v):
        if v < 0 or v > 50:
            raise ValueError("Vibration level must be between 0 and 50")
        return v


class PredictionResponse(BaseModel):
    failure_probability: float
    anomaly_score: float
    status: str


@app.on_event("startup")
async def startup_event():
    logger.info("Loading AI model...")
    try:
        from model import load_model
        load_model()
        logger.info("AI model loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load model on startup: {e}. It will be loaded on first request.")


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "predictive-maintenance-ai"}


@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(reading: SensorReading):
    try:
        result = predict(reading.model_dump())
        logger.info(
            f"Prediction: failure_prob={result['failure_probability']:.4f}, "
            f"anomaly={result['anomaly_score']:.4f}, status={result['status']}"
        )
        return result
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction failed")


@app.post("/retrain")
async def retrain():
    try:
        train_model()
        return {"message": "Model retrained successfully"}
    except Exception as e:
        logger.error(f"Retrain error: {str(e)}")
        raise HTTPException(status_code=500, detail="Retraining failed")


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
