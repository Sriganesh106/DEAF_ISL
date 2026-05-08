import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import subprocess

# Settings
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10
DATA_DIR = "./custom_dataset" # Directory with subfolders for each class (e.g. apple, cup, pen)
MODEL_SAVE_PATH = "./saved_objects_model"
TFJS_EXPORT_PATH = "../public/models/custom-objects"

def prepare_dataset_folders():
    """Create sample directories if they don't exist"""
    classes = ["APPLE", "CUP", "PEN", "SHOE"]
    for c in classes:
        os.makedirs(os.path.join(DATA_DIR, c), exist_ok=True)
    print(f"Please place training images inside {DATA_DIR}/[CLASS_NAME] before training.")

def build_model(num_classes):
    print("Loading MobileNetV2 base model...")
    # Load MobileNetV2 without the top classification layer
    base_model = MobileNetV2(
        weights='imagenet', 
        include_top=False, 
        input_shape=(224, 224, 3)
    )
    
    # Freeze the base model
    base_model.trainable = False
    
    # Add custom classification head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.2)(x) # Help prevent overfitting on small datasets
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def train():
    if not os.path.exists(DATA_DIR) or len(os.listdir(DATA_DIR)) == 0:
        prepare_dataset_folders()
        print("Waiting for dataset gathering. Ensure you have subfolders with JPG images inside ./custom_dataset/")
        return
        
    # Check if there are actual images
    has_images = False
    for root, _, files in os.walk(DATA_DIR):
        if any(f.lower().endswith(('.png', '.jpg', '.jpeg')) for f in files):
            has_images = True
            break
            
    if not has_images:
        prepare_dataset_folders()
        print(f"Error: No images found in {DATA_DIR}. Please add images to train the model.", flush=True)
        return

    print("Preparing data generators...")
    datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
    )
    
    train_generator = datagen.flow_from_directory(
        DATA_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
    )
    
    num_classes = len(train_generator.class_indices)
    print(f"Found {num_classes} classes: {train_generator.class_indices}")
    
    # Save class indices for frontend use
    import json
    with open("object_classes.json", "w") as f:
        # Invert dictionary to {0: 'APPLE', 1: 'CUP'}
        inv_map = {str(v): k for k, v in train_generator.class_indices.items()}
        json.dump(inv_map, f)
        print("Saved class mappings to object_classes.json")
    
    model = build_model(num_classes)
    
    print("Starting training...")
    model.fit(
        train_generator,
        epochs=EPOCHS
    )
    
    print(f"Exporting Python model to {MODEL_SAVE_PATH}")
    model.export(MODEL_SAVE_PATH)
    
    # Convert to TFJS
    print("Converting model to TensorFlow.js format...")
    os.makedirs(TFJS_EXPORT_PATH, exist_ok=True)
    
    # Run the tensorflowjs_converter CLI to create the graph model
    try:
        subprocess.run([
            "tensorflowjs_converter",
            "--input_format=keras_saved_model",
            MODEL_SAVE_PATH,
            TFJS_EXPORT_PATH
        ], check=True)
        print(f"Successfully exported TFJS model to {TFJS_EXPORT_PATH}")
        print("You can now load this model in your frontend React code.")
    except Exception as e:
        print(f"Failed to convert model: {e}")

if __name__ == "__main__":
    train()
