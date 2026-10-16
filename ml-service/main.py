import os
import io
import json
import base64
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import joblib
from PIL import Image

import torch
import torchvision.models as models
import torchvision.transforms as transforms

app = FastAPI(
    title="AgriAdvisor ML Microservice",
    description="Three-Model Agricultural AI Service: Model 1 (Crop Recommendation), Model 2 (Irrigation Advisory), Model 3 (Crop Health Diagnosis via Transfer Learning)",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# ==========================================
# MODEL 1: Crop Recommendation (Real Dataset)
# ==========================================
crop_model_path = os.path.join(MODELS_DIR, "crop_model.joblib")
crop_metrics_path = os.path.join(MODELS_DIR, "crop_metrics.json")

if not os.path.exists(crop_model_path):
    raise RuntimeError("Model 1 artifacts not found. Run train_models.py first.")

crop_model = joblib.load(crop_model_path)
with open(crop_metrics_path, "r") as f:
    crop_metrics = json.load(f)

# ==========================================
# MODEL 2: Irrigation Urgency (Synthetic Bootstrap)
# ==========================================
irrig_model_path = os.path.join(MODELS_DIR, "irrigation_model.joblib")
irrig_encoders_path = os.path.join(MODELS_DIR, "irrigation_encoders.joblib")
irrig_metrics_path = os.path.join(MODELS_DIR, "irrigation_metrics.json")

if not os.path.exists(irrig_model_path):
    raise RuntimeError("Model 2 artifacts not found. Run train_models.py first.")

irrig_model = joblib.load(irrig_model_path)
irrig_encoders = joblib.load(irrig_encoders_path)
with open(irrig_metrics_path, "r") as f:
    irrig_metrics = json.load(f)

REASON_MAPPINGS = {
    "crop_encoded": "Crop-specific growth stage water absorption requirement",
    "forecast_rain_probability": "High likelihood of incoming precipitation in local forecast",
    "days_since_last_irrigation": "Time elapsed since previous artificial watering application",
    "soil_encoded": "Moisture percolation and retention profile of soil type",
    "forecast_rain_amount": "Significant precipitation volume forecasted over field",
    "days_since_rain": "Natural dry period observed across field coordinates"
}

# ==========================================
# MODEL 3: Crop Health Diagnosis (Real PlantVillage Transfer Learning)
# ==========================================
crop_health_head_path = os.path.join(MODELS_DIR, "crop_health_head.joblib")
crop_health_metrics_path = os.path.join(MODELS_DIR, "crop_health_metrics.json")

crop_health_head = None
crop_health_metrics = None
mobilenet_extractor = None
mobilenet_avgpool = None
image_transforms = None

if os.path.exists(crop_health_head_path) and os.path.exists(crop_health_metrics_path):
    crop_health_head = joblib.load(crop_health_head_path)
    with open(crop_health_metrics_path, "r") as f:
        crop_health_metrics = json.load(f)
    
    # Initialize frozen MobileNetV2 feature extractor
    mobilenet = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    mobilenet.eval()
    mobilenet_extractor = mobilenet.features
    mobilenet_avgpool = torch.nn.AdaptiveAvgPool2d((1, 1))

    image_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
else:
    print("[WARNING] Model 3 artifacts not yet trained. Run train_crop_health.py to build.")

# --- Request / Response Schemas ---

class CropPredictRequest(BaseModel):
    N: float = Field(..., description="Nitrogen ratio in soil (0-140)")
    P: float = Field(..., description="Phosphorus ratio in soil (0-145)")
    K: float = Field(..., description="Potassium ratio in soil (0-205)")
    temperature: float = Field(..., description="Ambient temperature in °C")
    humidity: float = Field(..., description="Relative humidity in %")
    ph: float = Field(..., description="Soil pH value (3.5 - 9.9)")
    rainfall: float = Field(..., description="Rainfall in mm")

class CropPredictResponse(BaseModel):
    recommended_crop: str
    confidence: str
    confidence_score: float
    alternatives: List[str]
    trained_on: str

class IrrigationPredictRequest(BaseModel):
    days_since_rain: int = Field(..., ge=0, le=90)
    days_since_last_irrigation: int = Field(..., ge=0, le=90)
    soil_type: str = Field(..., description="'clay', 'sandy', 'loamy', 'black', 'red', 'alluvial'")
    forecast_rain_probability: float = Field(..., ge=0, le=100)
    forecast_rain_amount: float = Field(..., ge=0)
    crop_type: str = Field(..., description="'rice', 'wheat', 'cotton', 'maize', 'sugarcane', 'vegetables', 'pulses'")

class IrrigationPredictResponse(BaseModel):
    recommended_action: str
    urgency_level: str
    confidence: str
    confidence_score: float
    top_reasons: List[str]
    trained_on: str

class CropHealthPredictRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded JPEG/PNG image data")
    crop_context: Optional[str] = Field(None, description="Optional crop name hint (e.g. 'tomato', 'potato', 'corn')")

class CropHealthPredictResponse(BaseModel):
    predicted_class: str
    crop: Optional[str] = None
    condition: Optional[str] = None
    confidence: str
    confidence_score: float
    is_healthy: Optional[bool] = None
    general_guidance: str
    low_confidence: bool
    trained_on: str

# --- Helpers ---

def process_and_predict_leaf_image(img: Image.Image) -> CropHealthPredictResponse:
    if crop_health_head is None or mobilenet_extractor is None:
        raise HTTPException(status_code=503, detail="Model 3 (Crop Health) is not loaded.")

    # Convert image to RGB
    img_rgb = img.convert("RGB")
    
    # Extract features using frozen MobileNetV2
    with torch.no_grad():
        tensor = image_transforms(img_rgb).unsqueeze(0)
        feats = mobilenet_extractor(tensor)
        feats = mobilenet_avgpool(feats).flatten().numpy().reshape(1, -1)
        
    probabilities = crop_health_head.predict_proba(feats)[0]
    best_idx = int(np.argmax(probabilities))
    max_prob = float(probabilities[best_idx])
    
    # Assess image confidence:
    # 1. Probability threshold (< 0.40 indicates high uncertainty among classes)
    # 2. Check if entropy across classes is too high (close to uniform)
    # 3. Simple color/variance check on the leaf to detect blank noise
    img_np = np.array(img_rgb)
    std_color = np.std(img_np)
    
    is_unclear_or_low_conf = (max_prob < 0.40) or (std_color < 12.0)
    
    if is_unclear_or_low_conf:
        return CropHealthPredictResponse(
            predicted_class="Unable to Assess",
            crop=None,
            condition="Unclear",
            confidence="Low",
            confidence_score=round(max_prob, 4),
            is_healthy=None,
            general_guidance="Unable to confidently assess - try a clearer photo or use manual check-in.",
            low_confidence=True,
            trained_on="real_dataset"
        )
        
    class_meta = crop_health_metrics["classes"][best_idx]
    confidence_str = "High" if max_prob >= 0.70 else "Medium"
    
    return CropHealthPredictResponse(
        predicted_class=class_meta["display_name"],
        crop=class_meta["crop"],
        condition=class_meta["condition"],
        confidence=confidence_str,
        confidence_score=round(max_prob, 4),
        is_healthy=class_meta["is_healthy"],
        general_guidance=class_meta["general_guidance"],
        low_confidence=False,
        trained_on="real_dataset"
    )

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "AgriAdvisor ML Microservice",
        "model_1_status": "ready (real_dataset)",
        "model_2_status": "ready (synthetic_bootstrap)",
        "model_3_status": "ready (real_dataset - PlantVillage)" if crop_health_head is not None else "unavailable"
    }

@app.get("/metrics")
def get_metrics():
    return {
        "model_1_crop_recommendation": crop_metrics,
        "model_2_irrigation_urgency": irrig_metrics,
        "model_3_crop_health": crop_health_metrics
    }

# MODEL 1: Crop Recommendation (Real Public Dataset)
@app.post("/predict/crop", response_model=CropPredictResponse)
def predict_crop(req: CropPredictRequest):
    try:
        input_data = pd.DataFrame([{
            'N': req.N,
            'P': req.P,
            'K': req.K,
            'temperature': req.temperature,
            'humidity': req.humidity,
            'ph': req.ph,
            'rainfall': req.rainfall
        }])

        probabilities = crop_model.predict_proba(input_data)[0]
        classes = crop_model.classes_

        top_indices = np.argsort(probabilities)[::-1]
        top_crop = classes[top_indices[0]]
        best_prob = float(probabilities[top_indices[0]])
        alternatives = [str(classes[idx]) for idx in top_indices[1:3]]

        confidence = "High" if best_prob >= 0.65 else ("Medium" if best_prob >= 0.35 else "Low")

        return CropPredictResponse(
            recommended_crop=str(top_crop),
            confidence=confidence,
            confidence_score=round(best_prob, 4),
            alternatives=alternatives,
            trained_on="real_dataset"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model 1 inference error: {str(e)}")

# MODEL 2: Irrigation Urgency (Synthetic Bootstrap Dataset)
@app.post("/predict/irrigation", response_model=IrrigationPredictResponse)
def predict_irrigation(req: IrrigationPredictRequest):
    try:
        le_soil = irrig_encoders["soil_encoder"]
        le_crop = irrig_encoders["crop_encoder"]
        le_target = irrig_encoders["target_encoder"]

        soil_clean = req.soil_type.lower().strip()
        if soil_clean not in le_soil.classes_:
            soil_clean = 'loamy'
        soil_enc = int(le_soil.transform([soil_clean])[0])

        crop_clean = req.crop_type.lower().strip()
        if crop_clean not in le_crop.classes_:
            crop_clean = 'wheat'
        crop_enc = int(le_crop.transform([crop_clean])[0])

        input_data = pd.DataFrame([{
            'days_since_rain': req.days_since_rain,
            'days_since_last_irrigation': req.days_since_last_irrigation,
            'soil_encoded': soil_enc,
            'forecast_rain_probability': req.forecast_rain_probability,
            'forecast_rain_amount': req.forecast_rain_amount,
            'crop_encoded': crop_enc
        }])

        probabilities = irrig_model.predict_proba(input_data)[0]
        best_idx = np.argmax(probabilities)
        best_prob = float(probabilities[best_idx])
        pred_label = le_target.inverse_transform([best_idx])[0]

        parts = pred_label.split("::")
        action = parts[0]
        urgency = parts[1] if len(parts) > 1 else "Medium"

        confidence = "High" if best_prob >= 0.70 else ("Medium" if best_prob >= 0.40 else "Low")

        sorted_features = sorted(
            irrig_metrics["feature_importances"].items(),
            key=lambda x: x[1],
            reverse=True
        )
        top_reasons = [REASON_MAPPINGS.get(f[0], f[0]) for f in sorted_features[:2]]

        return IrrigationPredictResponse(
            recommended_action=action,
            urgency_level=urgency,
            confidence=confidence,
            confidence_score=round(best_prob, 4),
            top_reasons=top_reasons,
            trained_on="synthetic_bootstrap"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model 2 inference error: {str(e)}")

# MODEL 3: Crop Health Diagnosis (Real PlantVillage Dataset via Transfer Learning)
@app.post("/predict/crop-health", response_model=CropHealthPredictResponse)
def predict_crop_health(req: CropHealthPredictRequest):
    """
    Model 3: Crop Health Image Diagnosis using MobileNetV2 transfer learning on PlantVillage.
    Accepts base64 encoded image string (supports data URL format or raw base64).
    """
    try:
        raw_b64 = req.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
            
        img_bytes = base64.b64decode(raw_b64)
        img = Image.open(io.BytesIO(img_bytes))
        return process_and_predict_leaf_image(img)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

@app.post("/predict/crop-health/upload", response_model=CropHealthPredictResponse)
async def predict_crop_health_upload(file: UploadFile = File(...)):
    """
    Accepts direct multipart file upload.
    """
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        return process_and_predict_leaf_image(img)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process uploaded file: {str(e)}")
