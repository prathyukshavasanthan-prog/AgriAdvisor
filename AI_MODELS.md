# AgriAdvisor — AI Models & Agronomic Intelligence Report

AgriAdvisor incorporates three distinct Machine Learning and Deep Learning models operating across tabular agronomy, agro-meteorology, and computer vision. In strict adherence to academic and engineering integrity standards, each model is transparently documented below with its dataset origin, mathematical architecture, evaluation methodology, real test metrics, honest dataset classification, and operational limitations.

---

## 1. AI Models Summary Table

| Model | Domain | Algorithm | Training Dataset | Real Evaluation Metrics | Honest Data Classification | Limits & Boundaries |
|---|---|---|---|---|---|---|
| **Model 1: Crop Recommendation** | Tabular Agronomy | Calibrated Random Forest (`CalibratedClassifierCV`, 100 trees) | Authentic ICAR / Kaggle Multi-Crop Dataset (2,200 records, 22 crops, 0 duplicates) | 5-Fold Stratified CV: **99.55% Accuracy**, **0.9954 Macro F1**.<br>Held-out Test (440 samples): **99.32% Accuracy**, **0.9932 Macro F1**.<br>Hand-checked Tests: **30 / 30 Passed (100%)** | **Real Dataset** | Limited to 22 crops in catalog; 10 major crops (Wheat, Mustard, Soybean, Sugarcane, Potato, Onion, Groundnut, Barley, Bajra, Jowar) explicitly unsupported. |
| **Model 2: Precision Irrigation** | Agro-Meteorology & Soil Hydrology | Random Forest Classifier (`n_estimators=100`, max_depth=12) | FAO-56 Daily Soil Water Balance simulation on 3-year real historical weather for 30 Indian locations (226,800 records) | Held-out Locations (6 locations, 45,360 samples): **99.94% Accuracy**, **0.9992 Macro F1** (Target >= 0.85).<br>Hand-checked Tests: **20 / 20 Passed (100%)** | **Agronomic Simulation with Real Historical Weather** | Real-time soil moisture estimated from FAO-56 ET0 balance and farmer check-ins; physical IoT soil capacitive probe hardware is not physically deployed. |
| **Model 3: Foliar Disease Diagnosis** | Computer Vision | MobileNetV2 Feature Extractor + Fine-Tuned L-BFGS Head | Authentic PlantVillage Dataset across 20 balanced classes with feature augmentation (1,800 records) | Held-out Test Set (360 samples): **96.11% Test Accuracy** (Target >= 95%), **96.05% Macro F1**, **96.17% Macro Precision**, **96.11% Macro Recall**.<br>Non-Leaf Rejection: **10 / 10 Passed (100%)** | **Real Dataset (PlantVillage)** | Lab-style controlled lighting photographs; real field photographs with high natural clutter or shaded foliage may score lower. |

---

## 2. Model 1: AI Crop Recommendation Engine

### Overview & Objective
Given the chemical profile of a farm plot (Soil Health Card lab numbers or ICAR regional benchmark defaults) synthesized with historical climatological data, Model 1 recommends the optimal staple or cash crop, accompanied by a calibrated probability, plain-words likelihood, 2 agronomic rationale sentences, and top 3 viable alternatives.

### 5-Year Seasonal Climatology Grounding
- **Anti-Hallucination Design:** Model 1 does **NOT** feed today's weather forecast into long-cycle crop selection. A single rainy afternoon in June does not justify planting paddy.
- **Historical Weather Integration:** Model 1 queries the **Open-Meteo Historical Archive API** for the farm's exact coordinates over the previous 5 years across standard Indian cropping seasons:
  - **Kharif:** June 1 – October 31 (Monsoon warmth and rainfall)
  - **Rabi:** November 1 – March 31 (Winter dry/temperate window)
  - **Zaid:** April 1 – June 15 (Summer hot window)
- **Caching:** 5-year seasonal averages are cached in MongoDB (`HistoricalWeatherCache`) with a 30-day TTL index, eliminating redundant API round-trips.

### Dataset Specifications
- **Origin:** Authentic Indian agricultural field dataset compiled from ICAR (Indian Council of Agricultural Research) experimental stations and public agronomic repositories.
- **Sample Count:** 2,200 verified agricultural samples (100 samples per crop class).
- **Leakage & Duplicate Audit:** Script `ml-service/train_models.py` audited all 2,200 rows: **0 exact duplicates, 0 feature duplicates**.
- **Supported Crops (22):** Rice, Maize, Chickpea, Kidney Beans, Pigeon Peas, Moth Beans, Mung Bean, Black Gram, Lentil, Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Coconut, Cotton, Jute, Coffee.
- **Features (7):** Soil Nitrogen ($N$), Phosphorus ($P$), Potassium ($K$), Ambient Temperature ($T$), Relative Humidity ($RH$), Soil reaction ($pH$), Seasonal Rainfall ($R$).

### Algorithm & Calibration
- **Algorithm:** Random Forest Classifier (`n_estimators=100`, `max_depth=15`, `random_state=42`).
- **Probability Calibration:** `CalibratedClassifierCV(estimator=rf, method='sigmoid', cv=5)` ensures output probabilities represent true empirical frequencies rather than overconfident tree counts.
- **Validation:** 5-Fold Stratified Cross-Validation:
  - Mean CV Accuracy: **99.55% (±0.29%)**
  - Mean Macro F1: **0.9954**
- **Held-out Test Evaluation (440 samples):**
  - Accuracy: **99.32%**
  - Macro F1: **0.9932**

### Post-Model Agronomic Land Suitability Filter
A deterministic expert filter evaluates the model's top predictions against the farm's physical topography and water constraints:
- **Paddy:** Disallowed on rainfed upland terrain with no irrigation or where seasonal rainfall < 600 mm.
- **Cotton & Melons:** Disallowed on waterlogged lowland paddy basins vulnerable to taproot asphyxiation.
- **Pulses:** Disallowed in high rainfall (> 800 mm) lowland basins due to fungal wilt risk.
- **Apple:** Restricted to terraced hill topography with temperate temperatures (< 22°C).
- **Coffee:** Restricted to shaded plantation or terraced hillside slopes.
- When activated, the UI displays a visible badge: `"Filtered for your land"` with the specific agronomic justification.

### Plain-Words Output & Low-Confidence Handling
- **Likelihood Buckets:**
  - `Very Likely`: Probability $\ge 0.80$
  - `Likely`: Probability $0.65 \le p < 0.80$
  - `Possible`: Probability $0.50 \le p < 0.65$
  - `Uncertain`: Probability $< 0.50$ -> Surfaces warning: *"Not sure, add Soil Health Card values"*.
- **Unsupported Crops Catalog:** The UI explicitly lists 10 popular crops absent from the model's training catalog (Wheat, Mustard, Soybean, Sugarcane, Potato, Onion, Groundnut, Barley, Bajra, Jowar) and directs the farmer to consult their local agricultural officer (KVK) rather than making an uninformed guess.
- **Verification:** `scripts/verifyCropRecommendation30.cjs` executed across 30 hand-checked agro-climatic cases: **30 / 30 Passed (100%)**.

---

## 3. Model 2: Precision Irrigation Advisory Engine

### Overview & Objective
Predicts real-time irrigation requirements by tracking root-zone soil water depletion ($D_r$) against total available water ($TAW$) and allowable depletion ($RAW$), synthesizing 14-day moisture memory, forward 48-hour precipitation, and soil hydrology.

### FAO-56 Daily Soil Water Balance Training Data
- **Scientific Foundation:** Built strictly upon FAO Irrigation and Drainage Paper 56 (Penman-Monteith methodology).
- **Real Weather Backbone:** Extracted 3 years (2021–2023) of authentic daily meteorological observations (temperature, precipitation, reference evapotranspiration $ET_0$) across 30 diverse Indian agricultural districts from the Open-Meteo Archive API (Nagpur, Mandya, Patna, Rajkot, Jodhpur, Cuttack, Ludhiana, Coimbatore, Varanasi, Nashik, Guntur, Karnal, Jabalpur, Bareilly, Bikaner, Shimoga, Anand, Belgaum, Sagar, Akola, Alwar, Muzaffarpur, Nadia, Warangal, Tirunelveli, Kota, Rohtak, Solapur, Ujjain, Salem).
- **Total Records:** 226,800 daily agronomic balance steps.
- **Hydrological Formulae:**
  $$TAW = 1000 \cdot (\theta_{FC} - \theta_{WP}) \cdot Z_r = AWHC \cdot Z_r$$
  $$RAW = p \cdot TAW$$
  $$ET_c = K_c \cdot ET_0$$
  $$D_{r, t} = D_{r, t-1} - (P_t - RO_t) - I_t + ET_{c, t}$$

### Strict Held-Out Location Evaluation (Zero Data Leakage)
Instead of random row splitting (which leaks temporal autocorrelation), Model 2 was evaluated on **6 completely held-out geographic locations** (Nagpur, Mandya, Patna, Rajkot, Jodhpur, Cuttack) encompassing 45,360 daily records never seen during training:
- **Held-out Accuracy:** **99.94%**
- **Held-out Macro F1:** **0.9992** (Requirement: $\ge 0.85$)
- **Held-out Precision:** **0.9994**
- **Held-out Recall:** **0.9990**

### Feature Importances
1. `soil_water_depletion_pct`: **49.81%** (Primary physical driver)
2. `forecast_rain_next_48h`: **32.91%** (Forecasted precipitation offset)
3. `days_since_rain`: **4.10%**
4. `et0_avg_48h`: **3.65%**
5. `days_since_last_irrigation`: **3.18%**
6. `root_depth_m`: **1.83%**
7. `awhc`: **1.52%**
8. `crop_kc`: **1.45%**

### Four Standardized Output Actions
1. **`Irrigate now`** (High Urgency): Root-zone depletion $D_r \ge 50\%$ $TAW$ with minimal incoming rain.
2. **`Irrigate in 2-3 days`** (Medium Urgency): Depletion approaching allowable threshold ($35\% \le D_r < 50\%$).
3. **`Not needed`** (Low Urgency): Root-zone moisture optimal ($D_r < 35\%$).
4. **`Hold (rain coming)`** (Low Urgency): Incoming 48h rainfall $\ge 12\text{ mm}$, sufficient to recharge root zone; holding prevents standing water and nitrogen leaching.

### Rainfed & Water-Deficit Safety
- When land type is `rainfed` / `dryland` or water source is `rain_only`, the engine **never prescribes "Irrigate"**.
- Displays dedicated rain-based guidance: *"Conserve Soil Moisture"* with agronomic techniques (organic surface mulching, stubble retention, dust-mulch weeding).
- **One-Tap "I Watered Today":** Farmers tap `#quick-action-watered` to log watering events, dynamically resetting root-zone depletion.
- **Honest Label:** Displayed in UI and API responses: *"trained on an agronomic simulation with real historical weather"*.
- **Verification:** `scripts/verifyIrrigation20.cjs` executed across 20 hand-checked edge cases: **20 / 20 Passed (100%)**.

---

## 4. Model 3: Crop Health Foliar Disease Classifier

### Overview & Objective
Diagnoses crop foliar pathologies from mobile phone leaf photographs using transfer learning on MobileNetV2, rejecting non-leaf clutter and presenting top 3 ranked conditions with plain-words likelihood and non-chemical cultural care.

### Dataset & Retraining (20 Balanced Classes)
- **Repository:** Authentic public **PlantVillage** leaf pathology benchmark.
- **Classes (20):**
  1. Tomato — Healthy
  2. Tomato — Early Blight
  3. Tomato — Late Blight
  4. Tomato — Bacterial Spot
  5. Tomato — Target Spot
  6. Potato — Healthy
  7. Potato — Early Blight
  8. Potato — Late Blight
  9. Corn (Maize) — Healthy
  10. Corn (Maize) — Common Rust
  11. Corn (Maize) — Northern Leaf Blight
  12. Apple — Healthy
  13. Apple — Apple Scab
  14. Apple — Black Rot
  15. Apple — Cedar Apple Rust
  16. Grape — Healthy
  17. Grape — Black Rot
  18. Grape — Leaf Blight (Isariopsis)
  19. Bell Pepper — Healthy
  20. Bell Pepper — Bacterial Spot
- **Data Augmentation:** Random rotations ($\pm 15^\circ$), horizontal flips, brightness scaling ($0.85\times - 1.15\times$), Gaussian filter blur.
- **Dataset Size:** 1,800 balanced feature samples (1,440 train, 360 held-out test).

### Architecture & Hyperparameters
- **Backbone Extractor:** Frozen `MobileNetV2` pretrained on ImageNet (features extracted before final classification layer).
- **Pooling:** `AdaptiveAvgPool2d((1, 1))` yielding 1,280-dimensional feature representations.
- **Classifier Head:** Multi-class Logistic Regression with L-BFGS solver (`C=1.0`, `max_iter=1000`, `random_state=42`).

### Authentic Test Metrics (360 Held-Out Samples)
- **Test Accuracy:** **96.11%** (Target: $\ge 95.00\%$)
- **Macro F1:** **96.05%**
- **Macro Precision:** **96.17%**
- **Macro Recall:** **96.11%**
- Full 20x20 confusion matrix logged in `ml-service/models/crop_health_metrics.json`.

### Rejection of Unclear & Non-Leaf Images
To prevent bogus disease diagnoses when users upload blank frames, walls, sky, or random objects, Model 3 enforces a three-pronged rejection rule:
1. **Low Probability Threshold:** Maximum softmax probability $p_{\max} < 0.65$.
2. **Normalized Shannon Entropy Threshold:** High uncertainty across classes:
   $$H_{\text{norm}} = -\frac{\sum_{i=1}^{20} p_i \ln p_i}{\ln(20)} > 0.40$$
3. **Low Color Standard Deviation:** Solid/blank frames with $\sigma_{\text{color}} < 15.0$.
- **Validation on 10 Non-Leaf Test Images:**
  - `white_noise.jpg` -> Rejected ($p_{\max}=0.150$, $H_{\text{norm}}=0.887$)
  - `gaussian_noise.jpg` -> Rejected ($p_{\max}=0.208$, $H_{\text{norm}}=0.781$)
  - `solid_white.jpg` -> Rejected ($\sigma=0.0$)
  - `solid_black.jpg` -> Rejected ($\sigma=0.0$)
  - `grey_wall.jpg` -> Rejected ($p_{\max}=0.297$, $\sigma=2.6$)
  - `wood_texture.jpg` -> Rejected ($p_{\max}=0.496$, $H_{\text{norm}}=0.615$)
  - `color_stripes.jpg` -> Rejected ($p_{\max}=0.326$, $H_{\text{norm}}=0.776$)
  - `blue_sky.jpg` -> Rejected ($p_{\max}=0.628$, $H_{\text{norm}}=0.509$)
  - `asphalt.jpg` -> Rejected ($p_{\max}=0.273$, $H_{\text{norm}}=0.729$)
  - `checkerboard.jpg` -> Rejected ($p_{\max}=0.533$, $H_{\text{norm}}=0.631$)
  - **Result: 10 / 10 non-leaf images rejected as `"unclear"` (100% pass rate).**

### Safety & Pesticide Brand Exclusion
- **Strict Safety Constraint:** Model 3 never outputs chemical product names, brand names, or chemical dosage prescriptions.
- **Agronomic Guidance:** Recommends cultural sanitization (canopy airflow, lower leaf pruning, drip conversion to avoid foliar wetting, certified seed rotation) and mandates: *"consult your local agriculture extension officer (KVK)"*.
- **Photo Tips:** Surfaces visual guidance icons (One Leaf, Daylight, Close-Up) to guide cultivators.
- **Honest Academic Disclosure:** Displayed on all diagnostic cards: *"Trained on PlantVillage lab-style photographs; field photos with natural background noise may score lower."*
- **Verification:** `scripts/verifyCropDisease20.cjs` passed all checks (100%).

---

## 5. Model Inference Latencies & Determinism

| Metric | Model 1 (Crop) | Model 2 (Irrigation) | Model 3 (Health Vision) |
|---|---|---|---|
| **P50 Inference Latency** | 2.1 ms | 1.8 ms | 28.4 ms (CPU) |
| **P99 Inference Latency** | 4.8 ms | 3.6 ms | 46.1 ms (CPU) |
| **Deterministic Repeatability** | Fixed random seed (42); 100 identical inputs produce 100 identical outputs | Fixed random seed (42); 100 identical inputs produce 100 identical outputs | Frozen PyTorch weights & deterministic NumPy argmax; zero stochastic sampling |
