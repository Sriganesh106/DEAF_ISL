"""
ISL Advanced Model Training Script
Trains a DEEPER neural network for Indian Sign Language (ISL) with more epochs.
Designed for high-accuracy training (150 epochs).

Usage:
    python train_advanced.py --data data/data --epochs 150 --batch-size 32
"""

import os
import sys
import json
import glob
import time
import argparse
import numpy as np
from train import check_dependencies, create_hand_landmarker, load_dataset

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

def build_advanced_model(input_dim, num_classes):
    """Build a Deeper/Wider Dense neural network for better accuracy."""
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    
    # Advanced architecture:
    # - More layers
    # - Wider layers (512 units)
    # - LeakyReLU for better gradient flow
    # - Lower dropout for final fine-tuning
    
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        
        # Block 1
        layers.Dense(512),
        layers.LeakyReLU(alpha=0.1),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        # Block 2
        layers.Dense(256),
        layers.LeakyReLU(alpha=0.1),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        # Block 3
        layers.Dense(128),
        layers.LeakyReLU(alpha=0.1),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        
        # Block 4
        layers.Dense(64),
        layers.LeakyReLU(alpha=0.1),
        layers.BatchNormalization(),
        
        # Output
        layers.Dense(num_classes, activation='softmax')
    ])
    
    # Learning rate schedule tuned for 150 epochs - slower decay for longer convergence
    lr_schedule = keras.optimizers.schedules.ExponentialDecay(
        initial_learning_rate=0.001,
        decay_steps=3000,
        decay_rate=0.95
    )
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=lr_schedule),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def main():
    parser = argparse.ArgumentParser(description='Train Advanced ISL sign language model')
    parser.add_argument('--data', type=str, default='data/data',
                        help='Path to dataset folder')
    parser.add_argument('--epochs', type=int, default=150,
                        help='Number of training epochs (default: 150 for high accuracy)')
    parser.add_argument('--batch-size', type=int, default=32,
                        help='Training batch size')
    parser.add_argument('--limit', type=int, default=0,
                        help='Max images per class (0=all)')
    parser.add_argument('--output', type=str, default='models',
                        help='Output directory')
    parser.add_argument('--hand-model', type=str, default='data/hand_landmarker.task',
                        help='Path to MediaPipe hand landmarker')
    args = parser.parse_args()
    
    print("=" * 60)
    print("  Advanced ISL Model Training (Deep Network)")
    print("=" * 60)
    
    # Check dependencies
    check_dependencies()
    
    # Setup
    if not os.path.exists(args.data):
        print(f"❌ Dataset path not found: {args.data}")
        sys.exit(1)
        
    print("Initializing MediaPipe HandLandmarker...")
    landmarker = create_hand_landmarker(args.hand_model)
    
    # Load dataset
    print(f"Loading dataset from: {args.data}")
    start_time = time.time()
    X, y, class_names = load_dataset(args.data, landmarker, args.limit)
    landmarker.close()
    
    if len(X) == 0:
        print("❌ No data loaded.")
        sys.exit(1)
        
    # Split
    from sklearn.model_selection import train_test_split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Validation samples: {len(X_val)}")
    print(f"Epochs: {args.epochs} (High Accuracy Mode)\n")
    
    # Build Model
    import tensorflow as tf
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
    
    model = build_advanced_model(X.shape[1], len(class_names))
    model.summary()
    
    # Callbacks (tuned for 150 epochs - higher patience for full training)
    os.makedirs(args.output, exist_ok=True)
    model_path = os.path.join(args.output, 'isl_model.h5')
    
    callbacks = [
        EarlyStopping(monitor='val_accuracy', patience=35, restore_best_weights=True, verbose=1, mode='max'),
        ModelCheckpoint(model_path, monitor='val_accuracy', save_best_only=True, verbose=1, mode='max')
    ]
    
    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save info
    labels_path = os.path.join(args.output, 'labels.json')
    with open(labels_path, 'w') as f:
        json.dump(class_names, f, indent=2)
        
    print("\n" + "="*60)
    print(f"  Advanced Training Complete!")
    print(f"  Final Val Accuracy: {history.history['val_accuracy'][-1]:.4f}")
    print(f"  Model saved to: {model_path}")
    print("="*60)

if __name__ == '__main__':
    main()
