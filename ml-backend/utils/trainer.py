"""
Model Trainer Module
Handles dataset loading, training, and evaluation
"""

import os
import json
import glob
import numpy as np
from datetime import datetime
from typing import Tuple, List, Dict, Optional

import cv2
from PIL import Image

from .hand_detector import HandDetector
from .feature_extractor import FeatureExtractor
from .model import ISLModel, CNNModel, create_model


class DatasetLoader:
    """
    Load and preprocess ISL dataset
    """
    
    def __init__(self, data_path: str, feature_type: str = 'relative'):
        """
        Initialize the dataset loader
        
        Args:
            data_path: Path to the dataset directory
            feature_type: Type of features to extract
        """
        self.data_path = data_path
        self.feature_type = feature_type
        self.hand_detector = HandDetector()
        self.feature_extractor = FeatureExtractor(feature_type=feature_type)
    
    def load(self) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Load the dataset
        
        Expected directory structure:
        data_path/
            A/
                img1.jpg
                img2.jpg
                ...
            B/
                ...
            ...
            
        Returns:
            Tuple of (features, labels, class_names)
        """
        features = []
        labels = []
        class_names = []
        
        # Get all class directories
        class_dirs = sorted([
            d for d in os.listdir(self.data_path)
            if os.path.isdir(os.path.join(self.data_path, d))
        ])
        
        print(f"Found {len(class_dirs)} classes: {class_names}")
        
        for class_idx, class_name in enumerate(class_dirs):
            class_path = os.path.join(self.data_path, class_name)
            class_names.append(class_name)
            
            # Get all images in class directory
            image_files = glob.glob(os.path.join(class_path, '*.jpg')) + \
                         glob.glob(os.path.join(class_path, '*.png')) + \
                         glob.glob(os.path.join(class_path, '*.jpeg'))
            
            print(f"Loading {len(image_files)} images for class '{class_name}'")
            
            for image_path in image_files:
                try:
                    # Load image
                    image = cv2.imread(image_path)
                    if image is None:
                        continue
                    
                    # Detect hand
                    detected, landmarks = self.hand_detector.detect(image)
                    
                    if detected:
                        # Extract features
                        feature = self.feature_extractor.extract(landmarks, image.shape)
                        features.append(feature)
                        labels.append(class_idx)
                    else:
                        print(f"No hand detected in {image_path}")
                
                except Exception as e:
                    print(f"Error processing {image_path}: {e}")
        
        return np.array(features), np.array(labels), class_names
    
    def load_images(self, target_size: Tuple[int, int] = (224, 224)) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Load images directly for CNN training
        
        Returns:
            Tuple of (images, labels, class_names)
        """
        images = []
        labels = []
        class_names = []
        
        class_dirs = sorted([
            d for d in os.listdir(self.data_path)
            if os.path.isdir(os.path.join(self.data_path, d))
        ])
        
        for class_idx, class_name in enumerate(class_dirs):
            class_path = os.path.join(self.data_path, class_name)
            class_names.append(class_name)
            
            image_files = glob.glob(os.path.join(class_path, '*.jpg')) + \
                         glob.glob(os.path.join(class_path, '*.png'))
            
            for image_path in image_files:
                try:
                    image = Image.open(image_path).convert('RGB')
                    image = image.resize(target_size)
                    images.append(np.array(image))
                    labels.append(class_idx)
                except Exception as e:
                    print(f"Error loading {image_path}: {e}")
        
        return np.array(images), np.array(labels), class_names


def train_model_task(data_path: str,
                     epochs: int = 150,
                     batch_size: int = 32,
                     learning_rate: float = 0.001,
                     validation_split: float = 0.2,
                     training_id: str = None):
    """
    Background task for model training
    
    Args:
        data_path: Path to training data
        epochs: Number of epochs
        batch_size: Batch size
        learning_rate: Learning rate
        validation_split: Validation split ratio
        training_id: Unique training ID
    """
    from sklearn.model_selection import train_test_split
    
    print(f"Starting training {training_id}")
    print(f"Data path: {data_path}")
    
    # Load dataset
    loader = DatasetLoader(data_path)
    X, y, class_names = loader.load()
    
    print(f"Loaded {len(X)} samples")
    
    if len(X) == 0:
        print("No samples loaded. Training aborted.")
        return
    
    # Split data
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=validation_split, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Validation samples: {len(X_val)}")
    
    # Create model
    model = ISLModel(
        input_shape=(X.shape[1],),
        num_classes=len(class_names),
        hidden_units=[256, 128, 64]
    )
    
    # Save class names
    os.makedirs('models', exist_ok=True)
    with open('models/labels.json', 'w') as f:
        json.dump(class_names, f)
    
    # Train model
    history = model.train(
        X_train, y_train,
        X_val=X_val, y_val=y_val,
        epochs=epochs,
        batch_size=batch_size,
        model_path='models/isl_model.h5'
    )
    
    # Save training history
    with open(f'models/training_history_{training_id}.json', 'w') as f:
        json.dump({
            'training_id': training_id,
            'timestamp': datetime.now().isoformat(),
            'epochs': epochs,
            'final_accuracy': float(history['accuracy'][-1]),
            'final_val_accuracy': float(history['val_accuracy'][-1]),
            'class_names': class_names,
            'num_samples': len(X)
        }, f, indent=2)
    
    print(f"Training completed for {training_id}")
    print(f"Final accuracy: {history['accuracy'][-1]:.4f}")
    print(f"Final validation accuracy: {history['val_accuracy'][-1]:.4f}")


class ModelTrainer:
    """
    Complete training pipeline
    """
    
    def __init__(self, config: Dict):
        """
        Initialize trainer with configuration
        
        Args:
            config: Training configuration dictionary
        """
        self.config = config
        self.model = None
        self.history = None
    
    def prepare_data(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Prepare training and validation data"""
        from sklearn.model_selection import train_test_split
        
        loader = DatasetLoader(self.config['data_path'])
        X, y, class_names = loader.load()
        
        # Save labels
        os.makedirs(os.path.dirname(self.config['model_path']), exist_ok=True)
        labels_path = os.path.join(
            os.path.dirname(self.config['model_path']),
            'labels.json'
        )
        with open(labels_path, 'w') as f:
            json.dump(class_names, f)
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y,
            test_size=self.config.get('validation_split', 0.2),
            random_state=42,
            stratify=y
        )
        
        return X_train, X_val, y_train, y_val
    
    def train(self) -> Dict:
        """
        Execute training pipeline
        
        Returns:
            Training history and metrics
        """
        # Prepare data
        X_train, X_val, y_train, y_val = self.prepare_data()
        
        # Create model
        self.model = create_model(
            self.config.get('model_type', 'mlp'),
            input_shape=(X_train.shape[1],),
            num_classes=len(np.unique(y_train))
        )
        
        # Train
        self.history = self.model.train(
            X_train, y_train,
            X_val=X_val, y_val=y_val,
            epochs=self.config.get('epochs', 150),
            batch_size=self.config.get('batch_size', 32),
            model_path=self.config['model_path']
        )
        
        return self.history
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
        """
        Evaluate the trained model
        
        Returns:
            Evaluation metrics
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        loss, accuracy = self.model.evaluate(X_test, y_test)
        
        return {
            'loss': loss,
            'accuracy': accuracy
        }


def main():
    """Main training script"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train ISL classification model')
    parser.add_argument('--data', type=str, required=True, help='Path to training data')
    parser.add_argument('--epochs', type=int, default=150, help='Number of epochs (default: 150 for high accuracy)')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--model-path', type=str, default='models/isl_model.h5', help='Model save path')
    
    args = parser.parse_args()
    
    config = {
        'data_path': args.data,
        'epochs': args.epochs,
        'batch_size': args.batch_size,
        'learning_rate': args.lr,
        'model_path': args.model_path,
        'validation_split': 0.2
    }
    
    trainer = ModelTrainer(config)
    history = trainer.train()
    
    print("\nTraining completed!")
    print(f"Final accuracy: {history['accuracy'][-1]:.4f}")
    print(f"Final validation accuracy: {history['val_accuracy'][-1]:.4f}")


if __name__ == '__main__':
    main()
