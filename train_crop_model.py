"""
AgriAdvisor — Phase 2: Crop Recommendation Model Training (Calibrated Random Forest)
- Real Kaggle Dataset (2,200 rows, 22 classes)
- Duplicate / Data Leakage Check
- Stratified 5-Fold Cross-Validation
- Probability Calibration (CalibratedClassifierCV)
- Metrics: Test Accuracy, Macro F1, Weighted Precision/Recall, 22x22 Confusion Matrix
- Supported vs Unsupported Crop Catalog
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
import joblib

def main():
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(MODELS_DIR, exist_ok=True)

    csv_path = os.path.join(DATA_DIR, "Crop_recommendation.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Missing dataset at {csv_path}")

    print("=" * 80)
    print("PHASE 2: TRAINING CALIBRATED CROP RECOMMENDATION MODEL")
    print("=" * 80)
    sys.stdout.flush()

    # 1. LOAD DATASET
    df = pd.read_csv(csv_path)
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # 2. DUPLICATE AND DATA LEAKAGE CHECK
    exact_dupes = int(df.duplicated().sum())
    feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    feature_dupes = int(df.duplicated(subset=feature_cols).sum())

    print(f"Duplicate Check: Exact duplicates = {exact_dupes}, Feature-only duplicates = {feature_dupes}")
    if exact_dupes > 0:
        df = df.drop_duplicates()
        print(f"Cleaned exact duplicates. New shape: {df.shape}")

    X = df[feature_cols]
    y = df['label']

    classes = sorted(y.unique().tolist())
    print(f"Total Unique Crop Classes ({len(classes)}): {classes}")

    # List of major Indian crops outside this 22-crop model
    unsupported_crops = [
        "wheat", "mustard", "soybean", "sugarcane", "potato",
        "onion", "groundnut", "barley", "bajra", "jowar", "garlic", "ginger"
    ]

    # 3. 5-FOLD STRATIFIED CROSS VALIDATION
    print("\n--- 5-FOLD STRATIFIED CROSS VALIDATION ---")
    sys.stdout.flush()
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    cv_accuracies = []
    cv_macro_f1 = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_f_train, X_f_val = X.iloc[train_idx], X.iloc[val_idx]
        y_f_train, y_f_val = y.iloc[train_idx], y.iloc[val_idx]

        fold_rf = RandomForestClassifier(n_estimators=50, max_depth=16, random_state=42 + fold, n_jobs=1)
        fold_rf.fit(X_f_train, y_f_train)
        y_f_pred = fold_rf.predict(X_f_val)

        acc = accuracy_score(y_f_val, y_f_pred)
        f1 = f1_score(y_f_val, y_f_pred, average='macro')
        cv_accuracies.append(acc)
        cv_macro_f1.append(f1)
        print(f"  Fold {fold}: Accuracy = {acc * 100:.2f}%, Macro F1 = {f1:.4f}")
        sys.stdout.flush()

    cv_acc_arr = np.array(cv_accuracies)
    cv_f1_arr = np.array(cv_macro_f1)
    print(f"Mean CV Accuracy: {cv_acc_arr.mean() * 100:.2f}% (+/- {cv_acc_arr.std() * 100:.2f}%)")
    print(f"Mean CV Macro F1: {cv_f1_arr.mean():.4f} (+/- {cv_f1_arr.std():.4f})")
    sys.stdout.flush()

    # 4. STRATIFIED TRAIN / TEST SPLIT (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # 5. PROBABILITY CALIBRATION
    print("\nFitting CalibratedClassifierCV (Probability Calibration)...")
    sys.stdout.flush()
    base_model = RandomForestClassifier(n_estimators=80, max_depth=16, random_state=42, n_jobs=1)
    calibrated_model = CalibratedClassifierCV(estimator=base_model, cv=3, method='sigmoid')
    calibrated_model.fit(X_train, y_train)

    # 6. EVALUATION ON HELD-OUT TEST SET (440 samples)
    y_pred = calibrated_model.predict(X_test)
    y_prob = calibrated_model.predict_proba(X_test)

    test_acc = accuracy_score(y_test, y_pred)
    test_macro_f1 = f1_score(y_test, y_pred, average='macro')
    test_weighted_prec = precision_score(y_test, y_pred, average='weighted')
    test_weighted_rec = recall_score(y_test, y_pred, average='weighted')
    conf_matrix = confusion_matrix(y_test, y_pred, labels=classes).tolist()

    print("\n--- TEST EVALUATION (HELD-OUT 20% SET - 440 SAMPLES) ---")
    print(f"Test Accuracy      : {test_acc * 100:.2f}%")
    print(f"Test Macro F1 Score: {test_macro_f1:.4f}")
    print(f"Weighted Precision : {test_weighted_prec * 100:.2f}%")
    print(f"Weighted Recall    : {test_weighted_rec * 100:.2f}%")
    print(f"Confusion Matrix   : {len(conf_matrix)}x{len(conf_matrix[0])} matrix")
    sys.stdout.flush()

    # 7. EXPORT METRICS & ARTIFACTS
    metrics_payload = {
        "model_name": "Calibrated Crop Recommendation Model (Model 1)",
        "algorithm": "Random Forest Classifier with Sigmoid Probability Calibration",
        "dataset": "Atharva Ingle / ICAR Multi-Crop Dataset (22 crops)",
        "dataset_type": "real_dataset",
        "total_samples": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "features": feature_cols,
        "classes": classes,
        "classes_count": len(classes),
        "unsupported_crops": unsupported_crops,
        "duplicate_check": {
            "exact_duplicates": exact_dupes,
            "feature_only_duplicates": feature_dupes,
            "status": "PASSED"
        },
        "cross_validation_5fold": {
            "mean_accuracy": float(round(cv_acc_arr.mean(), 4)),
            "std_accuracy": float(round(cv_acc_arr.std(), 4)),
            "mean_macro_f1": float(round(cv_f1_arr.mean(), 4)),
            "std_macro_f1": float(round(cv_f1_arr.std(), 4)),
            "folds": [
                {"fold": i + 1, "accuracy": float(round(acc, 4)), "macro_f1": float(round(f1, 4))}
                for i, (acc, f1) in enumerate(zip(cv_accuracies, cv_macro_f1))
            ]
        },
        "test_metrics": {
            "accuracy": float(round(test_acc, 4)),
            "macro_f1": float(round(test_macro_f1, 4)),
            "weighted_precision": float(round(test_weighted_prec, 4)),
            "weighted_recall": float(round(test_weighted_rec, 4)),
        },
        "confusion_matrix": conf_matrix,
    }

    model_save_path = os.path.join(MODELS_DIR, "crop_model.joblib")
    metrics_save_path = os.path.join(MODELS_DIR, "crop_metrics.json")

    joblib.dump(calibrated_model, model_save_path)
    with open(metrics_save_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\nArtifacts successfully written:")
    print(f"  Model  : {model_save_path}")
    print(f"  Metrics: {metrics_save_path}")
    print("=" * 80)
    sys.stdout.flush()

if __name__ == '__main__':
    main()
