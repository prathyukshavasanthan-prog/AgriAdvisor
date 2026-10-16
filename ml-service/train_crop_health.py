import os
import sys
import json
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import numpy as np
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix, classification_report
import joblib

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "plantvillage_subset")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

CLASSES_MAP = {
    "Tomato___healthy": {
        "display_name": "Tomato - Healthy",
        "crop": "Tomato",
        "condition": "Healthy",
        "is_healthy": True,
        "general_guidance": "Foliage exhibits vigorous chlorophyll coloration and healthy leaf morphology. Continue standard balanced irrigation and nutrient management.",
    },
    "Tomato___Early_blight": {
        "display_name": "Tomato - Early Blight",
        "crop": "Tomato",
        "condition": "Early Blight",
        "is_healthy": False,
        "general_guidance": "This appears to be a fungal foliar condition (Alternaria solani). Consider consulting a local agricultural extension officer for suitable fungal management practices and avoid overhead watering.",
    },
    "Potato___healthy": {
        "display_name": "Potato - Healthy",
        "crop": "Potato",
        "condition": "Healthy",
        "is_healthy": True,
        "general_guidance": "Foliage appears normal and vigorous with no visible necrotic lesions. Maintain consistent soil moisture and regular crop scouting.",
    },
    "Potato___Early_blight": {
        "display_name": "Potato - Early Blight",
        "crop": "Potato",
        "condition": "Early Blight",
        "is_healthy": False,
        "general_guidance": "This appears to be a fungal foliar condition. Consider consulting a local agricultural specialist regarding field hygiene, removal of affected foliage, and certified biological or chemical controls.",
    },
    "Corn_(maize)___healthy": {
        "display_name": "Corn (Maize) - Healthy",
        "crop": "Corn",
        "condition": "Healthy",
        "is_healthy": True,
        "general_guidance": "Maize leaf blades demonstrate healthy venation and uniform green tone. Continue scheduled soil fertilization and moisture monitoring.",
    },
    "Corn_(maize)___Common_rust_": {
        "display_name": "Corn (Maize) - Common Rust",
        "crop": "Corn",
        "condition": "Common Rust",
        "is_healthy": False,
        "general_guidance": "This appears to be a fungal rust condition (Puccinia sorghi). Consider consulting a local agricultural officer for certified rust-resistant crop management and field drainage recommendations.",
    },
}

SAMPLES_PER_CLASS = 45

def download_image(url, save_path):
    if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AgriAdvisor-Trainer"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
            with open(save_path, "wb") as f:
                f.write(data)
        return True
    except Exception as e:
        # print(f"Error downloading {url}: {e}")
        return False

def prepare_dataset():
    print("=" * 80)
    print("DOWNLOADING AUTHENTIC PLANTVILLAGE DATASET SUBSET (6 CLASSES, 3 CROPS)")
    print("=" * 80)
    
    total_downloaded = 0
    samples = [] # (file_path, class_key, class_idx)
    
    for class_idx, (class_key, meta) in enumerate(CLASSES_MAP.items()):
        class_folder = os.path.join(DATA_DIR, class_key)
        os.makedirs(class_folder, exist_ok=True)
        
        # Check existing images first
        existing = [os.path.join(class_folder, f) for f in os.listdir(class_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if len(existing) >= SAMPLES_PER_CLASS:
            print(f"[{meta['display_name']}] Already cached: {len(existing)} images")
            for f in existing[:SAMPLES_PER_CLASS]:
                samples.append((f, class_key, class_idx))
            continue
            
        print(f"Fetching file list for {class_key} from GitHub...")
        api_url = f"https://api.github.com/repos/spMohanty/PlantVillage-Dataset/contents/raw/color/{class_key}"
        try:
            req = urllib.request.Request(api_url, headers={"User-Agent": "AgriAdvisor-Trainer"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                items = json.loads(resp.read().decode())
                img_items = [it for it in items if it['name'].lower().endswith(('.jpg', '.jpeg', '.png'))][:SAMPLES_PER_CLASS]
        except Exception as e:
            print(f"Failed to fetch list for {class_key}: {e}")
            continue
            
        print(f"Downloading {len(img_items)} images for {meta['display_name']}...")
        tasks = []
        with ThreadPoolExecutor(max_workers=8) as executor:
            for it in img_items:
                dest = os.path.join(class_folder, it['name'])
                tasks.append((executor.submit(download_image, it['download_url'], dest), dest))
                
        for fut, dest in tasks:
            if fut.result() and os.path.exists(dest):
                samples.append((dest, class_key, class_idx))
                total_downloaded += 1

    print(f"\nTotal dataset images prepared: {len(samples)}")
    return samples

def extract_features(samples):
    print("\n" + "=" * 80)
    print("EXTRACTING FEATURES VIA PRETRAINED MOBILENET_V2 (TRANSFER LEARNING)")
    print("=" * 80)
    
    # Load pretrained MobileNetV2
    mobilenet = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    mobilenet.eval()
    
    # We use features + global average pooling (1280-dim representation)
    feature_extractor = mobilenet.features
    avg_pool = torch.nn.AdaptiveAvgPool2d((1, 1))
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    X_features = []
    y_labels = []
    valid_paths = []
    
    with torch.no_grad():
        for path, class_key, class_idx in samples:
            try:
                img = Image.open(path).convert('RGB')
                tensor = transform(img).unsqueeze(0)
                feat = feature_extractor(tensor)
                feat = avg_pool(feat).flatten().numpy()
                X_features.append(feat)
                y_labels.append(class_idx)
                valid_paths.append(path)
            except Exception as e:
                print(f"Error processing {path}: {e}")
                
    X = np.array(X_features)
    y = np.array(y_labels)
    print(f"Feature matrix shape: {X.shape}, Labels shape: {y.shape}")
    return X, y, valid_paths

def train_and_evaluate(X, y):
    print("\n" + "=" * 80)
    print("TRAINING CLASSIFICATION HEAD & EVALUATING ON HELD-OUT TEST SPLIT")
    print("=" * 80)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"Train split: {len(X_train)} samples, Test split: {len(X_test)} samples")
    
    clf = LogisticRegression(C=1.0, max_iter=500, random_state=42)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    class_names = [meta['display_name'] for meta in CLASSES_MAP.values()]
    report = classification_report(y_test, y_pred, target_names=class_names, output_dict=True)
    
    print("\n--- MODEL 3 METRICS: PLANTVILLAGE CROP HEALTH CLASSIFIER ---")
    print(f"Accuracy : {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall   : {rec * 100:.2f}%")
    print(f"Classes  : {len(class_names)}")
    for name in class_names:
        if name in report:
            print(f"  {name:30s} -> Precision: {report[name]['precision']*100:.1f}%, Recall: {report[name]['recall']*100:.1f}%")
            
    # Save artifacts
    model_path = os.path.join(MODELS_DIR, "crop_health_head.joblib")
    joblib.dump(clf, model_path)
    
    metrics = {
        "model_name": "AI Crop Health Classifier (Model 3)",
        "base_model": "MobileNetV2 (Pretrained ImageNet weights, frozen backbone)",
        "dataset": "PlantVillage Dataset (Authentic Public Leaf Disease Repository)",
        "trained_on": "real_dataset",
        "total_samples": int(len(X)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "classes_count": len(class_names),
        "classes": [
            {
                "index": idx,
                "key": key,
                "display_name": meta["display_name"],
                "crop": meta["crop"],
                "condition": meta["condition"],
                "is_healthy": meta["is_healthy"],
                "general_guidance": meta["general_guidance"]
            }
            for idx, (key, meta) in enumerate(CLASSES_MAP.items())
        ],
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "confusion_matrix": cm,
        "classification_report": report
    }
    
    metrics_path = os.path.join(MODELS_DIR, "crop_health_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"\nSaved model head to: {model_path}")
    print(f"Saved metrics to:    {metrics_path}")
    
    # Save a few sample images for verification tests (healthy, diseased, unclear)
    sample_healthy = os.path.join(DATA_DIR, "Tomato___healthy")
    sample_blight = os.path.join(DATA_DIR, "Tomato___Early_blight")
    
    test_samples_dir = os.path.join(os.path.dirname(__file__), "test_samples")
    os.makedirs(test_samples_dir, exist_ok=True)
    
    if os.path.exists(sample_healthy) and os.listdir(sample_healthy):
        sh_file = os.path.join(sample_healthy, os.listdir(sample_healthy)[0])
        Image.open(sh_file).save(os.path.join(test_samples_dir, "sample_healthy_tomato.jpg"))
        
    if os.path.exists(sample_blight) and os.listdir(sample_blight):
        sb_file = os.path.join(sample_blight, os.listdir(sample_blight)[0])
        Image.open(sb_file).save(os.path.join(test_samples_dir, "sample_diseased_tomato_blight.jpg"))
        
    # Generate an unclear / blurry noise image for testing the low-confidence fallback
    noise_arr = np.random.randint(100, 150, size=(224, 224, 3), dtype=np.uint8)
    Image.fromarray(noise_arr).save(os.path.join(test_samples_dir, "sample_unclear_noise.jpg"))
    print(f"Created verification sample images in {test_samples_dir}")

if __name__ == "__main__":
    samples = prepare_dataset()
    if len(samples) < 30:
        print("Not enough samples downloaded. Aborting.")
        sys.exit(1)
    X, y, paths = extract_features(samples)
    train_and_evaluate(X, y)
