#!/usr/bin/env python3
"""
🔥 ENHANCED SYMBOL DETECTION MODULE
===================================

Advanced Computer Vision for Technical Drawing Analysis:
✅ OpenCV-based geometric detection
✅ YOLOv8 object detection
✅ Symbol classification
✅ Dimension extraction
✅ Technical annotation recognition

Optimized for Engineering Drawings & CAD Diagrams
"""

import os
import json
import cv2
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import time
import math

# Deep learning imports
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

class EnhancedSymbolDetector:
    """🔥 Advanced Symbol Detection System"""
    
    def __init__(self, yolo_model_path: Optional[str] = None):
        """Initialize enhanced symbol detection system"""
        print("🚀 INITIALIZING ENHANCED SYMBOL DETECTOR")
        print("=" * 60)
        
        self.yolo_model = None
        self.model_loaded = False
        
        # Initialize YOLO if available
        if YOLO_AVAILABLE and yolo_model_path and os.path.exists(yolo_model_path):
            try:
                self.yolo_model = YOLO(yolo_model_path)
                self.model_loaded = True
                print(f"✅ YOLOv8 Model loaded: {yolo_model_path}")
            except Exception as e:
                print(f"⚠️ YOLOv8 failed to load: {e}")
        elif YOLO_AVAILABLE:
            try:
                # Try to load a default YOLO model
                self.yolo_model = YOLO('yolov8n.pt')  # Nano model for faster inference
                self.model_loaded = True
                print("✅ YOLOv8 Nano model loaded (default)")
            except Exception as e:
                print(f"⚠️ Default YOLOv8 failed: {e}")
        else:
            print("⚠️ YOLOv8 not available - using OpenCV only")
        
        # Symbol classification patterns
        self.symbol_patterns = {
            'circle': {'min_area': 100, 'circularity_thresh': 0.7},
            'rectangle': {'aspect_ratio_range': (0.2, 5.0)},
            'triangle': {'vertices': 3, 'area_thresh': 50},
            'line': {'length_thresh': 20, 'thickness_thresh': 5},
            'arrow': {'aspect_ratio': 2.0, 'area_range': (50, 1000)},
            'dimension': {'text_nearby': True, 'line_length': 30}
        }
        
        print("🎯 SYMBOL DETECTOR READY!")
        print("=" * 60)
    
    def preprocess_image(self, image: np.ndarray) -> Dict[str, np.ndarray]:
        """Preprocess image for optimal symbol detection"""
        try:
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Apply different preprocessing techniques
            processed = {}
            
            # 1. Basic denoising
            processed['denoised'] = cv2.fastNlMeansDenoising(gray)
            
            # 2. Edge detection
            processed['edges'] = cv2.Canny(processed['denoised'], 50, 150)
            
            # 3. Morphological operations
            kernel = np.ones((3,3), np.uint8)
            processed['morph'] = cv2.morphologyEx(processed['edges'], cv2.MORPH_CLOSE, kernel)
            
            # 4. Adaptive thresholding
            processed['adaptive'] = cv2.adaptiveThreshold(
                processed['denoised'], 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # 5. Binary thresholding
            _, processed['binary'] = cv2.threshold(processed['denoised'], 0, 255, 
                                                   cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            return processed
            
        except Exception as e:
            print(f"⚠️ Preprocessing failed: {e}")
            return {'original': gray if len(image.shape) == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)}
    
    def detect_geometric_shapes(self, processed_images: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """Detect basic geometric shapes using OpenCV"""
        try:
            shapes_detected = {
                'circles': [],
                'rectangles': [],
                'triangles': [],
                'polygons': [],
                'lines': [],
                'total_shapes': 0
            }
            
            # Use the best preprocessed image
            binary_img = processed_images.get('binary', processed_images.get('adaptive', 
                                            processed_images.get('original')))
            
            # Find contours
            contours, _ = cv2.findContours(binary_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                # Filter small contours
                area = cv2.contourArea(contour)
                if area < 50:  # Minimum area threshold
                    continue
                
                # Approximate contour to polygon
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # Classify shape based on number of vertices and other properties
                shape_info = self._classify_shape(contour, approx, area)
                
                if shape_info:
                    shapes_detected[shape_info['type']].append(shape_info)
                    shapes_detected['total_shapes'] += 1
            
            # Detect lines using Hough transform
            edges = processed_images.get('edges', processed_images.get('original'))
            lines = self._detect_lines(edges)
            shapes_detected['lines'] = lines
            shapes_detected['total_shapes'] += len(lines)
            
            # Detect circles using Hough Circle Transform
            circles = self._detect_circles(processed_images.get('denoised', processed_images.get('original')))
            shapes_detected['circles'].extend(circles)
            shapes_detected['total_shapes'] += len(circles)
            
            return shapes_detected
            
        except Exception as e:
            print(f"❌ Geometric shape detection failed: {e}")
            return {'error': str(e), 'total_shapes': 0}
    
    def _classify_shape(self, contour, approx, area) -> Optional[Dict[str, Any]]:
        """Classify individual shapes based on contour properties"""
        try:
            vertices = len(approx)
            
            # Calculate shape properties
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = float(w) / h
            extent = float(area) / (w * h)
            
            # Calculate circularity
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * (area / (perimeter * perimeter))
            else:
                circularity = 0
            
            shape_data = {
                'vertices': vertices,
                'area': area,
                'perimeter': perimeter,
                'aspect_ratio': aspect_ratio,
                'extent': extent,
                'circularity': circularity,
                'bounding_box': (x, y, w, h),
                'centroid': (x + w//2, y + h//2)
            }
            
            # Classify based on properties
            if vertices == 3:
                shape_data['type'] = 'triangles'
                shape_data['shape'] = 'triangle'
            elif vertices == 4:
                shape_data['type'] = 'rectangles'
                if 0.95 <= aspect_ratio <= 1.05:
                    shape_data['shape'] = 'square'
                else:
                    shape_data['shape'] = 'rectangle'
            elif vertices > 4:
                shape_data['type'] = 'polygons'
                shape_data['shape'] = f'{vertices}-gon'
            else:
                # Could be circle or irregular shape
                if circularity > 0.7:
                    shape_data['type'] = 'circles'
                    shape_data['shape'] = 'circle'
                else:
                    shape_data['type'] = 'polygons'
                    shape_data['shape'] = 'irregular'
            
            return shape_data
            
        except Exception as e:
            print(f"⚠️ Shape classification failed: {e}")
            return None
    
    def _detect_lines(self, edges: np.ndarray) -> List[Dict[str, Any]]:
        """Detect lines using Hough Line Transform"""
        try:
            lines_data = []
            
            # Detect lines
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, 
                                   minLineLength=30, maxLineGap=10)
            
            if lines is not None:
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    
                    # Calculate line properties
                    length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                    angle = np.arctan2(y2-y1, x2-x1) * 180 / np.pi
                    
                    # Classify line orientation
                    if abs(angle) < 10 or abs(angle) > 170:
                        orientation = 'horizontal'
                    elif 80 < abs(angle) < 100:
                        orientation = 'vertical'
                    else:
                        orientation = 'diagonal'
                    
                    lines_data.append({
                        'start': (x1, y1),
                        'end': (x2, y2),
                        'length': length,
                        'angle': angle,
                        'orientation': orientation,
                        'type': 'line'
                    })
            
            return lines_data
            
        except Exception as e:
            print(f"⚠️ Line detection failed: {e}")
            return []
    
    def _detect_circles(self, gray_image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect circles using Hough Circle Transform"""
        try:
            circles_data = []
            
            # Detect circles
            circles = cv2.HoughCircles(gray_image, cv2.HOUGH_GRADIENT, dp=1, minDist=20,
                                      param1=50, param2=30, minRadius=5, maxRadius=100)
            
            if circles is not None:
                circles = np.round(circles[0, :]).astype("int")
                
                for (x, y, r) in circles:
                    circles_data.append({
                        'center': (x, y),
                        'radius': r,
                        'diameter': 2*r,
                        'area': np.pi * r * r,
                        'circumference': 2 * np.pi * r,
                        'type': 'circle',
                        'shape': 'circle'
                    })
            
            return circles_data
            
        except Exception as e:
            print(f"⚠️ Circle detection failed: {e}")
            return []
    
    def detect_with_yolo(self, image: np.ndarray) -> Dict[str, Any]:
        """Detect objects using YOLOv8 model"""
        if not self.model_loaded or self.yolo_model is None:
            return {'error': 'YOLO model not available', 'detections': []}
        
        try:
            start_time = time.time()
            
            # Run YOLO inference
            results = self.yolo_model(image, verbose=False)
            
            processing_time = time.time() - start_time
            
            detections = []
            
            # Process results
            for result in results:
                boxes = result.boxes
                
                if boxes is not None:
                    for box in boxes:
                        # Extract box data
                        conf = float(box.conf.cpu().numpy())
                        cls = int(box.cls.cpu().numpy())
                        xyxy = box.xyxy.cpu().numpy().flatten()
                        
                        # Get class name
                        class_name = self.yolo_model.names.get(cls, f'class_{cls}')
                        
                        # Calculate center and dimensions
                        x1, y1, x2, y2 = xyxy
                        center_x = (x1 + x2) / 2
                        center_y = (y1 + y2) / 2
                        width = x2 - x1
                        height = y2 - y1
                        area = width * height
                        
                        detections.append({
                            'class': class_name,
                            'confidence': conf,
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'center': (center_x, center_y),
                            'dimensions': (width, height),
                            'area': area
                        })
            
            return {
                'status': 'success',
                'processing_time': processing_time,
                'total_detections': len(detections),
                'detections': detections,
                'model_info': {
                    'name': 'YOLOv8',
                    'classes': len(self.yolo_model.names) if self.yolo_model.names else 0
                }
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'detections': []
            }
    
    def detect_dimensions_and_annotations(self, image: np.ndarray, text_data: List[str] = None) -> Dict[str, Any]:
        """Detect dimension lines and technical annotations"""
        try:
            annotations = {
                'dimension_lines': [],
                'arrows': [],
                'text_annotations': [],
                'measurement_indicators': []
            }
            
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            # Detect dimension lines (typically thin, straight lines)
            edges = cv2.Canny(gray, 50, 150)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=30, 
                                   minLineLength=40, maxLineGap=5)
            
            if lines is not None:
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                    
                    # Check if this could be a dimension line
                    if length > 40:  # Minimum length for dimension lines
                        annotations['dimension_lines'].append({
                            'start': (x1, y1),
                            'end': (x2, y2),
                            'length': length,
                            'type': 'dimension_line'
                        })
            
            # Detect arrows (simplified detection)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if 20 < area < 200:  # Arrow size range
                    # Check if contour has arrow-like properties
                    hull = cv2.convexHull(contour)
                    hull_area = cv2.contourArea(hull)
                    
                    if hull_area > 0:
                        solidity = float(area) / hull_area
                        
                        # Arrows typically have lower solidity due to their shape
                        if 0.4 < solidity < 0.8:
                            x, y, w, h = cv2.boundingRect(contour)
                            aspect_ratio = float(w) / h
                            
                            # Arrow-like aspect ratio
                            if 1.5 < aspect_ratio < 4.0:
                                annotations['arrows'].append({
                                    'bbox': (x, y, w, h),
                                    'center': (x + w//2, y + h//2),
                                    'area': area,
                                    'aspect_ratio': aspect_ratio,
                                    'type': 'arrow'
                                })
            
            # Correlate text data with detected elements if provided
            if text_data:
                dimension_patterns = ['mm', 'cm', 'm', 'in', 'ft', '±', '°', 'Ø', '∅']
                
                for text in text_data:
                    if any(pattern in text.lower() for pattern in dimension_patterns):
                        annotations['text_annotations'].append({
                            'text': text,
                            'type': 'dimension_text',
                            'contains_measurement': True
                        })
                    else:
                        annotations['text_annotations'].append({
                            'text': text,
                            'type': 'general_annotation',
                            'contains_measurement': False
                        })
            
            # Calculate summary
            annotations['summary'] = {
                'total_dimension_lines': len(annotations['dimension_lines']),
                'total_arrows': len(annotations['arrows']),
                'total_text_annotations': len(annotations['text_annotations']),
                'has_measurements': any(ann.get('contains_measurement', False) 
                                      for ann in annotations['text_annotations'])
            }
            
            return annotations
            
        except Exception as e:
            return {'error': str(e), 'summary': {'total_elements': 0}}
    
    def comprehensive_symbol_analysis(self, image_path: str, text_data: Optional[List[str]] = None) -> Dict[str, Any]:
        """🔥 COMPREHENSIVE SYMBOL ANALYSIS"""
        print(f"🔍 COMPREHENSIVE SYMBOL ANALYSIS: {os.path.basename(image_path)}")
        print("=" * 60)
        
        start_time = time.time()
        
        try:
            # Load image
            if isinstance(image_path, str):
                image = cv2.imread(image_path)
                if image is None:
                    return {'error': f'Could not load image: {image_path}'}
            else:
                image = image_path  # Assume it's already a numpy array
            
            results = {
                'image_path': image_path if isinstance(image_path, str) else 'array_input',
                'timestamp': datetime.now().isoformat(),
                'analysis_results': {},
                'performance': {}
            }
            
            # Step 1: Preprocess image
            print("🔧 Preprocessing image...")
            preprocessed = self.preprocess_image(image)
            
            # Step 2: Detect geometric shapes
            print("🔷 Detecting geometric shapes...")
            geometric_shapes = self.detect_geometric_shapes(preprocessed)
            results['analysis_results']['geometric_shapes'] = geometric_shapes
            
            if geometric_shapes.get('total_shapes', 0) > 0:
                print(f"   ✅ Found {geometric_shapes['total_shapes']} geometric elements")
            else:
                print("   ⚠️ No geometric shapes detected")
            
            # Step 3: YOLO object detection
            print("🤖 Running YOLO object detection...")
            yolo_results = self.detect_with_yolo(image)
            results['analysis_results']['yolo_detection'] = yolo_results
            
            if yolo_results.get('status') == 'success':
                detections = yolo_results.get('total_detections', 0)
                print(f"   ✅ YOLO detected {detections} objects")
            else:
                print(f"   ❌ YOLO failed: {yolo_results.get('error', 'Unknown error')}")
            
            # Step 4: Detect dimensions and annotations
            print("📏 Analyzing dimensions and annotations...")
            annotations = self.detect_dimensions_and_annotations(image, text_data)
            results['analysis_results']['annotations'] = annotations
            
            if annotations.get('summary', {}).get('total_dimension_lines', 0) > 0:
                dims = annotations['summary']['total_dimension_lines']
                arrows = annotations['summary']['total_arrows']
                print(f"   ✅ Found {dims} dimension lines, {arrows} arrows")
            else:
                print("   ⚠️ No dimension lines detected")
            
            # Calculate performance metrics
            total_time = time.time() - start_time
            
            # Compile comprehensive summary
            total_elements = (
                geometric_shapes.get('total_shapes', 0) +
                yolo_results.get('total_detections', 0) +
                annotations.get('summary', {}).get('total_dimension_lines', 0) +
                annotations.get('summary', {}).get('total_arrows', 0)
            )
            
            results['performance'] = {
                'processing_time': total_time,
                'total_elements_detected': total_elements,
                'geometric_shapes': geometric_shapes.get('total_shapes', 0),
                'yolo_objects': yolo_results.get('total_detections', 0),
                'dimension_lines': annotations.get('summary', {}).get('total_dimension_lines', 0),
                'arrows': annotations.get('summary', {}).get('total_arrows', 0)
            }
            
            # Generate insight summary
            results['insights'] = self._generate_insights(results['analysis_results'])
            
            print("🎉 COMPREHENSIVE SYMBOL ANALYSIS COMPLETE!")
            print(f"⚡ Processing Time: {total_time:.2f}s")
            print(f"🔍 Total Elements: {total_elements}")
            print("=" * 60)
            
            return results
            
        except Exception as e:
            return {
                'error': str(e),
                'processing_time': time.time() - start_time,
                'status': 'failed'
            }
    
    def _generate_insights(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate intelligent insights from symbol analysis"""
        insights = {
            'drawing_complexity': 'unknown',
            'drawing_type': 'technical_drawing',
            'key_features': [],
            'recommendations': []
        }
        
        try:
            geometric = analysis_results.get('geometric_shapes', {})
            yolo = analysis_results.get('yolo_detection', {})
            annotations = analysis_results.get('annotations', {})
            
            # Analyze complexity
            total_elements = (
                geometric.get('total_shapes', 0) +
                yolo.get('total_detections', 0) +
                annotations.get('summary', {}).get('total_dimension_lines', 0)
            )
            
            if total_elements > 50:
                insights['drawing_complexity'] = 'high'
            elif total_elements > 20:
                insights['drawing_complexity'] = 'medium'
            elif total_elements > 5:
                insights['drawing_complexity'] = 'low'
            else:
                insights['drawing_complexity'] = 'minimal'
            
            # Identify key features
            if geometric.get('circles'):
                insights['key_features'].append('circular_elements')
            if geometric.get('rectangles'):
                insights['key_features'].append('rectangular_structures')
            if len(geometric.get('lines', [])) > 10:
                insights['key_features'].append('line_heavy_design')
            if annotations.get('summary', {}).get('total_dimension_lines', 0) > 0:
                insights['key_features'].append('dimensioned_drawing')
            if annotations.get('summary', {}).get('has_measurements', False):
                insights['key_features'].append('measurement_annotations')
            
            # Generate recommendations
            if total_elements == 0:
                insights['recommendations'].append('Consider image preprocessing or different detection parameters')
            elif annotations.get('summary', {}).get('total_dimension_lines', 0) == 0:
                insights['recommendations'].append('May need dimension line detection tuning')
            if yolo.get('status') != 'success':
                insights['recommendations'].append('YOLO model optimization could improve object detection')
            
            return insights
            
        except Exception as e:
            insights['error'] = str(e)
            return insights
    
    def visualize_detections(self, image_path: str, analysis_results: Dict[str, Any], 
                           output_path: Optional[str] = None) -> str:
        """Create visualization of detected symbols and shapes"""
        try:
            # Load original image
            image = cv2.imread(image_path)
            if image is None:
                return f"Error: Could not load image {image_path}"
            
            # Draw geometric shapes
            geometric = analysis_results.get('analysis_results', {}).get('geometric_shapes', {})
            
            # Draw rectangles
            for rect in geometric.get('rectangles', []):
                bbox = rect.get('bounding_box', (0, 0, 0, 0))
                cv2.rectangle(image, (bbox[0], bbox[1]), (bbox[0] + bbox[2], bbox[1] + bbox[3]), 
                             (0, 255, 0), 2)
                cv2.putText(image, 'Rectangle', (bbox[0], bbox[1] - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            # Draw circles
            for circle in geometric.get('circles', []):
                if 'center' in circle and 'radius' in circle:
                    center = tuple(map(int, circle['center']))
                    radius = int(circle['radius'])
                    cv2.circle(image, center, radius, (255, 0, 0), 2)
                    cv2.putText(image, 'Circle', (center[0] - 20, center[1] - radius - 10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
            
            # Draw lines
            for line in geometric.get('lines', []):
                start = tuple(map(int, line['start']))
                end = tuple(map(int, line['end']))
                cv2.line(image, start, end, (0, 0, 255), 2)
            
            # Draw YOLO detections
            yolo = analysis_results.get('analysis_results', {}).get('yolo_detection', {})
            for detection in yolo.get('detections', []):
                bbox = detection['bbox']
                class_name = detection['class']
                conf = detection['confidence']
                
                cv2.rectangle(image, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (255, 255, 0), 2)
                label = f"{class_name}: {conf:.2f}"
                cv2.putText(image, label, (bbox[0], bbox[1] - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            
            # Draw dimension lines
            annotations = analysis_results.get('analysis_results', {}).get('annotations', {})
            for dim_line in annotations.get('dimension_lines', []):
                start = tuple(map(int, dim_line['start']))
                end = tuple(map(int, dim_line['end']))
                cv2.line(image, start, end, (0, 255, 255), 1)
            
            # Draw arrows
            for arrow in annotations.get('arrows', []):
                bbox = arrow['bbox']
                cv2.rectangle(image, (bbox[0], bbox[1]), (bbox[0] + bbox[2], bbox[1] + bbox[3]), 
                             (255, 0, 255), 2)
            
            # Save visualization
            if output_path is None:
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                output_path = f"{base_name}_symbol_detection.jpg"
            
            cv2.imwrite(output_path, image)
            return output_path
            
        except Exception as e:
            return f"Visualization error: {str(e)}"


# Helper function for easy usage
def analyze_technical_drawing(image_path: str, yolo_model_path: Optional[str] = None) -> Dict[str, Any]:
    """Helper function to analyze technical drawing symbols"""
    detector = EnhancedSymbolDetector(yolo_model_path)
    return detector.comprehensive_symbol_analysis(image_path)


if __name__ == "__main__":
    # Demo usage
    print("🔥 ENHANCED SYMBOL DETECTION DEMO")
    
    detector = EnhancedSymbolDetector()
    
    # Test with sample image
    test_image = "../sample_images/sample_engineering_drawing.png"
    
    if os.path.exists(test_image):
        results = detector.comprehensive_symbol_analysis(test_image)
        
        # Print summary
        print("\n📊 DETECTION SUMMARY:")
        print("=" * 40)
        perf = results.get('performance', {})
        print(f"⚡ Processing Time: {perf.get('processing_time', 0):.2f}s")
        print(f"🔍 Total Elements: {perf.get('total_elements_detected', 0)}")
        print(f"🔷 Geometric Shapes: {perf.get('geometric_shapes', 0)}")
        print(f"🤖 YOLO Objects: {perf.get('yolo_objects', 0)}")
        print(f"📏 Dimension Lines: {perf.get('dimension_lines', 0)}")
        
        # Create visualization
        vis_path = detector.visualize_detections(test_image, results)
        print(f"🎨 Visualization saved: {vis_path}")
    else:
        print(f"❌ Test image not found: {test_image}")