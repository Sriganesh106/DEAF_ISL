"""
Feature Extractor Module
Extracts features from hand landmarks for sign language classification
"""

import numpy as np
from typing import List, Dict, Tuple, Optional


class FeatureExtractor:
    """
    Extract features from hand landmarks for ISL classification
    """
    
    def __init__(self, feature_type: str = 'relative'):
        """
        Initialize the feature extractor
        
        Args:
            feature_type: Type of features to extract
                'relative': Normalized relative to wrist
                'distances': Pairwise distances between landmarks
                'angles': Angles between finger joints
                'all': Combination of all features
        """
        self.feature_type = feature_type
        self.num_landmarks = 21
    
    def extract(self, landmarks: List[Dict], image_shape: Tuple[int, int]) -> np.ndarray:
        """
        Extract features from hand landmarks
        
        Args:
            landmarks: List of landmark dictionaries with x, y, z coordinates
            image_shape: (height, width) of the source image
            
        Returns:
            Feature vector as numpy array
        """
        if self.feature_type == 'relative':
            return self._extract_relative_features(landmarks)
        elif self.feature_type == 'distances':
            return self._extract_distance_features(landmarks)
        elif self.feature_type == 'angles':
            return self._extract_angle_features(landmarks)
        else:  # 'all'
            relative = self._extract_relative_features(landmarks)
            distances = self._extract_distance_features(landmarks)
            angles = self._extract_angle_features(landmarks)
            return np.concatenate([relative, distances, angles])
    
    def _extract_relative_features(self, landmarks: List[Dict]) -> np.ndarray:
        """
        Extract normalized features relative to wrist
        
        Features:
        - Normalized x, y, z coordinates relative to wrist
        - Flattened to 63 features (21 landmarks * 3 coordinates)
        """
        # Get wrist as reference point
        wrist = landmarks[0]
        
        features = []
        
        # Calculate bounding box for normalization
        x_coords = [lm['x'] for lm in landmarks]
        y_coords = [lm['y'] for lm in landmarks]
        
        min_x, max_x = min(x_coords), max(x_coords)
        min_y, max_y = min(y_coords), max(y_coords)
        
        # Normalize by bounding box size
        width = max_x - min_x if max_x > min_x else 1
        height = max_y - min_y if max_y > min_y else 1
        
        for landmark in landmarks:
            # Normalize relative to wrist
            norm_x = (landmark['x'] - wrist['x']) / width
            norm_y = (landmark['y'] - wrist['y']) / height
            norm_z = landmark['z']  # Z is already relative
            
            features.extend([norm_x, norm_y, norm_z])
        
        return np.array(features, dtype=np.float32)
    
    def _extract_distance_features(self, landmarks: List[Dict]) -> np.ndarray:
        """
        Extract pairwise distances between key landmarks
        
        Features:
        - Distances from each fingertip to wrist
        - Distances between adjacent fingertips
        - Distances from fingertips to palm center
        """
        features = []
        
        # Key landmark indices
        wrist_idx = 0
        fingertips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky tips
        mcps = [2, 5, 9, 13, 17]  # MCP joints (palm)
        
        # Calculate palm center
        palm_center = self._calculate_palm_center(landmarks)
        
        # Distance from each landmark to wrist
        for landmark in landmarks:
            dist = self._distance_3d(landmarks[wrist_idx], landmark)
            features.append(dist)
        
        # Distance from each fingertip to palm center
        for tip_idx in fingertips:
            dist = self._distance_3d(palm_center, landmarks[tip_idx])
            features.append(dist)
        
        # Distance between adjacent fingertips
        for i in range(len(fingertips) - 1):
            dist = self._distance_3d(landmarks[fingertips[i]], landmarks[fingertips[i + 1]])
            features.append(dist)
        
        # Distance from thumb tip to other fingertips
        for tip_idx in fingertips[1:]:
            dist = self._distance_3d(landmarks[fingertips[0]], landmarks[tip_idx])
            features.append(dist)
        
        return np.array(features, dtype=np.float32)
    
    def _extract_angle_features(self, landmarks: List[Dict]) -> np.ndarray:
        """
        Extract angle features between finger segments
        
        Features:
        - Angles at each finger joint
        - Angles between fingers
        """
        features = []
        
        # Finger joint chains
        fingers = {
            'thumb': [1, 2, 3, 4],
            'index': [5, 6, 7, 8],
            'middle': [9, 10, 11, 12],
            'ring': [13, 14, 15, 16],
            'pinky': [17, 18, 19, 20]
        }
        
        # Calculate angles at each joint
        for finger_name, indices in fingers.items():
            for i in range(1, len(indices) - 1):
                angle = self._calculate_angle(
                    landmarks[indices[i - 1]],
                    landmarks[indices[i]],
                    landmarks[indices[i + 1]]
                )
                features.append(angle)
        
        # Angles between fingers at MCP level
        mcps = [5, 9, 13, 17]  # Index, Middle, Ring, Pinky MCPs
        for i in range(len(mcps) - 1):
            angle = self._calculate_angle(
                landmarks[mcps[i]],
                landmarks[0],  # Wrist
                landmarks[mcps[i + 1]]
            )
            features.append(angle)
        
        return np.array(features, dtype=np.float32)
    
    def _distance_3d(self, point1: Dict, point2: Dict) -> float:
        """Calculate 3D Euclidean distance between two points"""
        return np.sqrt(
            (point1['x'] - point2['x']) ** 2 +
            (point1['y'] - point2['y']) ** 2 +
            (point1['z'] - point2['z']) ** 2
        )
    
    def _distance_2d(self, point1: Dict, point2: Dict) -> float:
        """Calculate 2D Euclidean distance between two points"""
        return np.sqrt(
            (point1['x'] - point2['x']) ** 2 +
            (point1['y'] - point2['y']) ** 2
        )
    
    def _calculate_palm_center(self, landmarks: List[Dict]) -> Dict:
        """Calculate the center of the palm"""
        # Use MCP joints for palm center
        mcps = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]]
        
        avg_x = np.mean([lm['x'] for lm in mcps])
        avg_y = np.mean([lm['y'] for lm in mcps])
        avg_z = np.mean([lm['z'] for lm in mcps])
        
        return {'x': avg_x, 'y': avg_y, 'z': avg_z}
    
    def _calculate_angle(self, point1: Dict, vertex: Dict, point2: Dict) -> float:
        """
        Calculate angle at vertex between point1-vertex-point2
        
        Returns angle in radians
        """
        # Create vectors
        v1 = np.array([point1['x'] - vertex['x'], point1['y'] - vertex['y']])
        v2 = np.array([point2['x'] - vertex['x'], point2['y'] - vertex['y']])
        
        # Calculate angle
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
        
        return angle
    
    def get_feature_names(self) -> List[str]:
        """Get names of features"""
        names = []
        
        # Relative features
        landmark_names = [
            'wrist', 'thumb_cmc', 'thumb_mcp', 'thumb_ip', 'thumb_tip',
            'index_mcp', 'index_pip', 'index_dip', 'index_tip',
            'middle_mcp', 'middle_pip', 'middle_dip', 'middle_tip',
            'ring_mcp', 'ring_pip', 'ring_dip', 'ring_tip',
            'pinky_mcp', 'pinky_pip', 'pinky_dip', 'pinky_tip'
        ]
        
        for name in landmark_names:
            names.extend([f'{name}_x', f'{name}_y', f'{name}_z'])
        
        return names


def preprocess_image_for_extraction(image):
    """
    Preprocess image before feature extraction
    
    Args:
        image: Input image (numpy array)
        
    Returns:
        Preprocessed image
    """
    import cv2
    
    # Resize to standard size
    image = cv2.resize(image, (224, 224))
    
    # Normalize pixel values
    image = image.astype(np.float32) / 255.0
    
    return image
