"""
ISL Model Training Script
Trains a neural network for Indian Sign Language (ISL) alphabet + number classification.

Uses the NEW MediaPipe Tasks Vision API (compatible with mediapipe 0.10+).

Usage:
    python train.py --data data/data --epochs 150 --batch-size 32 --limit 200

The --limit flag controls how many images per class to process (useful for faster training).
Set --limit 0 to use ALL images (takes much longer).
"""

import os
import sys
import json
import glob
import time
import argparse
import numpy as np

# Suppress TensorFlow warnings for cleaner output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'


def check_dependencies():
    """Check and report which dependencies are available."""
    missing = []
    
    try:
        import cv2
        print(f"  [OK] OpenCV {cv2.__version__}")
    except ImportError:
        missing.append('opencv-python')
    
    try:
        import mediapipe as mp
        print(f"  [OK] MediaPipe {mp.__version__}")
    except ImportError:
        missing.append('mediapipe')
    
    try:
        import tensorflow as tf
        print(f"  [OK] TensorFlow {tf.__version__}")
    except ImportError:
        missing.append('tensorflow')
    
    try:
        import sklearn
        print(f"  [OK] scikit-learn {sklearn.__version__}")
    except ImportError:
        missing.append('scikit-learn')
    
    if missing:
        print(f"\n[ERROR] Missing packages: {', '.join(missing)}")
        print(f"   Install with: pip install {' '.join(missing)}")
        sys.exit(1)
    
    print()


def create_hand_landmarker(model_path):
    """
    Create a MediaPipe HandLandmarker using the new Tasks API.
    
    Args:
        model_path: Path to the hand_landmarker.task model file
    """
    import mediapipe as mp
    
    BaseOptions = mp.tasks.BaseOptions
    HandLandmarker = mp.tasks.vision.HandLandmarker
    HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
    VisionRunningMode = mp.tasks.vision.RunningMode
    
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=VisionRunningMode.IMAGE,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    return HandLandmarker.create_from_options(options)


def extract_hand_features(image_bgr, landmarker):
    """
    Extract 63 hand landmark features from an image using MediaPipe Tasks API.
    
    Returns:
        numpy array of 63 features (21 landmarks × 3 coords), or None if no hand detected.
    """
    import mediapipe as mp
    import cv2
    
    # Convert BGR to RGB
    rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    # Create MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    
    # Detect hand landmarks
    result = landmarker.detect(mp_image)
    
    if not result.hand_landmarks or len(result.hand_landmarks) == 0:
        return None
    
    # Get first hand's landmarks
    hand_landmarks = result.hand_landmarks[0]
    
    # Extract normalized coordinates relative to wrist
    wrist = hand_landmarks[0]
    
    features = []
    for landmark in hand_landmarks:
        features.extend([
            landmark.x - wrist.x,
            landmark.y - wrist.y,
            landmark.z - wrist.z
        ])
    
    # Normalize features
    features = np.array(features, dtype=np.float32)
    max_val = np.max(np.abs(features))
    if max_val > 0:
        features = features / max_val
    
    return features


def load_dataset(data_path, landmarker, limit_per_class=0):
    """
    Load images from class folders and extract hand landmark features.
    
    Args:
        data_path: Path to dataset root (containing A/, B/, ..., Z/, 1/, ... 9/ folders)
        landmarker: MediaPipe HandLandmarker instance
        limit_per_class: Max images to process per class (0 = all)
    
    Returns:
        features, labels, class_names
    """
    import cv2
    
    features_list = []
    labels_list = []
    class_names = []
    
    # Get all class directories, sorted
    class_dirs = sorted([
        d for d in os.listdir(data_path)
        if os.path.isdir(os.path.join(data_path, d))
    ])
    
    print(f"Found {len(class_dirs)} classes: {', '.join(class_dirs)}")
    print()
    
    total_processed = 0
    total_detected = 0
    
    for class_idx, class_name in enumerate(class_dirs):
        class_path = os.path.join(data_path, class_name)
        class_names.append(class_name)
        
        # Get all image files
        image_files = sorted(
            glob.glob(os.path.join(class_path, '*.jpg')) +
            glob.glob(os.path.join(class_path, '*.png')) +
            glob.glob(os.path.join(class_path, '*.jpeg'))
        )
        
        # Apply limit
        if limit_per_class > 0:
            image_files = image_files[:limit_per_class]
        
        class_detected = 0
        class_total = len(image_files)
        
        for img_path in image_files:
            try:
                image = cv2.imread(img_path)
                if image is None:
                    continue
                
                total_processed += 1
                feature = extract_hand_features(image, landmarker)
                
                if feature is not None:
                    features_list.append(feature)
                    labels_list.append(class_idx)
                    class_detected += 1
                    total_detected += 1
            except Exception as e:
                pass  # Skip problematic images silently
        
        detection_rate = (class_detected / class_total * 100) if class_total > 0 else 0
        print(f"  [{class_idx+1:2d}/{len(class_dirs)}] Class '{class_name}': "
              f"{class_detected}/{class_total} hands detected ({detection_rate:.0f}%)")
    
    overall_rate = (total_detected / total_processed * 100) if total_processed > 0 else 0
    print(f"\n{'='*60}")
    print(f"Total: {total_detected}/{total_processed} images with hands detected "
          f"({overall_rate:.1f}%)")
    print(f"{'='*60}\n")
    
    return np.array(features_list), np.array(labels_list), class_names


def build_model(input_dim, num_classes):
    """Build a Dense neural network for classification (tuned for 150-epoch high-accuracy training)."""
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    
    # Slightly deeper/wider for better accuracy with long training
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(384, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.25),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.25),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.15),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    # Learning rate schedule for long training (150 epochs)
    lr_schedule = keras.optimizers.schedules.ExponentialDecay(
        initial_learning_rate=0.001,
        decay_steps=2000,
        decay_rate=0.96
    )
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=lr_schedule),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def main():
    parser = argparse.ArgumentParser(description='Train ISL sign language model')
    parser.add_argument('--data', type=str, default='data/data',
                        help='Path to dataset folder with class subfolders')
    parser.add_argument('--epochs', type=int, default=150,
                        help='Number of training epochs (default: 150 for high accuracy)')
    parser.add_argument('--batch-size', type=int, default=32,
                        help='Training batch size')
    parser.add_argument('--limit', type=int, default=200,
                        help='Max images per class to process (0=all, default=200 for faster training)')
    parser.add_argument('--output', type=str, default='models',
                        help='Output directory for saved model')
    parser.add_argument('--hand-model', type=str, default='data/hand_landmarker.task',
                        help='Path to MediaPipe hand landmarker model file')
    args = parser.parse_args()
    
    print("=" * 60)
    print("  ISL Sign Language Model Training")
    print("=" * 60)
    print()
    
    # Check dependencies
    print("Checking dependencies...")
    check_dependencies()
    
    # Verify dataset path
    data_path = args.data
    if not os.path.exists(data_path):
        print(f"[ERROR] Dataset path not found: {data_path}")
        sys.exit(1)
    
    # Verify hand landmarker model
    hand_model_path = args.hand_model
    if not os.path.exists(hand_model_path):
        print(f"[ERROR] Hand landmarker model not found: {hand_model_path}")
        print("   Download it with:")
        print("   curl -o data/hand_landmarker.task https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task")
        sys.exit(1)
    
    # Initialize MediaPipe HandLandmarker (new Tasks API)
    print("Initializing MediaPipe HandLandmarker...")
    landmarker = create_hand_landmarker(hand_model_path)
    print("  [OK] HandLandmarker initialized\n")
    
    # Load dataset
    print(f"Loading dataset from: {data_path}")
    if args.limit > 0:
        print(f"Processing up to {args.limit} images per class\n")
    else:
        print("Processing ALL images (this may take a while)\n")
    
    start_time = time.time()
    X, y, class_names = load_dataset(data_path, landmarker, args.limit)
    load_time = time.time() - start_time
    
    # Close landmarker
    landmarker.close()
    
    print(f"Dataset loading took {load_time:.1f} seconds")
    print(f"Feature shape: {X.shape}")
    print(f"Number of classes: {len(class_names)}")
    print(f"Classes: {class_names}\n")
    
    if len(X) == 0:
        print("[ERROR] No hand landmarks could be extracted. Training aborted.")
        sys.exit(1)
    
    # Check minimum samples per class
    unique, counts = np.unique(y, return_counts=True)
    min_count = counts.min()
    if min_count < 2:
        print(f"[WARN] Some classes have too few samples (min: {min_count}). Removing them.")
        valid_mask = np.isin(y, unique[counts >= 2])
        X = X[valid_mask]
        y = y[valid_mask]
        # Re-index labels
        remaining_classes = sorted(set(y))
        label_map = {old: new for new, old in enumerate(remaining_classes)}
        y = np.array([label_map[label] for label in y])
        class_names = [class_names[i] for i in remaining_classes]
        print(f"  Remaining: {len(class_names)} classes, {len(X)} samples\n")
    
    # Split data
    from sklearn.model_selection import train_test_split
    
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Validation samples: {len(X_val)}\n")
    
    # Build model
    import tensorflow as tf
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
    
    model = build_model(X.shape[1], len(class_names))
    model.summary()
    print()
    
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    model_path = os.path.join(args.output, 'isl_model.h5')
    
    # Callbacks (tuned for 150 epochs - higher patience to allow full training)
    # Note: ReduceLROnPlateau removed - using ExponentialDecay schedule instead
    callbacks = [
        EarlyStopping(
            monitor='val_accuracy',
            patience=30,
            restore_best_weights=True,
            verbose=1,
            mode='max'
        ),
        ModelCheckpoint(
            model_path,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1,
            mode='max'
        )
    ]
    
    # Train
    print("=" * 60)
    print("  Starting Training")
    print("=" * 60)
    print()
    
    train_start = time.time()
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks,
        verbose=1
    )
    
    train_time = time.time() - train_start
    
    # Save labels
    labels_path = os.path.join(args.output, 'labels.json')
    with open(labels_path, 'w') as f:
        json.dump(class_names, f, indent=2)
    
    # Save training info
    info_path = os.path.join(args.output, 'training_info.json')
    with open(info_path, 'w') as f:
        json.dump({
            'num_classes': len(class_names),
            'class_names': class_names,
            'num_samples': len(X),
            'num_train': len(X_train),
            'num_val': len(X_val),
            'input_dim': int(X.shape[1]),
            'epochs_run': len(history.history['accuracy']),
            'final_accuracy': float(history.history['accuracy'][-1]),
            'final_val_accuracy': float(history.history['val_accuracy'][-1]),
            'best_val_accuracy': float(max(history.history['val_accuracy'])),
            'training_time_seconds': round(train_time, 1)
        }, f, indent=2)
    
    # Print results
    print()
    print("=" * 60)
    print("  Training Complete!")
    print("=" * 60)
    print(f"  Training time:        {train_time:.1f} seconds")
    print(f"  Epochs run:           {len(history.history['accuracy'])}")
    print(f"  Final accuracy:       {history.history['accuracy'][-1]:.4f}")
    print(f"  Final val accuracy:   {history.history['val_accuracy'][-1]:.4f}")
    print(f"  Best val accuracy:    {max(history.history['val_accuracy']):.4f}")
    print(f"  Model saved to:       {model_path}")
    print(f"  Labels saved to:      {labels_path}")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  1. Start the ML backend: python app.py")
    print("  2. Open http://localhost:3000/sign-detection")
    print("  3. The model will now make real predictions!")


if __name__ == '__main__':
    main()
