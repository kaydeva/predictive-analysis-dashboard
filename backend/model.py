import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from datetime import datetime, timedelta

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")
IFOREST_PATH = os.path.join(os.path.dirname(__file__), "iforest.pkl")

FEATURES = [
    "temperature_celsius",
    "vibration_level",
    "pressure_psi",
    "humidity_percent",
    "load_percentage",
    "operating_hours",
]

def generate_synthetic_data(n_samples=5000):
    np.random.seed(42)
    data = {
        "temperature_celsius": np.random.normal(65, 15, n_samples),
        "vibration_level": np.random.normal(5, 2, n_samples),
        "pressure_psi": np.random.normal(100, 20, n_samples),
        "humidity_percent": np.random.normal(45, 15, n_samples),
        "load_percentage": np.random.normal(60, 20, n_samples),
        "operating_hours": np.random.uniform(0, 10000, n_samples),
    }
    df = pd.DataFrame(data)

    df["temperature_celsius"] = df["temperature_celsius"].clip(20, 120)
    df["vibration_level"] = df["vibration_level"].clip(0, 20)
    df["pressure_psi"] = df["pressure_psi"].clip(30, 200)
    df["humidity_percent"] = df["humidity_percent"].clip(0, 100)
    df["load_percentage"] = df["load_percentage"].clip(0, 100)

    anomaly_score = np.zeros(n_samples)
    failure_prob = np.zeros(n_samples)

    high_temp = df["temperature_celsius"] > 85
    high_vib = df["vibration_level"] > 10
    high_pressure = df["pressure_psi"] > 150
    high_load = df["load_percentage"] > 85
    high_hours = df["operating_hours"] > 8000

    anomaly_score += high_temp.astype(float) * 0.25
    anomaly_score += high_vib.astype(float) * 0.25
    anomaly_score += high_pressure.astype(float) * 0.20
    anomaly_score += high_load.astype(float) * 0.15
    anomaly_score += high_hours.astype(float) * 0.15

    anomaly_score += np.random.uniform(0, 0.15, n_samples)
    anomaly_score = anomaly_score.clip(0, 1)

    temp_risk = (df["temperature_celsius"] - 20) / (120 - 20)
    vib_risk = df["vibration_level"] / 20
    press_risk = (df["pressure_psi"] - 30) / (200 - 30)
    load_risk = df["load_percentage"] / 100
    hours_risk = df["operating_hours"] / 10000

    failure_prob = (
        0.25 * temp_risk
        + 0.20 * vib_risk
        + 0.15 * press_risk
        + 0.10 * (df["humidity_percent"] / 100)
        + 0.15 * load_risk
        + 0.15 * hours_risk
    )
    failure_prob += np.random.uniform(-0.05, 0.05, n_samples)
    failure_prob = failure_prob.clip(0, 1)

    thresholds = np.random.uniform(0.3, 0.6, n_samples)
    maintenance_required = (failure_prob > thresholds).astype(int)

    df["failure_probability"] = failure_prob
    df["anomaly_score"] = anomaly_score
    df["maintenance_required"] = maintenance_required

    return df


def train_model():
    print("Generating synthetic training data...")
    df = generate_synthetic_data(5000)

    X = df[FEATURES]
    y = df["maintenance_required"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    print(f"Model Performance:")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")

    print("Training IsolationForest for anomaly detection...")
    iforest = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42,
        n_jobs=-1,
    )
    iforest.fit(X_train_scaled)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(iforest, IFOREST_PATH)

    print(f"Model saved to {MODEL_PATH}")
    print(f"Scaler saved to {SCALER_PATH}")
    print(f"IsolationForest saved to {IFOREST_PATH}")

    return model, scaler, iforest


def load_model():
    if not os.path.exists(MODEL_PATH):
        print("No saved model found. Training new model...")
        return train_model()

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    iforest = joblib.load(IFOREST_PATH)
    print("Model loaded from disk.")
    return model, scaler, iforest


def predict(features: dict) -> dict:
    model, scaler, iforest = load_model()

    input_df = pd.DataFrame([features])
    input_df = input_df[FEATURES]

    input_scaled = scaler.transform(input_df)

    failure_prob = model.predict_proba(input_scaled)[:, 1][0]

    iforest_score = iforest.score_samples(input_scaled)[0]
    anomaly_score = float(1 - (iforest_score + 0.5) / 0.5)
    anomaly_score = max(0, min(1, anomaly_score))

    if failure_prob >= 0.7:
        status = "critical"
    elif failure_prob >= 0.4:
        status = "warning"
    else:
        status = "ok"

    return {
        "failure_probability": round(float(failure_prob), 4),
        "anomaly_score": round(float(anomaly_score), 4),
        "status": status,
    }


if __name__ == "__main__":
    train_model()
