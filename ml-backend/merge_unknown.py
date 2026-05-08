"""
Merge archive gesture folders into a single 'Unknown' class for training.

This script copies all images from the archive folders (palm, fist, thumbs-up, etc.)
into a new 'Unknown' folder in the training data directory.
"""

import os
import shutil
from pathlib import Path

# Paths
ARCHIVE_DIR = Path("archive (1)")
DATA_DIR = Path("data/data")
UNKNOWN_DIR = DATA_DIR / "Unknown"

def merge_unknown_gestures():
    """Merge all archive gesture folders into a single 'Unknown' folder."""
    
    if not ARCHIVE_DIR.exists():
        print(f"❌ Archive directory not found: {ARCHIVE_DIR}")
        return
    
    if not DATA_DIR.exists():
        print(f"❌ Data directory not found: {DATA_DIR}")
        return
    
    # Create 'Unknown' directory
    UNKNOWN_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Created directory: {UNKNOWN_DIR}")
    print()
    
    # Get all subdirectories in archive
    archive_folders = [d for d in ARCHIVE_DIR.iterdir() if d.is_dir()]
    
    total_copied = 0
    
    for folder in sorted(archive_folders):
        print(f"Processing: {folder.name}")
        
        # Get all image files
        image_files = list(folder.glob("*.jpg")) + list(folder.glob("*.png")) + list(folder.glob("*.jpeg"))
        
        copied = 0
        for img_file in image_files:
            # Create unique filename: foldername_originalname.jpg
            new_name = f"{folder.name}_{img_file.name}"
            dest_path = UNKNOWN_DIR / new_name
            
            try:
                shutil.copy2(img_file, dest_path)
                copied += 1
                total_copied += 1
            except Exception as e:
                print(f"  ⚠ Error copying {img_file.name}: {e}")
        
        print(f"  ✓ Copied {copied} images")
    
    print()
    print("=" * 60)
    print(f"✓ Successfully merged {total_copied} images into '{UNKNOWN_DIR}'")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  1. Run: python train.py --data data/data --epochs 30 --limit 200")
    print("  2. The model will now learn to recognize 'Unknown' gestures!")
    print()

if __name__ == "__main__":
    merge_unknown_gestures()
