import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib

os.makedirs("models", exist_ok=True)
os.makedirs("data", exist_ok=True)

print("=" * 80)
print("TRAINING MODEL 1: CROP RECOMMENDATION (REAL ICAR/ICFA DATASET - 2200 RECORDS)")
print("=" * 80)

# 1. LOAD REAL DATASET
csv_path = os.path.join("data", "Crop_recommendation.csv")
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"Missing {csv_path}")

df_crop = pd.read_csv(csv_path)
print(f"Loaded real dataset shape: {df_crop.shape}")
print(f"Unique crop classes ({df_crop['label'].nunique()}): {sorted(df_crop['label'].unique().tolist())}")

X_crop = df_crop[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y_crop = df_crop['label']

X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
    X_crop, y_crop, test_size=0.2, random_state=42, stratify=y_crop
)

crop_model = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
crop_model.fit(X_train_c, y_train_c)

y_pred_c = crop_model.predict(X_test_c)

c_acc = accuracy_score(y_test_c, y_pred_c)
c_prec = precision_score(y_test_c, y_pred_c, average='weighted')
c_rec = recall_score(y_test_c, y_pred_c, average='weighted')
c_cm = confusion_matrix(y_test_c, y_pred_c).tolist()

print("\n--- MODEL 1 METRICS (CROP RECOMMENDATION - REAL DATASET) ---")
print(f"Accuracy : {c_acc * 100:.2f}%")
print(f"Precision: {c_prec * 100:.2f}%")
print(f"Recall   : {c_rec * 100:.2f}%")
print("Confusion Matrix shape:", np.array(c_cm).shape)

crop_metrics = {
    "model_name": "Crop Recommendation (Model 1)",
    "dataset": "Kaggle Crop Recommendation Dataset (Atharva Ingle / ICAR)",
    "trained_on": "real_dataset",
    "total_samples": len(df_crop),
    "classes_count": int(df_crop['label'].nunique()),
    "features": list(X_crop.columns),
    "classes": sorted(df_crop['label'].unique().tolist()),
    "accuracy": float(c_acc),
    "precision": float(c_prec),
    "recall": float(c_rec),
    "confusion_matrix": c_cm
}

joblib.dump(crop_model, os.path.join("models", "crop_model.joblib"))
with open(os.path.join("models", "crop_metrics.json"), "w") as f:
    json.dump(crop_metrics, f, indent=2)
print("Saved models/crop_model.joblib and models/crop_metrics.json successfully.")


print("\n" + "=" * 80)
print("TRAINING MODEL 2: IRRIGATION URGENCY (SYNTHETIC BOOTSTRAP - 1800 RECORDS)")
print("=" * 80)

# 2. GENERATE SYNTHETIC IRRIGATION DATASET (Domain-informed)
np.random.seed(42)
n_samples = 1800

soil_types = ['clay', 'sandy', 'loamy', 'black', 'red', 'alluvial']
crop_types = ['rice', 'wheat', 'cotton', 'maize', 'sugarcane', 'vegetables', 'pulses']

days_since_rain = np.random.randint(0, 30, size=n_samples)
days_since_last_irrigation = np.random.randint(0, 22, size=n_samples)
soil_choice = np.random.choice(soil_types, size=n_samples)
crop_choice = np.random.choice(crop_types, size=n_samples)
forecast_rain_prob = np.round(np.random.uniform(0, 100, size=n_samples), 1)
forecast_rain_amount = np.round(np.random.exponential(scale=8, size=n_samples), 1)

actions = []
urgencies = []

# High water need crops
high_water_crops = {'rice', 'sugarcane', 'vegetables'}
# Fast draining soils
fast_draining_soils = {'sandy', 'red'}

for i in range(n_samples):
    dsr = days_since_rain[i]
    dsi = days_since_last_irrigation[i]
    st = soil_choice[i]
    ct = crop_choice[i]
    prob = forecast_rain_prob[i]
    amt = forecast_rain_amount[i]

    # Domain rule: Rain forecast is imminent and substantial
    if prob >= 65.0 and amt >= 12.0:
        actions.append("Delay Irrigation")
        urgencies.append("Low")
    # Prolonged dry spell + high need
    elif (dsi >= 7 or dsr >= 12) and (ct in high_water_crops or st in fast_draining_soils):
        actions.append("Irrigate")
        urgencies.append("High")
    # Moderate need with no rain expected
    elif dsi >= 4 and prob < 35.0:
        actions.append("Irrigate")
        urgencies.append("Medium")
    # Recently watered or rained
    elif dsi <= 2 or dsr <= 2:
        actions.append("No Action Needed")
        urgencies.append("Low")
    # Intermediate condition -> Monitor
    else:
        actions.append("Monitor")
        urgencies.append("Medium" if dsi >= 5 else "Low")

df_irrig = pd.DataFrame({
    'days_since_rain': days_since_rain,
    'days_since_last_irrigation': days_since_last_irrigation,
    'soil_type': soil_choice,
    'forecast_rain_probability': forecast_rain_prob,
    'forecast_rain_amount': forecast_rain_amount,
    'crop_type': crop_choice,
    'recommended_action': actions,
    'urgency_level': urgencies
})

# Composite target for clean single multi-class model
df_irrig['target'] = df_irrig['recommended_action'] + "::" + df_irrig['urgency_level']

# Encode categorical features
le_soil = LabelEncoder().fit(soil_types)
le_crop = LabelEncoder().fit(crop_types)
le_target = LabelEncoder().fit(df_irrig['target'])

df_irrig['soil_encoded'] = le_soil.transform(df_irrig['soil_type'])
df_irrig['crop_encoded'] = le_crop.transform(df_irrig['crop_type'])
y_irrig = le_target.transform(df_irrig['target'])

feature_cols = [
    'days_since_rain',
    'days_since_last_irrigation',
    'soil_encoded',
    'forecast_rain_probability',
    'forecast_rain_amount',
    'crop_encoded'
]
X_irrig = df_irrig[feature_cols]

X_train_i, X_test_i, y_train_i, y_test_i = train_test_split(
    X_irrig, y_irrig, test_size=0.2, random_state=42, stratify=y_irrig
)

irrig_model = RandomForestClassifier(n_estimators=120, max_depth=14, random_state=42)
irrig_model.fit(X_train_i, y_train_i)

y_pred_i = irrig_model.predict(X_test_i)

i_acc = accuracy_score(y_test_i, y_pred_i)
i_prec = precision_score(y_test_i, y_pred_i, average='weighted')
i_rec = recall_score(y_test_i, y_pred_i, average='weighted')

print("\n--- MODEL 2 METRICS (IRRIGATION URGENCY - SYNTHETIC BOOTSTRAP) ---")
print(f"Accuracy : {i_acc * 100:.2f}%")
print(f"Precision: {i_prec * 100:.2f}%")
print(f"Recall   : {i_rec * 100:.2f}%")

# Feature importances
importances = dict(zip(feature_cols, [float(v) for v in irrig_model.feature_importances_]))
print("Feature Importances:", importances)

irrig_metrics = {
    "model_name": "Irrigation Urgency & Action (Model 2)",
    "dataset": "Synthetic Agronomic Bootstrap Dataset",
    "trained_on": "synthetic_bootstrap",
    "total_samples": len(df_irrig),
    "features": feature_cols,
    "feature_importances": importances,
    "accuracy": float(i_acc),
    "precision": float(i_prec),
    "recall": float(i_rec),
    "target_classes": le_target.classes_.tolist()
}

joblib.dump(irrig_model, os.path.join("models", "irrigation_model.joblib"))
joblib.dump({
    "soil_encoder": le_soil,
    "crop_encoder": le_crop,
    "target_encoder": le_target,
    "feature_cols": feature_cols
}, os.path.join("models", "irrigation_encoders.joblib"))

with open(os.path.join("models", "irrigation_metrics.json"), "w") as f:
    json.dump(irrig_metrics, f, indent=2)

print("Saved models/irrigation_model.joblib, models/irrigation_encoders.joblib, and models/irrigation_metrics.json.")
print("=" * 80)
print("TRAINING OF BOTH MODELS COMPLETED SUCCESSFULLY!")
print("=" * 80)
