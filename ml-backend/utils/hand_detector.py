"""
Hand Detector Module
Uses MediaPipe to detect hand landmarks in images
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Tuple, Optional, List, Dict, Any


class HandDetector:
    """
    Detect hands and extract landmarks using MediaPipe
    """
    
    def __init__(self, 
                 static_image_mode: bool = True,
                 max_num_hands: int = 1,
                 min_detection_confidence: float = 0.7,
                 min_tracking_confidence: float = 0.5):
        """
        Initialize the hand detector
        
        Args:
            static_image_mode: Whether to treat input as static images
            max_num_hands: Maximum number of hands to detect
            min_detection_confidence: Minimum confidence for detection
            min_tracking_confidence: Minimum confidence for tracking
        """
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        
        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
    
    def detect(self, image: np.ndarray) -> Tuple[bool, Optional[List[Dict]]]:
        """
        Detect hand landmarks in an image
        
        Args:
            image: Input image (BGR format)
            
        Returns:
            Tuple of (hand_detected, landmarks)
            landmarks is a list of 21 landmark dictionaries with x, y, z coordinates
        """
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = self.hands.process(rgb_image)
        
        if not results.multi_hand_landmarks:
            return False, None
        
        # Extract landmarks
        landmarks_list = []
        for hand_landmarks in results.multi_hand_landmarks:
            landmarks = []
            for idx, landmark in enumerate(hand_landmarks.landmark):
                landmarks.append({
                    'id': idx,
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'name': self._get_landmark_name(idx)
                })
            landmarks_list.append(landmarks)
        
        # Return first hand's landmarks
        return True, landmarks_list[0] if landmarks_list else None
    
    def draw_landmarks(self, image: np.ndarray, landmarks: List[Dict]) -> np.ndarray:
        """
        Draw hand landmarks on an image
        
        Args:
            image: Input image
            landmarks: List of landmark dictionaries
            
        Returns:
            Image with drawn landmarks
        """
        # Create a copy of the image
        annotated_image = image.copy()
        
        # Convert landmarks back to MediaPipe format
        hand_landmarks = self.mp_hands.HandLandmark
        landmark_proto = self.mp_hands.Hands._get_hand_landmarks_proto()
        
        for landmark in landmarks:
            landmark_proto.landmark.add(
                x=landmark['x'],
                y=landmark['y'],
                z=landmark['z']
            )
        
        # Draw landmarks
        self.mp_drawing.draw_landmarks(
            annotated_image,
            landmark_proto,
            self.mp_hands.HAND_CONNECTIONS,
            self.mp_drawing.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=4),
            self.mp_drawing.DrawingSpec(color=(250, 44, 250), thickness=2, circle_radius=2)
        )
        
        return annotated_image
    
    def get_bounding_box(self, landmarks: List[Dict], image_shape: Tuple[int, int]) -> Tuple[int, int, int, int]:
        """
        Get bounding box of hand in image coordinates
        
        Args:
            landmarks: List of landmark dictionaries
            image_shape: (height, width) of the image
            
        Returns:
            Tuple of (x_min, y_min, x_max, y_max) in pixel coordinates
        """
        height, width = image_shape[:2]
        
        x_coords = [int(lm['x'] * width) for lm in landmarks]
        y_coords = [int(lm['y'] * height) for lm in landmarks]
        
        padding = 20
        x_min = max(0, min(x_coords) - padding)
        y_min = max(0, min(y_coords) - padding)
        x_max = min(width, max(x_coords) + padding)
        y_max = min(height, max(y_coords) + padding)
        
        return x_min, y_min, x_max, y_max
    
    def _get_landmark_name(self, idx: int) -> str:
        """Get the name of a landmark by its index"""
        landmark_names = [
            'WRIST',
            'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
            'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
            'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
            'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
            'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP'
        ]
        return landmark_names[idx] if idx < len(landmark_names) else f'LANDMARK_{idx}'
    
    def get_finger_states(self, landmarks: List[Dict]) -> Dict[str, bool]:
        """
        Determine if each finger is extended or not
        
        Args:
            landmarks: List of landmark dictionaries
            
        Returns:
            Dictionary with finger names and their extended state
        """
        # Landmark indices for each finger
        finger_tips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
        finger_pips = [3, 6, 10, 14, 18]  # PIP joints
        
        finger_names = ['thumb', 'index', 'middle', 'ring', 'pinky']
        finger_states = {}
        
        for i, (tip, pip, name) in enumerate(zip(finger_tips, finger_pips, finger_names)):
            if i == 0:  # Thumb - check x position
                # Thumb is extended if tip is further from palm than MCP
                finger_states[name] = landmarks[tip]['x'] < landmarks[pip]['x']
            else:  # Other fingers - check y position
                # Finger is extended if tip is above (lower y) than PIP
                finger_states[name] = landmarks[tip]['y'] < landmarks[pip]['y']
        
        return finger_states
    
    def close(self):
        """Release resources"""
        self.hands.close()


# Standalone function for easy import
def detect_hand(image):
    """Convenience function to detect a hand in an image"""
    detector = HandDetector()
    return detector.detect(image)
