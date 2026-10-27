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

class CropRecommendationItem(BaseModel):
    crop: str
    likelihood: str
    probability: float
    reasons: List[str]

class CropPredictRequest(BaseModel):
    N: float = Field(..., description="Nitrogen ratio in soil (0-140)")
    P: float = Field(..., description="Phosphorus ratio in soil (0-145)")
    K: float = Field(..., description="Potassium ratio in soil (0-205)")
    temperature: float = Field(..., description="Ambient temperature in °C")
    humidity: float = Field(..., description="Relative humidity in %")
    ph: float = Field(..., description="Soil pH value (3.5 - 9.9)")
    rainfall: float = Field(..., description="Rainfall in mm")
    land_type: Optional[str] = Field(None, description="Land type and topography")
    water_source: Optional[str] = Field(None, description="Primary water source")
    season: Optional[str] = Field(None, description="Target crop season (kharif, rabi, zaid)")

class CropPredictResponse(BaseModel):
    recommended_crop: str
    confidence: str
    confidence_score: float
    likelihood: str
    reasons: List[str]
    top_3: List[CropRecommendationItem]
    alternatives: List[str]
    trained_on: str
    filtered_for_land: bool = False
    filter_reason: Optional[str] = None
    unsupported_crops: List[str]
    needs_soil_health_card: bool = False

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

CROP_FAO = {
    'rice': {'kc': 1.15, 'zr': 0.6},
    'wheat': {'kc': 1.05, 'zr': 1.0},
    'cotton': {'kc': 1.10, 'zr': 1.2},
    'maize': {'kc': 1.10, 'zr': 1.0},
    'chickpea': {'kc': 0.90, 'zr': 0.8},
    'sugarcane': {'kc': 1.20, 'zr': 1.3},
    'tomato': {'kc': 1.05, 'zr': 0.7},
}

IRRIG_EFF = {
    'drip': 0.90,
    'sprinkler': 0.80,
    'furrow': 0.70,
    'flood': 0.60,
    'none': 1.00,
}

class IrrigationPredictRequest(BaseModel):
    days_since_rain: int = Field(0, ge=0, le=180)
    days_since_last_irrigation: int = Field(0, ge=0, le=180)
    soil_type: str = Field('loamy', description="Soil type name")
    crop_type: str = Field('wheat', description="Crop type name")
    forecast_rain_amount: float = Field(0.0, ge=0, description="Forecasted rainfall next 48h in mm")
    forecast_rain_probability: Optional[float] = Field(None, ge=0, le=100)
    soil_water_depletion_pct: Optional[float] = Field(None, ge=0, le=100, description="Estimated root-zone moisture depletion 0-100%")
    temperature: Optional[float] = Field(None, description="Average temperature in °C")
    et0: Optional[float] = Field(None, description="Reference evapotranspiration ET0 in mm/day")
    irrigation_method: Optional[str] = Field("drip", description="Irrigation method: drip, sprinkler, furrow, flood, none")
    land_type: Optional[str] = Field(None, description="Land type: irrigated, rainfed, lowland_paddy, upland, etc.")
    water_source: Optional[str] = Field(None, description="Water source: borewell, open_well, canal, tank_pond, rain_only")

class IrrigationPredictResponse(BaseModel):
    recommended_action: str
    urgency_level: str
    confidence: str
    confidence_score: float
    soil_water_depletion_pct: float
    top_reasons: List[str]
    is_rainfed_no_water: bool = False
    rain_based_guidance: Optional[str] = None
    trained_on: str = "trained on an agronomic simulation with real historical weather"

class CropHealthPredictRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded JPEG/PNG image data")
    crop_context: Optional[str] = Field(None, description="Optional crop name hint (e.g. 'tomato', 'potato', 'corn')")

class CropHealthItem(BaseModel):
    class_name: str
    crop: str
    condition: str
    condition_key: str
    likelihood: str
    probability: float
    general_guidance: str

class CropHealthPredictResponse(BaseModel):
    predicted_class: str
    crop: Optional[str] = None
    condition: Optional[str] = None
    condition_key: Optional[str] = None
    confidence: str
    confidence_score: float
    likelihood: str
    is_healthy: Optional[bool] = None
    general_guidance: str
    low_confidence: bool
    is_unclear: bool = False
    top_3: List[CropHealthItem] = []
    trained_on: str = "real_dataset"
    model_note: str = "Trained on PlantVillage lab-style photographs; field photos with natural background noise may score lower."

# --- Helpers ---

def process_and_predict_leaf_image(img: Image.Image) -> CropHealthPredictResponse:
    if crop_health_head is None or mobilenet_extractor is None:
        raise HTTPException(status_code=503, detail="Model 3 (Crop Health) is not loaded.")

    # Convert image to RGB
    img_rgb = img.convert("RGB")
    img_np = np.array(img_rgb)
    std_color = float(np.std(img_np))
    
    # Extract features using frozen MobileNetV2
    with torch.no_grad():
        tensor = image_transforms(img_rgb).unsqueeze(0)
        feats = mobilenet_extractor(tensor)
        feats = mobilenet_avgpool(feats).flatten().numpy().reshape(1, -1)
        
    probabilities = crop_health_head.predict_proba(feats)[0]
    best_idx = int(np.argmax(probabilities))
    max_prob = float(probabilities[best_idx])
    
    # Calculate normalized Shannon entropy across the 20 classes
    p_nz = probabilities[probabilities > 1e-12]
    norm_entropy = float(-np.sum(p_nz * np.log(p_nz)) / np.log(20.0))
    
    # Rejection logic:
    # 1. Extremely low probability (max_prob < 0.65)
    # 2. High uncertainty/entropy (norm_entropy > 0.40)
    # 3. Flat/blank frames (std_color < 15.0)
    is_unclear = (max_prob < 0.65) or (norm_entropy > 0.40) or (std_color < 15.0)
    
    if is_unclear:
        return CropHealthPredictResponse(
            predicted_class="unclear",
            crop=None,
            condition="unclear",
            condition_key="unclear",
            confidence="Low",
            confidence_score=round(max_prob, 4),
            likelihood="Unclear",
            is_healthy=None,
            general_guidance="Unable to assess: photo is unclear or not a recognizable leaf. Please upload a clear photo of a single leaf in daylight, or contact your local agriculture extension officer (KVK).",
            low_confidence=True,
            is_unclear=True,
            top_3=[],
            trained_on="real_dataset",
            model_note="Trained on PlantVillage lab-style photographs; field photos with natural background noise may score lower."
        )
        
    # Top 3 results
    sorted_indices = np.argsort(probabilities)[::-1][:3]
    top_3_items = []
    for idx in sorted_indices:
        idx_int = int(idx)
        c_meta = crop_health_metrics["classes"][idx_int]
        p_val = float(probabilities[idx_int])
        l_word = "Very likely" if p_val >= 0.70 else ("Likely" if p_val >= 0.40 else "Possible")
        top_3_items.append(CropHealthItem(
            class_name=c_meta["display_name"],
            crop=c_meta["crop"],
            condition=c_meta["condition"],
            condition_key=c_meta["key"],
            likelihood=l_word,
            probability=round(p_val, 4),
            general_guidance=c_meta["general_guidance"]
        ))
        
    best_meta = crop_health_metrics["classes"][best_idx]
    confidence_str = "High" if max_prob >= 0.70 else ("Medium" if max_prob >= 0.40 else "Low")
    likelihood_str = "Very likely" if max_prob >= 0.70 else ("Likely" if max_prob >= 0.40 else "Possible")
    
    return CropHealthPredictResponse(
        predicted_class=best_meta["display_name"],
        crop=best_meta["crop"],
        condition=best_meta["condition"],
        condition_key=best_meta["key"],
        confidence=confidence_str,
        confidence_score=round(max_prob, 4),
        likelihood=likelihood_str,
        is_healthy=best_meta["is_healthy"],
        general_guidance=best_meta["general_guidance"],
        low_confidence=False,
        is_unclear=False,
        top_3=top_3_items,
        trained_on="real_dataset",
        model_note="Trained on PlantVillage lab-style photographs; field photos with natural background noise may score lower."
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

UNSUPPORTED_CROPS = [
    "wheat", "mustard", "soybean", "sugarcane", "potato",
    "onion", "groundnut", "barley", "bajra", "jowar"
]

def generate_crop_reasons(crop: str, N: float, P: float, K: float, temp: float, hum: float, ph: float, rain: float) -> List[str]:
    reasons = []
    if crop == 'rice':
        reasons.append(f"Substantial seasonal rainfall ({rain:.0f} mm) matches high vegetative water demand")
        reasons.append(f"Warm temperatures ({temp:.1f}°C) and humidity ({hum:.0f}%) support tillering")
    elif crop == 'cotton':
        reasons.append(f"Moderate rainfall ({rain:.0f} mm) with abundant sunshine prevents boll rot")
        reasons.append(f"Available soil potassium ({K:.0f} kg/ha) satisfies heavy fiber synthesis")
    elif crop in ['chickpea', 'lentil']:
        reasons.append(f"Mild seasonal climate ({temp:.1f}°C) and moderate rainfall ({rain:.0f} mm) match legume growth")
        reasons.append(f"Available phosphorus ({P:.0f} kg/ha) promotes strong nodulation and nitrogen fixation")
    elif crop in ['maize', 'pigeonpeas']:
        reasons.append(f"Balanced soil nitrogen ({N:.0f} kg/ha) supports vigorous vegetative stalk development")
        reasons.append(f"Seasonal rainfall ({rain:.0f} mm) aligns with critical tasseling and silking window")
    elif crop in ['watermelon', 'muskmelon']:
        reasons.append(f"Warm seasonal temperatures ({temp:.1f}°C) accelerate fruit maturation and sweetness")
        reasons.append(f"Well-drained soil moisture conditions ({rain:.0f} mm) prevent vine rot")
    elif crop in ['banana', 'papaya']:
        reasons.append(f"High sustained humidity ({hum:.0f}%) and warmth ({temp:.1f}°C) favor rapid vegetative flushing")
        reasons.append(f"Ample soil potassium ({K:.0f} kg/ha) drives bunch formation and fruit filling")
    elif crop == 'coffee':
        reasons.append(f"Moderate highland temperature ({temp:.1f}°C) and shaded humidity ({hum:.0f}%) prevent leaf scorch")
        reasons.append(f"Slightly acidic soil reaction (pH {ph:.1f}) provides ideal nutrient uptake for coffee beans")
    elif crop == 'coconut':
        reasons.append(f"High humidity ({hum:.0f}%) and tropical temperatures ({temp:.1f}°C) support continuous nut setting")
        reasons.append(f"High potassium availability ({K:.0f} kg/ha) sustains crown vigor and copra yield")
    elif crop in ['apple', 'grapes']:
        reasons.append(f"Optimal seasonal temperatures ({temp:.1f}°C) promote cluster development")
        reasons.append(f"Soil pH of {ph:.1f} and phosphorus ({P:.0f} kg/ha) support root health and sugar balance")
    else:
        reasons.append(f"Soil nitrogen ({N:.0f} kg/ha) and phosphorus ({P:.0f} kg/ha) match crop fertility demand")
        reasons.append(f"Historical seasonal rainfall ({rain:.0f} mm) and temperature ({temp:.1f}°C) align with crop phenology")
    return reasons[:2]

def check_crop_suitability(crop: str, land_type: Optional[str], water_source: Optional[str], rain: float, temp: float) -> tuple[bool, Optional[str]]:
    if not land_type:
        return True, None
    lt = land_type.lower()
    ws = (water_source or '').lower()
    
    if crop == 'rice':
        if lt == 'upland' and ws == 'rain_only':
            return False, "Paddy requires continuous soil water ponding; unsuitable for rainfed upland terrain without assured irrigation."
        if ws == 'rain_only' and rain < 600:
            return False, "Paddy requires at least 600-800 mm seasonal rainfall when grown without irrigation."
            
    if crop == 'cotton':
        if lt == 'lowland_paddy':
            return False, "Cotton has deep taproots vulnerable to root asphyxiation in stagnant lowland water."
            
    if crop in ['watermelon', 'muskmelon']:
        if lt == 'lowland_paddy' or rain > 1300:
            return False, "Melons rot in stagnant moisture or waterlogged lowland."
            
    if crop in ['chickpea', 'lentil', 'mothbeans']:
        if lt == 'lowland_paddy' and rain > 800:
            return False, "Pulse crops suffer wilt and root rot in stagnant waterlogged lowland."
            
    if crop == 'apple':
        if temp > 22.0 or lt != 'terraced_hill':
            return False, "Apple requires temperate hillside chilling hours below 20°C."
            
    if crop == 'coffee':
        if lt not in ['orchard_plantation', 'terraced_hill']:
            return False, "Coffee requires shaded plantation or terraced hillside topography."
            
    return True, None

def get_likelihood_word(prob: float) -> str:
    if prob >= 0.80:
        return "Very Likely"
    elif prob >= 0.65:
        return "Likely"
    elif prob >= 0.50:
        return "Possible"
    else:
        return "Uncertain (Add Soil Health Card Values)"

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

        # Sort all classes by probability descending
        sorted_indices = np.argsort(probabilities)[::-1]
        
        # Apply suitability filter
        filtered_for_land = False
        filter_reason = None
        viable_crops = []
        
        for idx in sorted_indices:
            crop_name = str(classes[idx])
            prob = float(probabilities[idx])
            suitable, reason = check_crop_suitability(
                crop_name, req.land_type, req.water_source, req.rainfall, req.temperature
            )
            if suitable:
                viable_crops.append((crop_name, prob))
            else:
                if len(viable_crops) == 0 and not filtered_for_land:
                    filtered_for_land = True
                    filter_reason = reason

        # If all filtered out (edge case), fallback to unfiltered top 3
        if len(viable_crops) < 3:
            viable_crops = [(str(classes[idx]), float(probabilities[idx])) for idx in sorted_indices[:3]]

        top_crop, best_prob = viable_crops[0]
        confidence = "High" if best_prob >= 0.65 else ("Medium" if best_prob >= 0.35 else "Low")
        likelihood_word = get_likelihood_word(best_prob)
        needs_shc = best_prob < 0.50

        # Build top 3 structured list
        top_3_items = []
        for c_name, c_prob in viable_crops[:3]:
            c_reasons = generate_crop_reasons(
                c_name, req.N, req.P, req.K, req.temperature, req.humidity, req.ph, req.rainfall
            )
            top_3_items.append(CropRecommendationItem(
                crop=c_name,
                likelihood=get_likelihood_word(c_prob),
                probability=round(c_prob, 4),
                reasons=c_reasons
            ))

        primary_reasons = top_3_items[0].reasons
        alternatives = [item.crop for item in top_3_items[1:]]

        return CropPredictResponse(
            recommended_crop=str(top_crop),
            confidence=confidence,
            confidence_score=round(best_prob, 4),
            likelihood=likelihood_word,
            reasons=primary_reasons,
            top_3=top_3_items,
            alternatives=alternatives,
            trained_on="real_dataset",
            filtered_for_land=filtered_for_land,
            filter_reason=filter_reason,
            unsupported_crops=UNSUPPORTED_CROPS,
            needs_soil_health_card=needs_shc
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model 1 inference error: {str(e)}")

# MODEL 2: FAO-56 Soil Water Balance Precision Irrigation Advisory
@app.post("/predict/irrigation", response_model=IrrigationPredictResponse)
def predict_irrigation(req: IrrigationPredictRequest):
    try:
        soil_clean = req.soil_type.lower().strip()
        crop_clean = req.crop_type.lower().strip()
        method_clean = (req.irrigation_method or 'drip').lower().strip()
        land_clean = (req.land_type or '').lower().strip()
        water_source_clean = (req.water_source or '').lower().strip()

        # Check rainfed land with no water source
        is_rainfed = (land_clean in ['rainfed', 'dryland']) or \
                     (water_source_clean == 'rain_only') or \
                     (method_clean == 'none')

        # Weather / Forecast parameters
        forecast_rain = req.forecast_rain_amount
        if req.forecast_rain_probability is not None and req.forecast_rain_probability >= 70 and forecast_rain < 5.0:
            forecast_rain = 25.0  # Legacy probability adaptation

        awhc = SOIL_AWHC.get(soil_clean, 160.0)
        crop_info = CROP_FAO.get(crop_clean, {'kc': 1.0, 'zr': 0.8})
        eff = IRRIG_EFF.get(method_clean, 0.90)
        temp = req.temperature if req.temperature is not None else 28.0
        et0 = req.et0 if req.et0 is not None else 4.2

        # Soil water depletion calculation
        TAW = awhc * crop_info['zr']
        if req.soil_water_depletion_pct is not None:
            depletion_pct = float(req.soil_water_depletion_pct)
        else:
            daily_etc = crop_info['kc'] * et0
            effective_dry_days = max(req.days_since_last_irrigation, min(req.days_since_rain, 15))
            Dr = min(TAW, effective_dry_days * daily_etc)
            depletion_pct = (Dr / TAW) * 100.0

        depletion_pct = max(0.0, min(100.0, depletion_pct))

        # 1. Rainfed land with no water source -> Rain-based advice instead of "Irrigate"
        if is_rainfed:
            if forecast_rain >= 12.0:
                return IrrigationPredictResponse(
                    recommended_action="Hold (rain coming)",
                    urgency_level="Low",
                    confidence="High",
                    confidence_score=0.96,
                    soil_water_depletion_pct=round(depletion_pct, 1),
                    top_reasons=[
                        f"Substantial rainfall ({forecast_rain:.1f} mm) forecasted for your rainfed plot within 48h",
                        "Conserve incoming precipitation with contour bunds and farm ponds"
                    ],
                    is_rainfed_no_water=True,
                    rain_based_guidance="Conserve incoming precipitation with field bunds. No irrigation source needed.",
                    trained_on="trained on an agronomic simulation with real historical weather"
                )
            else:
                urgency = "High" if depletion_pct >= 60 else ("Medium" if depletion_pct >= 35 else "Low")
                return IrrigationPredictResponse(
                    recommended_action="Conserve Soil Moisture",
                    urgency_level=urgency,
                    confidence="High",
                    confidence_score=0.93,
                    soil_water_depletion_pct=round(depletion_pct, 1),
                    top_reasons=[
                        "Plot is rainfed with no artificial irrigation source installed",
                        "Apply surface mulching, retain stubble, or use dust-mulch weeding to retain root moisture"
                    ],
                    is_rainfed_no_water=True,
                    rain_based_guidance="Apply organic mulch or dryland conservation tillage to preserve residual moisture. Monitor cloud cover.",
                    trained_on="trained on an agronomic simulation with real historical weather"
                )

        # 2. Standard / Irrigated land -> Random Forest FAO-56 Model
        soil_code = irrig_encoders["soil_encoder"].get(soil_clean, 0)
        crop_code = irrig_encoders["crop_encoder"].get(crop_clean, 0)
        method_code = irrig_encoders["method_encoder"].get(method_clean, 0)

        input_data = pd.DataFrame([{
            'soil_water_depletion_pct': depletion_pct,
            'awhc': awhc,
            'crop_kc': crop_info['kc'],
            'root_depth_m': crop_info['zr'],
            'irrigation_efficiency': eff,
            'days_since_rain': req.days_since_rain,
            'days_since_last_irrigation': req.days_since_last_irrigation,
            'forecast_rain_next_48h': forecast_rain,
            'temp_avg_48h': temp,
            'et0_avg_48h': et0,
            'soil_type_code': soil_code,
            'crop_type_code': crop_code,
            'method_code': method_code
        }])

        probabilities = irrig_model.predict_proba(input_data)[0]
        best_idx = int(np.argmax(probabilities))
        best_prob = float(probabilities[best_idx])
        pred_label = str(irrig_model.classes_[best_idx])

        # Urgency mapping
        if pred_label == "Irrigate now":
            urgency = "High"
        elif pred_label == "Irrigate in 2-3 days":
            urgency = "Medium"
        else:
            urgency = "Low"

        confidence = "High" if best_prob >= 0.70 else ("Medium" if best_prob >= 0.40 else "Low")

        # Dynamic agronomic reasons based on prediction
        reasons = []
        if pred_label == "Hold (rain coming)":
            reasons.append(f"Incoming 48h rainfall ({forecast_rain:.1f} mm) is sufficient to recharge the root zone")
            reasons.append("Holding irrigation prevents standing water, root asphyxiation, and fertilizer leaching")
        elif pred_label == "Irrigate now":
            reasons.append(f"Root-zone soil water depletion reached critical deficit ({depletion_pct:.1f}% TAW)")
            reasons.append(f"{req.days_since_last_irrigation} days without irrigation in dry weather with low 48h rain ({forecast_rain:.1f} mm)")
        elif pred_label == "Irrigate in 2-3 days":
            reasons.append(f"Soil moisture depletion is approaching readily available threshold ({depletion_pct:.1f}% TAW)")
            reasons.append(f"Minimal incoming rainfall ({forecast_rain:.1f} mm) forecasted; plan next watering cycle soon")
        else:  # Not needed
            reasons.append(f"Soil root-zone moisture remains optimal (depletion at only {depletion_pct:.1f}% TAW)")
            reasons.append(f"Current soil water storage adequately supports daily crop transpiration ({crop_info['kc'] * et0:.1f} mm/day)")

        return IrrigationPredictResponse(
            recommended_action=pred_label,
            urgency_level=urgency,
            confidence=confidence,
            confidence_score=round(best_prob, 4),
            soil_water_depletion_pct=round(depletion_pct, 1),
            top_reasons=reasons[:2],
            is_rainfed_no_water=False,
            rain_based_guidance=None,
            trained_on="trained on an agronomic simulation with real historical weather"
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
