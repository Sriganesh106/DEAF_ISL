"""
ISL Classification Model Module
Neural network model for Indian Sign Language classification
"""

import os
import json
import numpy as np
from typing import Tuple, Optional, List, Dict

# Try to import TensorFlow, fall back to a simpler implementation if not available
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, models, optimizers
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("TensorFlow not available. Some features will be limited.")


class ISLModel:
    """
    Neural network model for ISL alphabet classification
    """
    
    def __init__(self, 
                 input_shape: Tuple[int, ...] = (63,),
                 num_classes: int = 26,
                 hidden_units: List[int] = [256, 128, 64]):
        """
        Initialize the ISL classification model
        
        Args:
            input_shape: Shape of input features
            num_classes: Number of output classes (26 for alphabet)
            hidden_units: List of hidden layer sizes
        """
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.hidden_units = hidden_units
        self.model = None
        
        if TF_AVAILABLE:
            self._build_model()
    
    def _build_model(self):
        """Build the neural network model"""
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required to build the model")
        
        self.model = models.Sequential([
            layers.Input(shape=self.input_shape),
            layers.Dense(self.hidden_units[0], activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            layers.Dense(self.hidden_units[1], activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            layers.Dense(self.hidden_units[2], activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        self.model.compile(
            optimizer=optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
    
    def train(self, 
              X_train: np.ndarray, 
              y_train: np.ndarray,
              X_val: Optional[np.ndarray] = None,
              y_val: Optional[np.ndarray] = None,
              epochs: int = 50,
              batch_size: int = 32,
              model_path: str = 'models/isl_model.h5') -> Dict:
        """
        Train the model
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features (optional)
            y_val: Validation labels (optional)
            epochs: Number of training epochs
            batch_size: Batch size for training
            model_path: Path to save the best model
            
        Returns:
            Training history
        """
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required to train the model")
        
        # Create directory for model
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            ModelCheckpoint(
                model_path,
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6,
                verbose=1
            )
        ]
        
        # Validation data
        validation_data = None
        if X_val is not None and y_val is not None:
            validation_data = (X_val, y_val)
        
        # Train
        history = self.model.fit(
            X_train, y_train,
            validation_data=validation_data,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        return history.history
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions on input features
        
        Args:
            X: Input features (single sample or batch)
            
        Returns:
            Prediction probabilities
        """
        if self.model is None:
            # Demo mode - return random predictions
            predictions = np.random.random((1, self.num_classes))
            predictions /= predictions.sum(axis=1, keepdims=True)
            return predictions
        
        # Ensure correct shape
        if len(X.shape) == 1:
            X = X.reshape(1, -1)
        
        return self.model.predict(X, verbose=0)
    
    def predict_class(self, X: np.ndarray) -> int:
        """
        Predict the class for input features
        
        Args:
            X: Input features
            
        Returns:
            Predicted class index
        """
        predictions = self.predict(X)
        return np.argmax(predictions[0])
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Tuple[float, float]:
        """
        Evaluate the model on test data
        
        Args:
            X_test: Test features
            y_test: Test labels
            
        Returns:
            Tuple of (loss, accuracy)
        """
        if self.model is None:
            return 0.0, 0.0
        
        return self.model.evaluate(X_test, y_test, verbose=0)
    
    def save(self, path: str):
        """
        Save the model to a file
        
        Args:
            path: Path to save the model
        """
        if self.model is not None:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            self.model.save(path)
            print(f"Model saved to {path}")
    
    @classmethod
    def load(cls, path: str) -> 'ISLModel':
        """
        Load a model from a file
        
        Args:
            path: Path to the saved model
            
        Returns:
            Loaded ISLModel instance
        """
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required to load the model")
        
        instance = cls()
        instance.model = keras.models.load_model(path)
        instance.input_shape = instance.model.input_shape[1:]
        instance.num_classes = instance.model.output_shape[1]
        return instance
    
    def summary(self):
        """Print model summary"""
        if self.model is not None:
            self.model.summary()
        else:
            print("Model not built")


class CNNModel:
    """
    CNN-based model for image-based sign classification
    Used when we want to classify directly from images
    """
    
    def __init__(self, 
                 input_shape: Tuple[int, int, int] = (224, 224, 3),
                 num_classes: int = 26):
        """
        Initialize the CNN model
        
        Args:
            input_shape: Shape of input images
            num_classes: Number of output classes
        """
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = None
        
        if TF_AVAILABLE:
            self._build_model()
    
    def _build_model(self):
        """Build the CNN model"""
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required to build the CNN model")
        
        # Use MobileNetV2 as base for transfer learning
        base_model = keras.applications.MobileNetV2(
            input_shape=self.input_shape,
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False  # Freeze base model
        
        self.model = models.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        self.model.compile(
            optimizer=optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
    
    def fine_tune(self, num_layers: int = 20):
        """
        Fine-tune the last num_layers of the base model
        
        Args:
            num_layers: Number of layers to unfreeze
        """
        if self.model is None:
            return
        
        base_model = self.model.layers[0]
        base_model.trainable = True
        
        # Freeze all layers except the last num_layers
        for layer in base_model.layers[:-num_layers]:
            layer.trainable = False
        
        # Recompile with lower learning rate
        self.model.compile(
            optimizer=optimizers.Adam(learning_rate=1e-5),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
    
    def train(self, *args, **kwargs):
        """Train method - same signature as ISLModel"""
        return self.model.fit(*args, **kwargs)
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        return self.model.predict(X, verbose=0)
    
    def save(self, path: str):
        """Save the model"""
        self.model.save(path)
    
    @classmethod
    def load(cls, path: str) -> 'CNNModel':
        """Load a model from file"""
        instance = cls()
        instance.model = keras.models.load_model(path)
        return instance


def create_model(model_type: str = 'mlp', **kwargs) -> ISLModel or CNNModel:
    """
    Factory function to create models
    
    Args:
        model_type: Type of model ('mlp' or 'cnn')
        **kwargs: Additional arguments for model constructor
        
    Returns:
        Model instance
    """
    if model_type == 'mlp':
        return ISLModel(**kwargs)
    elif model_type == 'cnn':
        return CNNModel(**kwargs)
    else:
        raise ValueError(f"Unknown model type: {model_type}")
