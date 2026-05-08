"""
ISL Sign Language Detection - FastAPI Backend
This is the main API server for sign language detection.
It provides endpoints for:
- Real-time prediction from webcam images
- Model training
- Dataset management

Updated to use MediaPipe Tasks Vision API (compatible with mediapipe 0.10+).
"""

import os
import base64
import io
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
from PIL import Image
import cv2

# MediaPipe Tasks API
import mediapipe as mp

# TensorFlow for model loading
try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("TensorFlow not available. Running in demo mode.")

# Initialize FastAPI app
app = FastAPI(
    title="ISL Sign Language Detection API",
    description="Real-time Indian Sign Language detection using MediaPipe and TensorFlow",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "isl_model.h5")
LABELS_PATH = os.path.join(BASE_DIR, "models", "labels.json")
HAND_LANDMARKER_PATH = os.path.join(BASE_DIR, "data", "hand_landmarker.task")

# Global components
hand_landmarker = None
tf_model = None
labels = None


def create_hand_landmarker():
    """Create MediaPipe HandLandmarker using Tasks API."""
    global hand_landmarker
    
    if not os.path.exists(HAND_LANDMARKER_PATH):
        print(f"⚠ Hand landmarker model not found at {HAND_LANDMARKER_PATH}")
        print("  Download with: curl -o data/hand_landmarker.task https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task")
        return
    
    try:
        BaseOptions = mp.tasks.BaseOptions
        HandLandmarker = mp.tasks.vision.HandLandmarker
        HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
        VisionRunningMode = mp.tasks.vision.RunningMode
        
        options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=HAND_LANDMARKER_PATH),
            running_mode=VisionRunningMode.IMAGE,
            num_hands=2,  # Detect both hands for two-handed ISL signs
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        hand_landmarker = HandLandmarker.create_from_options(options)
        print("✓ Hand landmarker initialized")
    except Exception as e:
        print(f"✗ Error initializing hand landmarker: {e}")
        hand_landmarker = None


def load_model():
    """Load the trained TensorFlow model and labels."""
    global tf_model, labels
    
    # Load TF model
    if TF_AVAILABLE and os.path.exists(MODEL_PATH):
        try:
            tf_model = keras.models.load_model(MODEL_PATH)
            print(f"✓ Model loaded from {MODEL_PATH}")
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            tf_model = None
    else:
        if not os.path.exists(MODEL_PATH):
            print(f"⚠ No model found at {MODEL_PATH}, using demo mode")
        tf_model = None
    
    # Load labels
    if os.path.exists(LABELS_PATH):
        try:
            with open(LABELS_PATH, 'r') as f:
                labels = json.load(f)
            print(f"✓ Loaded {len(labels)} labels: {labels}")
        except Exception as e:
            print(f"✗ Error loading labels: {e}")
            labels = [chr(i) for i in range(65, 91)]
    else:
        labels = [chr(i) for i in range(65, 91)]  # Default A-Z
        print("⚠ Using default labels (A-Z)")


def extract_features_from_landmarks(hand_landmarks):
    """
    Extract 63 features from hand landmarks (same as training).
    21 landmarks × 3 coords (x, y, z), normalized relative to wrist.
    """
    wrist = hand_landmarks[0]
    
    features = []
    for landmark in hand_landmarks:
        features.extend([
            landmark.x - wrist.x,
            landmark.y - wrist.y,
            landmark.z - wrist.z
        ])
    
    features = np.array(features, dtype=np.float32)
    max_val = np.max(np.abs(features))
    if max_val > 0:
        features = features / max_val
    
    return features


def detect_and_predict(image_bgr):
    """
    Detect hand in image and predict sign letter.
    
    Returns:
        (predicted_letter, confidence, all_probs, source, landmarks) or None if no hand detected
        landmarks is a list of {x, y, z} dicts for the 21 hand points
    """
    if hand_landmarker is None:
        return None
    
    # Convert BGR to RGB
    rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    # Create MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    
    # Detect hand landmarks
    result = hand_landmarker.detect(mp_image)
    
    if not result.hand_landmarks or len(result.hand_landmarks) == 0:
        return None
    
    # Extract features from first hand (for prediction)
    hand_landmarks = result.hand_landmarks[0]
    features = extract_features_from_landmarks(hand_landmarks)
    
    # Convert ALL detected hands' landmarks to serializable format for frontend visualization
    all_hands_landmarks = [
        [{"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)} for lm in hand]
        for hand in result.hand_landmarks
    ]
    
    # Make prediction (using first/primary hand)
    if tf_model is not None:
        features_batch = features.reshape(1, -1)
        prediction = tf_model.predict(features_batch, verbose=0)
        predicted_idx = np.argmax(prediction[0])
        confidence = float(prediction[0][predicted_idx])
        
        # Get top 2 predictions to check if model is "confused"
        top_2_indices = np.argsort(prediction[0])[-2:][::-1]
        top_1_prob = float(prediction[0][top_2_indices[0]])
        top_2_prob = float(prediction[0][top_2_indices[1]])
        margin = top_1_prob - top_2_prob
        
        # Dual validation:
        # 1. Confidence must be above 60% (more lenient)
        # 2. Top prediction must be at least 10% higher than 2nd
        CONFIDENCE_THRESHOLD = 0.60
        MARGIN_THRESHOLD = 0.10
        
        if confidence < CONFIDENCE_THRESHOLD or margin < MARGIN_THRESHOLD:
            predicted_letter = "?"
            confidence = 0.0  # Set to 0 to indicate uncertain
        else:
            predicted_letter = labels[predicted_idx] if predicted_idx < len(labels) else "?"
        
        all_probs = {labels[i]: float(prediction[0][i]) for i in range(min(len(labels), len(prediction[0])))}
        return predicted_letter, confidence, all_probs, "model", all_hands_landmarks
    else:
        # Demo mode
        import random
        predicted_letter = random.choice(labels)
        confidence = random.uniform(0.75, 0.95)
        all_probs = {l: random.uniform(0, 0.1) for l in labels}
        all_probs[predicted_letter] = confidence
        return predicted_letter, confidence, all_probs, "demo", all_hands_landmarks


# Load model and hand detector on startup
@app.on_event("startup")
async def startup_event():
    create_hand_landmarker()
    load_model()


# Request/Response Models
class PredictRequest(BaseModel):
    image: str  # Base64 encoded image
    return_probabilities: bool = False


class PredictResponse(BaseModel):
    success: bool
    predicted_letter: str
    confidence: float
    description: Optional[str] = None
    tips: Optional[str] = None
    all_probabilities: Optional[Dict[str, float]] = None
    landmarks: Optional[List[List[Dict[str, float]]]] = None  # Multiple hands, each with 21 landmarks (x, y, z)
    processing_time_ms: float
    source: str


class TrainingRequest(BaseModel):
    data_path: str
    epochs: int = 50
    batch_size: int = 32
    learning_rate: float = 0.001
    validation_split: float = 0.2


class TrainingResponse(BaseModel):
    success: bool
    message: str
    training_id: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    hand_detector_loaded: bool
    labels_count: int
    version: str


# API Endpoints
@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "ISL Sign Language Detection API",
        "version": "1.0.0",
        "endpoints": {
            "/predict": "POST - Predict sign from image",
            "/train": "POST - Train new model",
            "/health": "GET - Check API health"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health status"""
    return HealthResponse(
        status="healthy",
        model_loaded=tf_model is not None,
        hand_detector_loaded=hand_landmarker is not None,
        labels_count=len(labels) if labels else 0,
        version="1.0.0"
    )


@app.post("/predict", response_model=PredictResponse)
async def predict_sign(request: PredictRequest):
    """
    Predict ISL sign from base64 encoded image
    """
    start_time = datetime.now()
    
    try:
        # Decode base64 image
        if ',' in request.image:
            image_data = request.image.split(',')[1]
        else:
            image_data = request.image
            
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Detect and predict
        result = detect_and_predict(image_np)
        
        if result is None:
            return PredictResponse(
                success=True,
                predicted_letter="?",
                confidence=0.0,
                description="No hand detected in image",
                tips="Please show your hand clearly to the camera",
                processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000,
                source="no-hand"
            )
        
        predicted_letter, confidence, all_probs, source, landmarks = result
        description, tips = get_sign_info(predicted_letter)
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Debug logging
        print(f"DEBUG: Returning landmarks: {landmarks is not None}, type: {type(landmarks)}")
        if landmarks:
            print(f"DEBUG: Number of hands: {len(landmarks)}")
            if len(landmarks) > 0:
                print(f"DEBUG: First hand has {len(landmarks[0])} points")
        
        return {
            "success": True,
            "predicted_letter": predicted_letter,
            "confidence": round(confidence, 4),
            "description": description,
            "tips": tips,
            "all_probabilities": all_probs if request.return_probabilities else None,
            "landmarks": landmarks,
            "processing_time_ms": round(processing_time, 2),
            "source": source
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-file")
async def predict_from_file(file: UploadFile = File(...)):
    """
    Predict ISL sign from uploaded image file
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image_np = np.array(image)
        
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        result = detect_and_predict(image_np)
        
        if result is None:
            return {"success": True, "predicted_letter": "?", "confidence": 0.0}
        
        predicted_letter, confidence, _, source, _ = result
        
        return {
            "success": True,
            "predicted_letter": predicted_letter,
            "confidence": round(confidence, 4),
            "source": source
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Start model training in background"""
    import uuid
    training_id = str(uuid.uuid4())
    
    # Note: the trainer would also need to be updated for new MediaPipe API
    # For now, use the standalone train.py script instead
    return TrainingResponse(
        success=True,
        message="Use 'python train.py --data data/data' for training. Background training not available with new MediaPipe API.",
        training_id=training_id
    )


@app.get("/labels")
async def get_labels():
    """Get all supported sign labels"""
    return {
        "success": True,
        "labels": labels,
        "count": len(labels)
    }


from fastapi.responses import FileResponse
import glob

@app.get("/dataset-image/{letter}")
async def get_dataset_image(letter: str):
    """
    Returns a sample dataset image for a given letter (A-Z, or numbers) 
    from the data/data/{letter} directory.
    """
    letter = letter.upper()
    dir_path = os.path.join(BASE_DIR, "data", "data", letter)
    
    if not os.path.exists(dir_path):
        raise HTTPException(status_code=404, detail=f"No dataset folder found for '{letter}'")
        
    # Find any JPG in that folder
    images = glob.glob(os.path.join(dir_path, "*.jpg"))
    if not images:
        raise HTTPException(status_code=404, detail=f"No images found for '{letter}'")
        
    # Return the first image as a file response
    return FileResponse(images[0])


# Helper functions

def get_sign_info(letter: str) -> tuple:
    """Get description and tips for a sign letter"""
    sign_info = {
        'A': ('Make a fist with thumb on the side', 'Keep fingers tight together'),
        'B': ('Flat hand with thumb tucked in', 'Fingers point up, palm faces forward'),
        'C': ('Curve hand like holding a ball', 'Shape your hand like letter C'),
        'D': ('Point up with index, other fingers make circle', 'Index finger points up'),
        'E': ('Bend fingers down with thumb tucked', 'Like you are holding something small'),
        'F': ('Touch index and thumb, other fingers up', 'Make a circle with index and thumb'),
        'G': ('Point index finger sideways', 'Index finger points to the side'),
        'H': ('Two fingers point sideways', 'Index and middle finger together, pointing right'),
        'I': ('Pinky finger up, others in fist', 'Only pinky points up'),
        'J': ('Pinky up, draw J shape', 'Move pinky in J shape in the air'),
        'K': ('Index and middle finger up in V, thumb between', 'Like peace sign with thumb between fingers'),
        'L': ('L shape with thumb and index', 'Make an L shape with thumb and index finger'),
        'M': ('Three fingers over thumb', 'Thumb under index, middle, and ring fingers'),
        'N': ('Two fingers over thumb', 'Thumb under index and middle fingers'),
        'O': ('Touch all fingertips together', 'Make an O shape with fingers'),
        'P': ('K shape pointing down', 'Like K but fingers point down'),
        'Q': ('G shape pointing down', 'Like G but finger points down'),
        'R': ('Cross index over middle finger', 'Index and middle crossed'),
        'S': ('Fist with thumb over fingers', 'Thumb wraps around fingers'),
        'T': ('Thumb between index and middle', 'Thumb pokes out between fingers'),
        'U': ('Two fingers up together', 'Index and middle together pointing up'),
        'V': ('Peace sign - two fingers spread', 'Index and middle in V shape'),
        'W': ('Three fingers up spread apart', 'Index, middle, and ring in W shape'),
        'X': ('Index finger bent like hook', 'Index finger curves like a hook'),
        'Y': ('Thumb and pinky out, others in', 'Like hanging loose sign'),
        'Z': ('Index finger draws Z in air', 'Move index in Z pattern')
    }
    
    info = sign_info.get(letter, ('', ''))
    return info[0], info[1]


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
