"""
ISL Dataset Preparation Script
Helps prepare and organize ISL dataset for training

This script can:
1. Download public ISL datasets
2. Organize images by class
3. Split into train/val/test sets
4. Generate augmented samples
"""

import os
import shutil
import random
from pathlib import Path
from typing import List, Dict, Tuple

import cv2
import numpy as np
from PIL import Image


class DatasetPreparer:
    """
    Prepare and organize ISL datasets for training
    """
    
    def __init__(self, output_path: str = 'data/isl_dataset'):
        """
        Initialize dataset preparer
        
        Args:
            output_path: Path to save organized dataset
        """
        self.output_path = output_path
        self.classes = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')  # A-Z
    
    def create_directory_structure(self):
        """Create the directory structure for the dataset"""
        for split in ['train', 'val', 'test']:
            for class_name in self.classes:
                os.makedirs(
                    os.path.join(self.output_path, split, class_name),
                    exist_ok=True
                )
        print(f"Created directory structure at {self.output_path}")
    
    def organize_existing_images(self, source_path: str, split_ratio: Tuple[float, float, float] = (0.7, 0.15, 0.15)):
        """
        Organize existing images into train/val/test splits
        
        Args:
            source_path: Path to existing images (organized by class)
            split_ratio: Ratio for train/val/test splits
        """
        self.create_directory_structure()
        
        for class_name in os.listdir(source_path):
            class_path = os.path.join(source_path, class_name)
            
            if not os.path.isdir(class_path):
                continue
            
            if class_name not in self.classes:
                print(f"Skipping unknown class: {class_name}")
                continue
            
            # Get all images
            images = []
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp']:
                images.extend(Path(class_path).glob(ext))
            
            random.shuffle(images)
            
            # Calculate split indices
            n_total = len(images)
            n_train = int(n_total * split_ratio[0])
            n_val = int(n_total * split_ratio[1])
            
            train_images = images[:n_train]
            val_images = images[n_train:n_train + n_val]
            test_images = images[n_train + n_val:]
            
            # Copy images to appropriate directories
            for img_path in train_images:
                shutil.copy(img_path, os.path.join(self.output_path, 'train', class_name, img_path.name))
            
            for img_path in val_images:
                shutil.copy(img_path, os.path.join(self.output_path, 'val', class_name, img_path.name))
            
            for img_path in test_images:
                shutil.copy(img_path, os.path.join(self.output_path, 'test', class_name, img_path.name))
            
            print(f"Class {class_name}: {len(train_images)} train, {len(val_images)} val, {len(test_images)} test")
    
    def augment_images(self, images_path: str, augment_factor: int = 2):
        """
        Apply data augmentation to increase dataset size
        
        Args:
            images_path: Path to images to augment
            augment_factor: Number of augmented samples to create per image
        """
        augmented_path = images_path + '_augmented'
        os.makedirs(augmented_path, exist_ok=True)
        
        for class_name in os.listdir(images_path):
            class_path = os.path.join(images_path, class_name)
            output_class_path = os.path.join(augmented_path, class_name)
            os.makedirs(output_class_path, exist_ok=True)
            
            if not os.path.isdir(class_path):
                continue
            
            for img_name in os.listdir(class_path):
                img_path = os.path.join(class_path, img_name)
                
                if not img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    continue
                
                # Load image
                img = cv2.imread(img_path)
                
                # Copy original
                shutil.copy(img_path, os.path.join(output_class_path, img_name))
                
                # Generate augmented versions
                for i in range(augment_factor):
                    aug_img = self._apply_augmentation(img)
                    
                    aug_name = f"{Path(img_name).stem}_aug_{i}.jpg"
                    cv2.imwrite(os.path.join(output_class_path, aug_name), aug_img)
        
        print(f"Augmented images saved to {augmented_path}")
    
    def _apply_augmentation(self, image: np.ndarray) -> np.ndarray:
        """
        Apply random augmentation to an image
        
        Args:
            image: Input image
            
        Returns:
            Augmented image
        """
        aug_img = image.copy()
        
        # Random rotation (-15 to 15 degrees)
        angle = random.uniform(-15, 15)
        h, w = aug_img.shape[:2]
        M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1)
        aug_img = cv2.warpAffine(aug_img, M, (w, h))
        
        # Random brightness adjustment
        brightness = random.uniform(0.8, 1.2)
        aug_img = np.clip(aug_img * brightness, 0, 255).astype(np.uint8)
        
        # Random horizontal flip (50% chance)
        if random.random() > 0.5:
            aug_img = cv2.flip(aug_img, 1)
        
        # Random zoom (crop and resize)
        zoom_factor = random.uniform(0.8, 1.0)
        new_h, new_w = int(h * zoom_factor), int(w * zoom_factor)
        y1 = (h - new_h) // 2
        x1 = (w - new_w) // 2
        aug_img = aug_img[y1:y1+new_h, x1:x1+new_w]
        aug_img = cv2.resize(aug_img, (w, h))
        
        return aug_img
    
    def create_sample_dataset(self, num_samples_per_class: int = 10):
        """
        Create a sample dataset structure for testing
        
        Args:
            num_samples_per_class: Number of sample images per class
        """
        self.create_directory_structure()
        
        print(f"Creating sample dataset with {num_samples_per_class} images per class")
        print("Note: These are placeholder images. Replace with real ISL images for training.")
        
        for split in ['train', 'val', 'test']:
            for class_name in self.classes[:5]:  # Only create for first 5 classes as example
                class_path = os.path.join(self.output_path, split, class_name)
                
                for i in range(num_samples_per_class):
                    # Create a placeholder image
                    img = np.random.randint(100, 200, (224, 224, 3), dtype=np.uint8)
                    
                    # Add class label text
                    cv2.putText(img, class_name, (80, 120), 
                               cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
                    
                    img_name = f"{class_name}_{i:03d}.jpg"
                    cv2.imwrite(os.path.join(class_path, img_name), img)
        
        print(f"Sample dataset created at {self.output_path}")


def main():
    """Main function for dataset preparation"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Prepare ISL dataset for training')
    parser.add_argument('--source', type=str, help='Path to existing images')
    parser.add_argument('--output', type=str, default='data/isl_dataset', help='Output path')
    parser.add_argument('--create-sample', action='store_true', help='Create sample dataset')
    parser.add_argument('--augment', action='store_true', help='Apply augmentation')
    
    args = parser.parse_args()
    
    preparer = DatasetPreparer(args.output)
    
    if args.create_sample:
        preparer.create_sample_dataset()
    elif args.source:
        preparer.organize_existing_images(args.source)
        if args.augment:
            preparer.augment_images(os.path.join(args.output, 'train'))
    else:
        print("Please provide --source or use --create-sample")
        parser.print_help()


if __name__ == '__main__':
    main()
