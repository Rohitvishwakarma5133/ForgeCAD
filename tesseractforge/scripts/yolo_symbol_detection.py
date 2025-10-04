import cv2
import numpy as np
from ultralytics import YOLO
import os
from pathlib import Path
import matplotlib.pyplot as plt

class SymbolDetector:
    def __init__(self):
        """
        Initialize YOLO model for symbol detection
        Note: This will download YOLOv8 model on first use
        """
        try:
            # Load YOLOv8 model (starts with general object detection)
            self.model = YOLO('yolov8n.pt')  # nano version for speed
            print("✅ YOLOv8 model loaded successfully!")
            self.model_loaded = True
        except Exception as e:
            print(f"⚠️ Could not load YOLO model: {e}")
            self.model_loaded = False
    
    def detect_general_objects(self, image_path, confidence_threshold=0.3):
        """
        Detect general objects that might be relevant in engineering drawings
        """
        if not self.model_loaded:
            return {"error": "YOLO model not loaded"}
        
        try:
            # Run inference
            results = self.model(image_path, conf=confidence_threshold)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for i, box in enumerate(boxes):
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.model.names[class_id]
                        
                        detections.append({
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'confidence': float(confidence),
                            'class': class_name,
                            'class_id': class_id
                        })
            
            return {
                'total_detections': len(detections),
                'detections': detections,
                'image_shape': results[0].orig_shape if results else None
            }
            
        except Exception as e:
            return {"error": f"Detection failed: {str(e)}"}
    
    def detect_geometric_shapes(self, image_path):
        """Use OpenCV to detect basic geometric shapes in engineering drawings"""
        img = cv2.imread(image_path)
        if img is None:
            return {"error": f"Could not load image: {image_path}"}
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply Canny edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        shapes = []
        for i, contour in enumerate(contours):
            # Calculate area and filter small contours
            area = cv2.contourArea(contour)
            if area < 100:  # Skip very small shapes
                continue
            
            # Approximate contour to polygon
            epsilon = 0.04 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Classify shape based on number of vertices
            vertices = len(approx)
            shape_type = "unknown"
            
            if vertices == 3:
                shape_type = "triangle"
            elif vertices == 4:
                # Check if it's a rectangle or square
                aspect_ratio = w / h
                if 0.95 <= aspect_ratio <= 1.05:
                    shape_type = "square"
                else:
                    shape_type = "rectangle"
            elif vertices > 4:
                # Check if it's circular
                area_contour = cv2.contourArea(contour)
                area_hull = cv2.contourArea(cv2.convexHull(contour))
                if area_hull > 0:
                    solidity = area_contour / area_hull
                    if solidity > 0.8:
                        shape_type = "circle"
                    else:
                        shape_type = "polygon"
            
            shapes.append({
                'shape_type': shape_type,
                'vertices': vertices,
                'bbox': [x, y, x + w, y + h],
                'area': area,
                'aspect_ratio': w / h,
                'centroid': [int(x + w/2), int(y + h/2)]
            })
        
        return {
            'total_shapes': len(shapes),
            'shapes': shapes
        }
    
    def detect_lines_and_dimensions(self, image_path):
        """Detect lines and potential dimension markers"""
        img = cv2.imread(image_path)
        if img is None:
            return {"error": f"Could not load image: {image_path}"}
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        
        # Detect lines using HoughLinesP
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, 
                               minLineLength=50, maxLineGap=10)
        
        detected_lines = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                
                detected_lines.append({
                    'start_point': [int(x1), int(y1)],
                    'end_point': [int(x2), int(y2)],
                    'length': float(length),
                    'angle': float(angle)
                })
        
        return {
            'total_lines': len(detected_lines),
            'lines': detected_lines
        }
    
    def create_annotated_image(self, image_path, detections, output_path=None):
        """Create an annotated image with detected symbols and shapes"""
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        # Draw YOLO detections
        if 'detections' in detections.get('yolo', {}):
            for detection in detections['yolo']['detections']:
                x1, y1, x2, y2 = detection['bbox']
                confidence = detection['confidence']
                class_name = detection['class']
                
                # Draw bounding box
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Draw label
                label = f"{class_name}: {confidence:.2f}"
                cv2.putText(img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.5, (0, 255, 0), 2)
        
        # Draw geometric shapes
        if 'shapes' in detections.get('shapes', {}):
            for shape in detections['shapes']['shapes']:
                x1, y1, x2, y2 = shape['bbox']
                shape_type = shape['shape_type']
                
                # Draw bounding box in different color
                cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
                
                # Draw label
                label = f"{shape_type}"
                cv2.putText(img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.5, (255, 0, 0), 2)
        
        # Draw lines
        if 'lines' in detections.get('lines', {}):
            for line in detections['lines']['lines'][:20]:  # Limit to 20 lines
                start = tuple(line['start_point'])
                end = tuple(line['end_point'])
                cv2.line(img, start, end, (0, 0, 255), 1)
        
        if output_path:
            cv2.imwrite(output_path, img)
            return output_path
        
        return img
    
    def comprehensive_analysis(self, image_path):
        """Run all detection methods on an image"""
        print(f"🔍 Analyzing: {image_path}")
        
        if not os.path.exists(image_path):
            return {"error": f"File not found: {image_path}"}
        
        results = {}
        
        # YOLO object detection
        print("  🤖 Running YOLO detection...")
        results['yolo'] = self.detect_general_objects(image_path)
        
        # Geometric shape detection
        print("  🔷 Detecting geometric shapes...")
        results['shapes'] = self.detect_geometric_shapes(image_path)
        
        # Line detection
        print("  📏 Detecting lines...")
        results['lines'] = self.detect_lines_and_dimensions(image_path)
        
        # Create annotated image
        annotated_path = image_path.replace('.', '_annotated.')
        results['annotated_image'] = self.create_annotated_image(
            image_path, results, annotated_path
        )
        
        return results

def test_symbol_detection():
    """Test the symbol detection functionality"""
    detector = SymbolDetector()
    
    # Test images
    test_images = [
        "sample_drawing.png",
        "engineering_diagram.jpg",
        "technical_sketch.png",
        "sample_engineering_text.png"  # From the handwriting script
    ]
    
    print("🚀 Testing Symbol Detection")
    print("=" * 50)
    
    for image_path in test_images:
        if os.path.exists(image_path):
            results = detector.comprehensive_analysis(image_path)
            
            print(f"\n📊 Results for {image_path}:")
            print("-" * 30)
            
            # YOLO results
            if 'error' not in results.get('yolo', {}):
                yolo_count = results['yolo'].get('total_detections', 0)
                print(f"  🤖 YOLO Objects: {yolo_count}")
                if yolo_count > 0:
                    for det in results['yolo']['detections'][:3]:  # Show first 3
                        print(f"     - {det['class']}: {det['confidence']:.2f}")
            
            # Shape results
            if 'error' not in results.get('shapes', {}):
                shape_count = results['shapes'].get('total_shapes', 0)
                print(f"  🔷 Shapes: {shape_count}")
                if shape_count > 0:
                    shape_types = {}
                    for shape in results['shapes']['shapes']:
                        shape_type = shape['shape_type']
                        shape_types[shape_type] = shape_types.get(shape_type, 0) + 1
                    for shape_type, count in shape_types.items():
                        print(f"     - {shape_type}: {count}")
            
            # Line results
            if 'error' not in results.get('lines', {}):
                line_count = results['lines'].get('total_lines', 0)
                print(f"  📏 Lines: {line_count}")
            
            if results.get('annotated_image'):
                print(f"  💾 Annotated image saved: {results['annotated_image']}")
        
        else:
            print(f"⏭️ Skipping {image_path} - file not found")

def create_sample_engineering_drawing():
    """Create a more complex sample drawing with shapes"""
    try:
        # Create a larger white image
        img = np.ones((400, 600, 3), dtype=np.uint8) * 255
        
        # Draw some basic engineering shapes
        # Rectangle
        cv2.rectangle(img, (50, 50), (200, 150), (0, 0, 0), 2)
        
        # Circle
        cv2.circle(img, (350, 100), 50, (0, 0, 0), 2)
        
        # Triangle
        triangle_pts = np.array([[100, 200], [150, 300], [50, 300]], np.int32)
        cv2.polylines(img, [triangle_pts], True, (0, 0, 0), 2)
        
        # Lines for dimensions
        cv2.line(img, (50, 170), (200, 170), (0, 0, 0), 1)
        cv2.line(img, (50, 165), (50, 175), (0, 0, 0), 1)
        cv2.line(img, (200, 165), (200, 175), (0, 0, 0), 1)
        
        # Add some text labels
        cv2.putText(img, '150mm', (100, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
        cv2.putText(img, 'Engineering Drawing', (50, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        
        cv2.imwrite('sample_engineering_drawing.png', img)
        print("✅ Created sample_engineering_drawing.png for testing")
        return True
    except Exception as e:
        print(f"❌ Could not create sample drawing: {e}")
        return False

if __name__ == "__main__":
    # Create sample drawing if needed
    if not any(os.path.exists(f) for f in ["sample_drawing.png", "engineering_diagram.jpg"]):
        print("📝 No test images found. Creating a sample drawing...")
        create_sample_engineering_drawing()
    
    # Run the test
    test_symbol_detection()
