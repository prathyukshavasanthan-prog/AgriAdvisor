import os
import sys
import json
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "plantvillage_subset")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
TEST_SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "test_samples")
NON_LEAF_DIR = os.path.join(TEST_SAMPLES_DIR, "non_leaf")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(TEST_SAMPLES_DIR, exist_ok=True)
os.makedirs(NON_LEAF_DIR, exist_ok=True)

# 20 Diverse PlantVillage Classes
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
        "general_guidance": "Fungal foliar condition (Alternaria solani) with concentric ring lesions. Avoid overhead sprinkler irrigation to keep canopy dry, prune infected lower leaves, and consult your local agriculture extension officer (KVK) for recommended organic or fungal management.",
    },
    "Tomato___Late_blight": {
        "display_name": "Tomato - Late Blight",
        "crop": "Tomato",
        "condition": "Late Blight",
        "is_healthy": False,
        "general_guidance": "Water-soaked dark lesions (Phytophthora infestans) that thrive in cool, moist conditions. Improve row spacing for air circulation, eliminate cull piles, and ask your local agriculture extension officer (KVK) for certified preventative treatments.",
    },
    "Tomato___Bacterial_spot": {
        "display_name": "Tomato - Bacterial Spot",
        "crop": "Tomato",
        "condition": "Bacterial Spot",
        "is_healthy": False,
        "general_guidance": "Small dark angular spots surrounded by yellow halos (Xanthomonas). Avoid handling wet plants, sanitize tools between rows, and consult your local agriculture officer regarding copper-based preventative sprays.",
    },
    "Tomato___Target_Spot": {
        "display_name": "Tomato - Target Spot",
        "crop": "Tomato",
        "condition": "Target Spot",
        "is_healthy": False,
        "general_guidance": "Brown target-like lesions on foliage (Corynespora cassiicola). Remove infected plant debris after harvest, rotate crops away from solanaceous plants, and ask your local extension officer for guidance.",
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
        "general_guidance": "Brown target spots on older foliage. Optimize nitrogen nutrition to reduce plant stress, destroy infected vines before digging, and contact your local agriculture officer for certified cultural practices.",
    },
    "Potato___Late_blight": {
        "display_name": "Potato - Late Blight",
        "crop": "Potato",
        "condition": "Late Blight",
        "is_healthy": False,
        "general_guidance": "Rapidly spreading pale/dark lesions with white fungal sporulation underneath. Hill up tubers deeply to prevent spore wash into soil, and contact your local agriculture extension officer immediately.",
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
        "general_guidance": "Golden-brown powdery pustules (Puccinia sorghi) on upper leaf surfaces. Select rust-resistant hybrid varieties for the next cycle and consult your local agricultural specialist.",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "display_name": "Corn (Maize) - Northern Leaf Blight",
        "crop": "Corn",
        "condition": "Northern Leaf Blight",
        "is_healthy": False,
        "general_guidance": "Long, elliptical cigar-shaped lesions (Exserohilum turcicum). Incorporate crop residue by tillage, practice 1-2 year rotation with non-host crops, and ask your local agriculture extension officer.",
    },
    "Apple___healthy": {
        "display_name": "Apple - Healthy",
        "crop": "Apple",
        "condition": "Healthy",
        "is_healthy": True,
        "general_guidance": "Leaves show balanced green coloration and intact margins. Maintain regular orchard floor sanitation and balanced nutrition.",
    },
    "Apple___Apple_scab": {
        "display_name": "Apple - Apple Scab",
        "crop": "Apple",
        "condition": "Apple Scab",
        "is_healthy": False,
        "general_guidance": "Olive-green to black velvety spots (Venturia inaequalis). Rake and compost fallen autumn leaves to reduce overwintering spores, prune for canopy sunlight, and consult an orchard extension officer.",
    },
    "Apple___Black_rot": {
        "display_name": "Apple - Black Rot",
        "crop": "Apple",
        "condition": "Black Rot",
        "is_healthy": False,
        "general_guidance": "Frog-eye leaf spots and cankers (Botryosphaeria obtusa). Prune out dead wood and mummified fruit, burn infected cuttings, and ask your local horticulture officer.",
    },
    "Apple___Cedar_apple_rust": {
        "display_name": "Apple - Cedar Apple Rust",
        "crop": "Apple",
        "condition": "Cedar Apple Rust",
        "is_healthy": False,
        "general_guidance": "Bright yellow-orange spots on upper leaf surfaces (Gymnosporangium juniperi-virginianae). Remove nearby alternate host juniper/cedar trees where feasible and consult a local horticulture specialist.",
    },
    "Grape___healthy": {
        "display_name": "Grape - Healthy",
        "crop": "Grape",
        "condition": "Healthy",
        "is_healthy": True,
        "general_guidance": "Grape vine leaves demonstrate vigorous lobed structure and rich green color. Continue trellis shoot positioning and balanced drip irrigation.",
    },
    "Grape___Black_rot": {
        "display_name": "Grape - Black Rot",
        "crop": "Grape",
        "condition": "Black Rot",
        "is_healthy": False,
        "general_guidance": "Small circular reddish-brown leaf spots with tiny black fruiting bodies (Guignardia bidwellii). Remove mummified berries from vine and ground, maintain open canopy training, and consult your local extension officer.",
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "display_name": "Grape - Leaf Blight",
        "crop": "Grape",
        "condition": "Leaf Blight",
        "is_healthy": False,
        "general_guidance": "Irregular necrotic brown lesions on leaf margins. Ensure adequate potassium nutrition, avoid sprinkler wetting of foliage, and ask your local viticulture officer for guidance.",
    },
    "Pepper,_bell___healthy": {
        "display_name": "Bell Pepper - Healthy",
        "crop": "Bell Pepper",
        "condition": "Healthy",
        "is_healthy": True,
        "general_guidance": "Foliage exhibits smooth surfaces and deep green tone. Continue scheduled soil fertilization and drip moisture monitoring.",
    },
    "Pepper,_bell___Bacterial_spot": {
        "display_name": "Bell Pepper - Bacterial Spot",
        "crop": "Bell Pepper",
        "condition": "Bacterial Spot",
        "is_healthy": False,
        "general_guidance": "Small water-soaked blister spots that turn brown and necrotic (Xanthomonas). Use certified disease-free seed, rotate away from solanaceous crops for 2 years, and ask your local extension officer.",
    },
}

SAMPLES_PER_CLASS = 45

def download_image(url, save_path):
    if os.path.exists(save_path) and os.path.getsize(save_path) > 1000:
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AgriAdvisor-Trainer/2.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(save_path, "wb") as f:
                f.write(data)
        return True
    except Exception:
        return False

def prepare_dataset():
    print("=" * 80)
    print("PREPARING AUTHENTIC PLANTVILLAGE DATASET (20 BALANCED CLASSES)")
    print("=" * 80)
    
    samples = []
    
    for class_idx, (class_key, meta) in enumerate(CLASSES_MAP.items()):
        class_folder = os.path.join(DATA_DIR, class_key)
        os.makedirs(class_folder, exist_ok=True)
        
        # Check existing images
        existing = [os.path.join(class_folder, f) for f in os.listdir(class_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if len(existing) >= SAMPLES_PER_CLASS:
            print(f"[{meta['display_name']}] Cached: {len(existing)} images")
            for f in existing[:SAMPLES_PER_CLASS]:
                samples.append((f, class_key, class_idx))
            continue
            
        print(f"Fetching images for {class_key} from GitHub PlantVillage repository...")
        api_url = f"https://api.github.com/repos/spMohanty/PlantVillage-Dataset/contents/raw/color/{urllib.parse.quote(class_key)}"
        img_items = []
        try:
            req = urllib.request.Request(api_url, headers={"User-Agent": "AgriAdvisor-Trainer/2.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                items = json.loads(resp.read().decode())
                img_items = [it for it in items if it['name'].lower().endswith(('.jpg', '.jpeg', '.png'))][:SAMPLES_PER_CLASS]
        except Exception as e:
            print(f"Failed to fetch file list for {class_key}: {e}")
            
        if not img_items:
            # Fallback to existing if available
            for f in existing:
                samples.append((f, class_key, class_idx))
            continue
            
        print(f"Downloading {len(img_items)} images for {meta['display_name']}...")
        tasks = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            for it in img_items:
                dest = os.path.join(class_folder, it['name'])
                tasks.append((executor.submit(download_image, it['download_url'], dest), dest))
                
        for fut, dest in tasks:
            if fut.result() and os.path.exists(dest):
                samples.append((dest, class_key, class_idx))

    print(f"\nTotal dataset images prepared: {len(samples)} across {len(CLASSES_MAP)} classes.")
    return samples

def extract_augmented_features(samples):
    print("\n" + "=" * 80)
    print("MOBILENET_V2 FEATURE EXTRACTION WITH AUGMENTATION (ROTATION, BRIGHTNESS, JITTER)")
    print("=" * 80)
    
    mobilenet = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    mobilenet.eval()
    
    feature_extractor = mobilenet.features
    avg_pool = torch.nn.AdaptiveAvgPool2d((1, 1))
    
    # Standard transform
    base_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Augmentation transform for training generalization
    aug_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    X_features = []
    y_labels = []
    
    with torch.no_grad():
        for idx, (path, class_key, class_idx) in enumerate(samples):
            try:
                img = Image.open(path).convert('RGB')
                
                # 1. Base image features
                t_base = base_transform(img).unsqueeze(0)
                feat_base = feature_extractor(t_base)
                feat_base = avg_pool(feat_base).flatten().numpy()
                X_features.append(feat_base)
                y_labels.append(class_idx)
                
                # 2. Augmented image features (for data balance and high accuracy)
                t_aug = aug_transform(img).unsqueeze(0)
                feat_aug = feature_extractor(t_aug)
                feat_aug = avg_pool(feat_aug).flatten().numpy()
                X_features.append(feat_aug)
                y_labels.append(class_idx)
                
            except Exception as e:
                print(f"Error reading {path}: {e}")
                
            if (idx + 1) % 150 == 0:
                print(f"  Processed {idx + 1}/{len(samples)} samples...")
                
    X = np.array(X_features)
    y = np.array(y_labels)
    print(f"\nFinal feature matrix: {X.shape}, Labels: {y.shape}")
    return X, y

def train_and_evaluate(X, y):
    print("\n" + "=" * 80)
    print("TRAINING & EVALUATION ON HELD-OUT TEST SPLIT (TARGET >= 95%)")
    print("=" * 80)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples, Held-out Test set: {len(X_test)} samples")
    
    # Train calibrated classifier head
    clf = LogisticRegression(C=2.5, max_iter=800, random_state=42, solver='lbfgs')
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    class_names = [meta['display_name'] for meta in CLASSES_MAP.values()]
    report = classification_report(y_test, y_pred, target_names=class_names, output_dict=True)
    
    print("\n" + "=" * 80)
    print("  MODEL 3 METRICS: PLANTVILLAGE 20-CLASS CROP HEALTH CLASSIFIER")
    print("=" * 80)
    print(f"Accuracy : {acc * 100:.2f}% (Target >= 95.00%)")
    print(f"Macro F1 : {f1 * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall   : {rec * 100:.2f}%")
    print(f"Total Classes: {len(class_names)}")
    print("-" * 80)
    for name in class_names:
        if name in report:
            p = report[name]['precision'] * 100
            r = report[name]['recall'] * 100
            f = report[name]['f1-score'] * 100
            print(f"  {name:40s} | Prec: {p:5.1f}% | Rec: {r:5.1f}% | F1: {f:5.1f}%")
    print("=" * 80)
    
    # Save model head
    model_path = os.path.join(MODELS_DIR, "crop_health_head.joblib")
    joblib.dump(clf, model_path)
    
    metrics = {
        "model_name": "AI Crop Health Classifier (Model 3)",
        "base_model": "MobileNetV2 (Pretrained ImageNet weights, fine-tuned classification head)",
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
        "macro_f1": float(f1),
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

def generate_non_leaf_test_images():
    print("\n" + "=" * 80)
    print("GENERATING 10 NON-LEAF TEST IMAGES FOR REJECTION THRESHOLD VALIDATION")
    print("=" * 80)
    
    # 1. White noise
    img1 = np.random.randint(0, 255, size=(224, 224, 3), dtype=np.uint8)
    Image.fromarray(img1).save(os.path.join(NON_LEAF_DIR, "non_leaf_1_white_noise.jpg"))
    
    # 2. Gaussian random noise
    img2 = np.clip(np.random.normal(128, 40, (224, 224, 3)), 0, 255).astype(np.uint8)
    Image.fromarray(img2).save(os.path.join(NON_LEAF_DIR, "non_leaf_2_gaussian_noise.jpg"))
    
    # 3. Solid white canvas
    img3 = np.ones((224, 224, 3), dtype=np.uint8) * 255
    Image.fromarray(img3).save(os.path.join(NON_LEAF_DIR, "non_leaf_3_solid_white.jpg"))
    
    # 4. Solid black canvas
    img4 = np.zeros((224, 224, 3), dtype=np.uint8)
    Image.fromarray(img4).save(os.path.join(NON_LEAF_DIR, "non_leaf_4_solid_black.jpg"))
    
    # 5. Grey textured wall
    img5 = np.random.randint(120, 140, size=(224, 224, 3), dtype=np.uint8)
    Image.fromarray(img5).save(os.path.join(NON_LEAF_DIR, "non_leaf_5_grey_wall.jpg"))
    
    # 6. Wood grain brown texture
    img6 = np.zeros((224, 224, 3), dtype=np.uint8)
    img6[:, :, 0] = np.random.randint(110, 140, size=(224, 224))
    img6[:, :, 1] = np.random.randint(70, 90, size=(224, 224))
    img6[:, :, 2] = np.random.randint(30, 50, size=(224, 224))
    Image.fromarray(img6).save(os.path.join(NON_LEAF_DIR, "non_leaf_6_wood_texture.jpg"))
    
    # 7. Rainbow stripes
    img7 = np.zeros((224, 224, 3), dtype=np.uint8)
    for col in range(224):
        img7[:, col, 0] = int(255 * (col / 224))
        img7[:, col, 1] = int(255 * (1 - col / 224))
        img7[:, col, 2] = 128
    Image.fromarray(img7).save(os.path.join(NON_LEAF_DIR, "non_leaf_7_color_stripes.jpg"))
    
    # 8. Blue sky gradient
    img8 = np.zeros((224, 224, 3), dtype=np.uint8)
    for row in range(224):
        img8[row, :, 0] = int(100 + row * 0.4)
        img8[row, :, 1] = int(180 + row * 0.3)
        img8[row, :, 2] = 255
    Image.fromarray(img8).save(os.path.join(NON_LEAF_DIR, "non_leaf_8_blue_sky.jpg"))
    
    # 9. Asphalt dark texture
    img9 = np.random.randint(35, 55, size=(224, 224, 3), dtype=np.uint8)
    Image.fromarray(img9).save(os.path.join(NON_LEAF_DIR, "non_leaf_9_asphalt.jpg"))
    
    # 10. Checkerboard pattern
    img10 = np.zeros((224, 224, 3), dtype=np.uint8)
    sq = 28
    for r in range(0, 224, sq):
        for c in range(0, 224, sq):
            if (r // sq + c // sq) % 2 == 0:
                img10[r:r+sq, c:c+sq] = 240
            else:
                img10[r:r+sq, c:c+sq] = 15
    Image.fromarray(img10).save(os.path.join(NON_LEAF_DIR, "non_leaf_10_checkerboard.jpg"))
    
    print(f"Generated 10 non-leaf test images in: {NON_LEAF_DIR}")

if __name__ == "__main__":
    samples = prepare_dataset()
    if len(samples) < 100:
        print("Error: insufficient samples. Aborting.")
        sys.exit(1)
    X, y = extract_augmented_features(samples)
    train_and_evaluate(X, y)
    generate_non_leaf_test_images()
