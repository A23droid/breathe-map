#!/usr/bin/env python3
import json
import sys
from pathlib import Path

import joblib
import pandas as pd


def _category(aqi: float) -> str:
    if aqi <= 50:
        return "good"
    if aqi <= 100:
        return "satisfactory"
    if aqi <= 200:
        return "moderate"
    if aqi <= 300:
        return "poor"
    return "severe"


def _normalize_land_use(value: str) -> str:
    mapping = {
        "residential": "Residential",
        "commercial": "Commercial",
        "industrial": "Industrial",
        "green_space": "Green",
        "mixed": "Mixed",
    }
    return mapping.get(value, "Mixed")


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read())
    except Exception as exc:
        print(json.dumps({"error": f"Invalid JSON payload: {exc}"}))
        return 1

    base_dir = Path(__file__).resolve().parent
    try:
        aqi_model = joblib.load(base_dir / "aqi_model.pkl")
        cluster_model = joblib.load(base_dir / "cluster_model.pkl")
        cluster_scaler = joblib.load(base_dir / "cluster_scaler.pkl")
    except Exception as exc:
        print(json.dumps({"error": f"Failed to load model artifacts: {exc}"}))
        return 1

    traffic = float(payload.get("trafficDensity", 0))
    population = float(payload.get("populationDensity", 0))
    road = float(payload.get("roadLength", 0))
    temperature = float(payload.get("temperature", 32))
    humidity = float(payload.get("humidity", 55))
    time_of_day = int(payload.get("timeOfDay", 12))
    land_use = _normalize_land_use(str(payload.get("landUseType", "mixed")))

    zone_df = pd.DataFrame(
        [
            {
                "trafficDensity": traffic,
                "populationDensity": population,
                "roadLength": road,
                "temperature": temperature,
                "humidity": humidity,
                "timeOfDay": time_of_day,
                "landUseType": land_use,
            }
        ]
    )

    zone_encoded = pd.get_dummies(zone_df)
    train_columns = aqi_model.feature_names_in_
    for col in train_columns:
        if col not in zone_encoded:
            zone_encoded[col] = 0
    zone_encoded = zone_encoded[train_columns]

    predicted_aqi = float(aqi_model.predict(zone_encoded)[0])
    predicted_aqi = max(0.0, min(500.0, predicted_aqi))

    cluster_input = pd.DataFrame(
        [
            {
                "AQI": predicted_aqi,
                "trafficDensity": traffic,
                "populationDensity": population,
                "roadLength": road,
            }
        ]
    )
    scaled = cluster_scaler.transform(cluster_input)
    cluster_id = int(cluster_model.predict(scaled)[0])

    feature_contributions = {
        "traffic": round(max(0.0, traffic * 0.45), 2),
        "population": round(max(0.0, population * 0.25), 2),
        "road_network": round(max(0.0, road * 2.4), 2),
        "land_use": round({"Industrial": 35, "Commercial": 20, "Mixed": 12, "Residential": 8, "Green": -15}[land_use], 2),
    }

    result = {
        "estimated_aqi": round(predicted_aqi, 2),
        "category": _category(predicted_aqi),
        "cluster_id": cluster_id,
        "feature_contributions": feature_contributions,
        "model_version": "aqi_model.pkl+cluster_model.pkl",
    }
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
