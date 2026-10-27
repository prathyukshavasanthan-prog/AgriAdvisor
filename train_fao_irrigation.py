"""
train_fao_irrigation.py
Builds authentic FAO-56 daily soil water balance dataset using REAL historical
daily weather (temperature, rain, ET0) for 30 locations across India for 3 years (2021-2023).
Evaluates Random Forest on 6 HELD-OUT LOCATIONS (never random row shuffle).
Target: Macro F1 >= 0.85.
Saves model, encoders, and metrics with honest label:
"trained on an agronomic simulation with real historical weather"
"""

import os
import json
import time
import urllib.request
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# 30 Authenticated Indian Agricultural Locations
LOCATIONS = [
    # 24 Training Locations
    {"id": "ludhiana", "name": "Ludhiana, Punjab", "lat": 30.90, "lon": 75.85, "split": "train"},
    {"id": "karnal", "name": "Karnal, Haryana", "lat": 29.68, "lon": 76.99, "split": "train"},
    {"id": "varanasi", "name": "Varanasi, UP", "lat": 25.31, "lon": 82.97, "split": "train"},
    {"id": "burdwan", "name": "Burdwan, West Bengal", "lat": 23.23, "lon": 87.86, "split": "train"},
    {"id": "thanjavur", "name": "Thanjavur, Tamil Nadu", "lat": 10.78, "lon": 79.13, "split": "train"},
    {"id": "madurai", "name": "Madurai, Tamil Nadu", "lat": 9.92, "lon": 78.11, "split": "train"},
    {"id": "guntur", "name": "Guntur, Andhra Pradesh", "lat": 16.30, "lon": 80.43, "split": "train"},
    {"id": "anantapur", "name": "Anantapur, Andhra Pradesh", "lat": 14.68, "lon": 77.60, "split": "train"},
    {"id": "dharwad", "name": "Dharwad, Karnataka", "lat": 15.45, "lon": 75.00, "split": "train"},
    {"id": "palakkad", "name": "Palakkad, Kerala", "lat": 10.78, "lon": 76.65, "split": "train"},
    {"id": "akola", "name": "Akola, Maharashtra", "lat": 20.70, "lon": 77.01, "split": "train"},
    {"id": "nashik", "name": "Nashik, Maharashtra", "lat": 19.99, "lon": 73.78, "split": "train"},
    {"id": "pune", "name": "Pune, Maharashtra", "lat": 18.52, "lon": 73.85, "split": "train"},
    {"id": "indore", "name": "Indore, Madhya Pradesh", "lat": 22.71, "lon": 75.85, "split": "train"},
    {"id": "jabalpur", "name": "Jabalpur, Madhya Pradesh", "lat": 23.18, "lon": 79.98, "split": "train"},
    {"id": "raipur", "name": "Raipur, Chhattisgarh", "lat": 21.25, "lon": 81.62, "split": "train"},
    {"id": "anand", "name": "Anand, Gujarat", "lat": 22.56, "lon": 72.92, "split": "train"},
    {"id": "kota", "name": "Kota, Rajasthan", "lat": 25.18, "lon": 75.83, "split": "train"},
    {"id": "hissar", "name": "Hissar, Haryana", "lat": 29.15, "lon": 75.72, "split": "train"},
    {"id": "shimla", "name": "Shimla, Himachal Pradesh", "lat": 31.10, "lon": 77.17, "split": "train"},
    {"id": "jammu", "name": "Jammu, J&K", "lat": 32.72, "lon": 74.85, "split": "train"},
    {"id": "ranchi", "name": "Ranchi, Jharkhand", "lat": 23.34, "lon": 85.30, "split": "train"},
    {"id": "coimbatore", "name": "Coimbatore, Tamil Nadu", "lat": 11.01, "lon": 76.95, "split": "train"},
    {"id": "gwalior", "name": "Gwalior, Madhya Pradesh", "lat": 26.21, "lon": 78.17, "split": "train"},

    # 6 Completely HELD-OUT Locations for Zero-Leakage Evaluation
    {"id": "nagpur", "name": "Nagpur, Maharashtra", "lat": 21.14, "lon": 79.08, "split": "test"},
    {"id": "mandya", "name": "Mandya, Karnataka", "lat": 12.52, "lon": 76.89, "split": "test"},
    {"id": "patna", "name": "Patna, Bihar", "lat": 25.59, "lon": 85.13, "split": "test"},
    {"id": "rajkot", "name": "Rajkot, Gujarat", "lat": 22.30, "lon": 70.80, "split": "test"},
    {"id": "jodhpur", "name": "Jodhpur, Rajasthan", "lat": 26.23, "lon": 73.02, "split": "test"},
    {"id": "cuttack", "name": "Cuttack, Odisha", "lat": 20.46, "lon": 85.88, "split": "test"},
]

# Soil Types & AWHC (Available Water Holding Capacity, mm/m) from FAO-56 Table 19 & Phase 1
SOIL_AWHC = {
    'alluvial': 155.0,
    'black': 185.0,
    'red': 130.0,
    'laterite': 115.0,
    'sandy': 80.0,
    'sandy_loam': 125.0,
    'loamy': 160.0,
    'silty': 190.0,
    'clay_loam': 180.0,
    'clay': 175.0,
    'saline_alkaline': 140.0,
    'peaty_marshy': 210.0,
    'desert_arid': 75.0,
    'hill_forest': 150.0,
}

# Crops: Kc stages (Initial, Mid, End) and Rooting Depth Zr (m) from FAO-56 Table 12
CROP_FAO = {
    'rice': {'kc_ini': 1.05, 'kc_mid': 1.20, 'kc_end': 0.90, 'zr': 0.6, 'p': 0.20},
    'wheat': {'kc_ini': 0.40, 'kc_mid': 1.15, 'kc_end': 0.40, 'zr': 1.0, 'p': 0.55},
    'cotton': {'kc_ini': 0.35, 'kc_mid': 1.20, 'kc_end': 0.60, 'zr': 1.2, 'p': 0.65},
    'maize': {'kc_ini': 0.40, 'kc_mid': 1.20, 'kc_end': 0.50, 'zr': 1.0, 'p': 0.50},
    'chickpea': {'kc_ini': 0.40, 'kc_mid': 1.05, 'kc_end': 0.35, 'zr': 0.8, 'p': 0.50},
    'sugarcane': {'kc_ini': 0.40, 'kc_mid': 1.25, 'kc_end': 0.75, 'zr': 1.3, 'p': 0.65},
    'tomato': {'kc_ini': 0.50, 'kc_mid': 1.15, 'kc_end': 0.80, 'zr': 0.7, 'p': 0.40},
}

# Irrigation Method Efficiencies
IRRIG_EFFICIENCY = {
    'drip': 0.90,
    'sprinkler': 0.80,
    'furrow': 0.70,
    'flood': 0.60,
    'none': 1.00,
}

def fetch_weather_cache():
    cache_file = os.path.join(DATA_DIR, "weather_30_locations_2021_2023.json")
    if os.path.exists(cache_file):
        print(f"Loading cached real daily weather from {cache_file}...")
        with open(cache_file, "r") as f:
            return json.load(f)

    print("Fetching authentic 3-year daily weather for 30 locations from Open-Meteo Archive API...")
    weather_data = {}
    for i, loc in enumerate(LOCATIONS):
        loc_id = loc["id"]
        url = (
            f"https://archive-api.open-meteo.com/v1/archive?"
            f"latitude={loc['lat']:.2f}&longitude={loc['lon']:.2f}&"
            f"start_date=2021-01-01&end_date=2023-12-31&"
            f"daily=temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration&"
            f"timezone=Asia%2FKolkata"
        )
        print(f"  [{i+1}/30] Fetching {loc['name']} ({loc_id})...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'AgriAdvisor-FAO56/1.0'})
            with urllib.request.urlopen(req, timeout=15) as res:
                data = json.loads(res.read().decode('utf-8'))
                weather_data[loc_id] = {
                    "dates": data['daily']['time'],
                    "temp": data['daily']['temperature_2m_mean'],
                    "rain": data['daily']['precipitation_sum'],
                    "et0": data['daily']['et0_fao_evapotranspiration']
                }
            time.sleep(0.3) # gentle rate limiting
        except Exception as e:
            print(f"    Failed {loc_id}: {e}")

    with open(cache_file, "w") as f:
        json.dump(weather_data, f)
    print(f"Saved weather cache for {len(weather_data)} locations to {cache_file}.")
    return weather_data

def simulate_fao56_dataset(weather_data):
    print("\nRunning FAO-56 Daily Soil Water Balance Simulation across all 30 locations...")
    records = []
    rng = np.random.RandomState(42)

    crop_list = list(CROP_FAO.keys())
    soil_list = list(SOIL_AWHC.keys())
    method_list = list(IRRIG_EFFICIENCY.keys())

    for loc in LOCATIONS:
        loc_id = loc["id"]
        split = loc["split"]
        w = weather_data.get(loc_id)
        if not w:
            continue

        n_days = len(w["dates"])
        temps = np.array(w["temp"], dtype=float)
        rains = np.array(w["rain"], dtype=float)
        et0s = np.array(w["et0"], dtype=float)

        # Handle NaNs if any
        temps = np.nan_to_num(temps, nan=25.0)
        rains = np.nan_to_num(rains, nan=0.0)
        et0s = np.nan_to_num(et0s, nan=3.5)

        # Generate 28 diverse crop-soil-irrigation rotation profiles per location (all 14 soils)
        for profile_idx in range(28):
            crop_name = crop_list[profile_idx % len(crop_list)]
            soil_name = soil_list[profile_idx % len(soil_list)]
            method = method_list[profile_idx % len(method_list)]

            crop_info = CROP_FAO[crop_name]
            awhc = SOIL_AWHC[soil_name]
            eff = IRRIG_EFFICIENCY[method]

            # Total Available Water (mm) = AWHC (mm/m) * Zr (m)
            TAW = awhc * crop_info["zr"]
            RAW = crop_info["p"] * TAW

            # Daily Water Balance State
            Dr = 0.3 * TAW # Initial depletion
            days_since_rain = 0
            days_since_irrig = 0

            # Step through each day
            for t in range(14, n_days - 2):
                date_str = w["dates"][t]
                # Growth stage Kc based on season progress
                day_of_year = t % 365
                if day_of_year < 45:
                    kc = crop_info["kc_ini"]
                elif day_of_year < 150:
                    kc = crop_info["kc_mid"]
                else:
                    kc = crop_info["kc_end"]

                daily_rain = rains[t]
                daily_et0 = et0s[t]
                daily_etc = kc * daily_et0

                if daily_rain > 2.0:
                    days_since_rain = 0
                else:
                    days_since_rain += 1

                days_since_irrig += 1

                # Daily soil moisture depletion update: Dr_t = Dr_{t-1} - (P - RO) + ETc
                # Runoff occurs if rain exceeds available storage (Dr)
                effective_rain = min(daily_rain, Dr + 5.0)
                Dr = Dr - effective_rain + daily_etc
                Dr = max(0.0, min(TAW, Dr)) # Bound within [0, TAW]

                # Lookahead 48h weather with small Gaussian noise to simulate forecast error (±10%)
                future_rain_raw = rains[t+1] + rains[t+2]
                forecast_error_factor = 1.0 + rng.normal(0.0, 0.10)
                forecast_rain_48h = max(0.0, future_rain_raw * forecast_error_factor)
                forecast_temp_48h = (temps[t+1] + temps[t+2]) / 2.0 + rng.normal(0.0, 0.5)
                forecast_et0_48h = (et0s[t+1] + et0s[t+2]) / 2.0

                depletion_pct = (Dr / TAW) * 100.0

                # Determine FAO-56 Grounded Label
                if forecast_rain_48h >= 15.0:
                    label = "Hold (rain coming)"
                    urgency = "Low"
                elif Dr >= RAW or depletion_pct >= 50.0:
                    label = "Irrigate now"
                    urgency = "High"
                elif Dr >= 0.35 * TAW or (depletion_pct >= 32.0 and forecast_rain_48h < 5.0):
                    label = "Irrigate in 2-3 days"
                    urgency = "Medium"
                else:
                    label = "Not needed"
                    urgency = "Low"

                # Sample every 4th day to balance speed and coverage
                if t % 4 == 0:
                    records.append({
                        "location_id": loc_id,
                        "location_name": loc["name"],
                        "split": split,
                        "date": date_str,
                        "soil_type": soil_name,
                        "crop_type": crop_name,
                        "irrigation_method": method,
                        "soil_water_depletion_pct": round(depletion_pct, 2),
                        "awhc": round(awhc, 1),
                        "crop_kc": round(kc, 2),
                        "root_depth_m": crop_info["zr"],
                        "irrigation_efficiency": eff,
                        "days_since_rain": min(days_since_rain, 45),
                        "days_since_last_irrigation": min(days_since_irrig, 35),
                        "forecast_rain_next_48h": round(forecast_rain_48h, 2),
                        "temp_avg_48h": round(forecast_temp_48h, 1),
                        "et0_avg_48h": round(forecast_et0_48h, 2),
                        "action_label": label,
                        "urgency_level": urgency
                    })

                # If irrigation occurs, depletion resets for the next day
                if label == "Irrigate now":
                    Dr = 0.05 * TAW
                    days_since_irrig = 0

    df = pd.DataFrame(records)
    print(f"Generated FAO-56 dataset: {df.shape[0]} samples across {df['location_id'].nunique()} locations.")
    print("Class distribution:")
    print(df['action_label'].value_counts())
    df.to_csv(os.path.join(DATA_DIR, "fao_irrigation_dataset.csv"), index=False)
    return df

def train_and_evaluate(df):
    print("\n" + "=" * 80)
    print("TRAINING MODEL 2: FAO-56 SOIL WATER BALANCE RANDOM FOREST")
    print("EVALUATING ON 6 HELD-OUT INDIAN AGRO-CLIMATIC LOCATIONS")
    print("=" * 80)

    # Encode categoricals
    soil_encoder = {s: i for i, s in enumerate(sorted(df['soil_type'].unique()))}
    crop_encoder = {c: i for i, c in enumerate(sorted(df['crop_type'].unique()))}
    method_encoder = {m: i for i, m in enumerate(sorted(df['irrigation_method'].unique()))}

    df['soil_type_code'] = df['soil_type'].map(soil_encoder)
    df['crop_type_code'] = df['crop_type'].map(crop_encoder)
    df['method_code'] = df['irrigation_method'].map(method_encoder)

    feature_cols = [
        "soil_water_depletion_pct",
        "awhc",
        "crop_kc",
        "root_depth_m",
        "irrigation_efficiency",
        "days_since_rain",
        "days_since_last_irrigation",
        "forecast_rain_next_48h",
        "temp_avg_48h",
        "et0_avg_48h",
        "soil_type_code",
        "crop_type_code",
        "method_code"
    ]

    train_df = df[df["split"] == "train"]
    test_df = df[df["split"] == "test"]

    print(f"Train set: {len(train_df)} samples across 24 locations")
    print(f"Test set : {len(test_df)} samples across 6 held-out locations ({test_df['location_id'].unique().tolist()})")

    X_train = train_df[feature_cols]
    y_train = train_df["action_label"]

    X_test = test_df[feature_cols]
    y_test = test_df["action_label"]

    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=16,
        min_samples_split=4,
        random_state=42,
        n_jobs=1
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_pred_proba = clf.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    macro_prec = precision_score(y_test, y_pred, average="macro")
    macro_rec = recall_score(y_test, y_pred, average="macro")
    cm = confusion_matrix(y_test, y_pred, labels=clf.classes_).tolist()

    print("\n--- HELD-OUT LOCATIONS TEST RESULTS ---")
    print(f"Accuracy : {acc * 100:.2f}%")
    print(f"Macro F1 : {macro_f1:.4f}  (Requirement: >= 0.85)")
    print(f"Macro Prec: {macro_prec:.4f}")
    print(f"Macro Rec : {macro_rec:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, digits=4))

    print("\nConfusion Matrix (Classes:", clf.classes_.tolist(), "):")
    print(np.array(cm))

    # Feature Importances
    importances = dict(zip(feature_cols, [round(float(v), 4) for v in clf.feature_importances_]))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    print("\nFeature Importances:")
    for f, imp in sorted_importances:
        print(f"  {f:28s}: {imp:.4f}")

    # Save artifacts
    joblib.dump(clf, os.path.join(MODELS_DIR, "irrigation_model.joblib"))
    joblib.dump({
        "soil_encoder": soil_encoder,
        "crop_encoder": crop_encoder,
        "method_encoder": method_encoder,
        "feature_cols": feature_cols,
        "classes": clf.classes_.tolist()
    }, os.path.join(MODELS_DIR, "irrigation_encoders.joblib"))

    metrics_payload = {
        "model_name": "FAO-56 Precision Irrigation Decision Engine (Model 2)",
        "dataset": "FAO-56 Daily Soil Water Balance on 3-Year Real Historical Weather (30 Indian Locations)",
        "dataset_type": "FAO-56 Daily Soil Water Balance Simulation (Real Weather)",
        "classifier": "RandomForestClassifier",
        "trained_on": "trained on an agronomic simulation with real historical weather",
        "held_out_locations": test_df['location_id'].unique().tolist(),
        "total_samples": len(df),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "accuracy": float(acc),
        "macro_f1": float(macro_f1),
        "precision": float(macro_prec),
        "recall": float(macro_rec),
        "macro_precision": float(macro_prec),
        "macro_recall": float(macro_rec),
        "classes": clf.classes_.tolist(),
        "confusion_matrix": cm,
        "feature_importances": importances
    }

    with open(os.path.join(MODELS_DIR, "irrigation_metrics.json"), "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print("\nSaved artifacts to models/irrigation_model.joblib, models/irrigation_encoders.joblib, models/irrigation_metrics.json.")
    return macro_f1

if __name__ == "__main__":
    weather_cache = fetch_weather_cache()
    df = simulate_fao56_dataset(weather_cache)
    f1 = train_and_evaluate(df)
    if f1 >= 0.85:
        print(f"\nSUCCESS: Held-out Macro F1 = {f1:.4f} >= 0.85 requirement met!")
    else:
        print(f"\nWARNING: Held-out Macro F1 = {f1:.4f} below 0.85 requirement.")
