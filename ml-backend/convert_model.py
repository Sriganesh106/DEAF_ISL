"""
Convert old Keras model to new format compatible with TensorFlow 2.15+
"""
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras

# Paths
MODEL_PATH = "models/isl_model.h5"
LABELS_PATH = "models/labels.json"
OUTPUT_MODEL = "models/isl_model_new.h5"

print("Loading labels...")
with open(LABELS_PATH, 'r') as f:
    labels = json.load(f)
    
num_classes = len(labels)
print(f"Number of classes: {num_classes}")

# Build new model with same architecture
print("\nBuilding new model...")
model = keras.Sequential([
    keras.layers.Input(shape=(63,)),  # Use Input() instead of batch_shape
    keras.layers.Dense(256, activation='relu'),
    keras.layers.BatchNormalization(),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.BatchNormalization(),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.BatchNormalization(),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("\nLoading old model weights...")
try:
    # Try to load just the weights from old model
    old_model = keras.models.load_model(MODEL_PATH, compile=False)
    
    # Copy weights layer by layer
    for new_layer, old_layer in zip(model.layers, old_model.layers):
        try:
            new_layer.set_weights(old_layer.get_weights())
            print(f"  ✓ Copied weights for {new_layer.name}")
        except:
            print(f"  ⚠ Skipped {new_layer.name}")
    
    print(f"\n✓ Weights transferred successfully")
    
except Exception as e:
    print(f"✗ Could not load old model: {e}")
    print("\nYou'll need to retrain the model using train.py")
    exit(1)

# Save new model
print(f"\nSaving new model to {OUTPUT_MODEL}...")
model.save(OUTPUT_MODEL)

# Replace old model
print(f"Replacing old model...")
os.replace(OUTPUT_MODEL, MODEL_PATH)

print(f"\n✓ Model conversion complete!")
print(f"✓ Model saved to {MODEL_PATH}")
print("\nRestart app.py to use the converted model.")
