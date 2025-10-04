import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
import os

# Configure Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

class EngineeringOCR:
    def __init__(self):
        self.tesseract_config = '--oem 3 --psm 6'
        
    def preprocess_image(self, image_path, output_path=None):
        """
        Preprocess image for better OCR accuracy on engineering drawings
        """
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding for better text detection
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Morphological operations to clean up the image
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
        
        # Save preprocessed image if path provided
        if output_path:
            cv2.imwrite(output_path, cleaned)
            
        return cleaned
    
    def extract_text_tesseract(self, image_path, preprocess=True):
        """
        Extract printed text using Tesseract OCR
        """
        if preprocess:
            # Preprocess the image
            processed_img = self.preprocess_image(image_path)
            # Convert back to PIL Image for Tesseract
            pil_img = Image.fromarray(processed_img)
        else:
            pil_img = Image.open(image_path)
        
        # Extract text
        text = pytesseract.image_to_string(pil_img, config=self.tesseract_config)
        
        # Also get bounding boxes for detected text
        data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
        
        return {
            'text': text.strip(),
            'bounding_boxes': self._extract_bounding_boxes(data)
        }
    
    def _extract_bounding_boxes(self, data):
        """Extract bounding boxes from Tesseract data"""
        boxes = []
        n_boxes = len(data['text'])
        
        for i in range(n_boxes):
            if int(data['conf'][i]) > 30:  # Only include confident detections
                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                text = data['text'][i].strip()
                if text:  # Only add non-empty text
                    boxes.append({
                        'text': text,
                        'bbox': (x, y, x + w, y + h),
                        'confidence': data['conf'][i]
                    })
        return boxes
    
    def enhance_image_quality(self, image_path):
        """
        Enhance image quality using PIL
        """
        img = Image.open(image_path)
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(2.0)
        
        # Apply unsharp mask filter
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        
        return img
    
    def process_engineering_drawing(self, image_path):
        """
        Complete processing pipeline for engineering drawings
        """
        print(f"Processing: {image_path}")
        
        if not os.path.exists(image_path):
            return {"error": f"File not found: {image_path}"}
        
        try:
            # Extract text with preprocessing
            result = self.extract_text_tesseract(image_path, preprocess=True)
            
            # Save preprocessed image for inspection
            preprocessed_path = image_path.replace('.', '_preprocessed.')
            self.preprocess_image(image_path, preprocessed_path)
            
            return {
                'original_image': image_path,
                'preprocessed_image': preprocessed_path,
                'extracted_text': result['text'],
                'bounding_boxes': result['bounding_boxes'],
                'total_detections': len(result['bounding_boxes'])
            }
            
        except Exception as e:
            return {"error": str(e)}

def main():
    """Test the OCR functionality"""
    ocr = EngineeringOCR()
    
    # Test with sample image (you'll need to provide this)
    test_images = [
        "sample_drawing.png",
        "engineering_diagram.jpg",
        "technical_sketch.png"
    ]
    
    for image_path in test_images:
        if os.path.exists(image_path):
            result = ocr.process_engineering_drawing(image_path)
            
            print(f"\n{'='*50}")
            print(f"Results for: {image_path}")
            print(f"{'='*50}")
            
            if 'error' in result:
                print(f"Error: {result['error']}")
            else:
                print(f"Total text detections: {result['total_detections']}")
                print(f"\nExtracted Text:")
                print("-" * 30)
                print(result['extracted_text'])
                
                if result['bounding_boxes']:
                    print(f"\nDetailed Detections:")
                    print("-" * 30)
                    for i, box in enumerate(result['bounding_boxes'][:5]):  # Show first 5
                        print(f"{i+1}. '{box['text']}' (confidence: {box['confidence']})")
        else:
            print(f"Skipping {image_path} - file not found")

if __name__ == "__main__":
    main()