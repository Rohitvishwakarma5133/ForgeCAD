import os
from PIL import Image
import requests
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import cv2
import numpy as np

class HandwritingOCR:
    def __init__(self):
        """
        Initialize TrOCR for handwriting recognition
        Note: This will download the model on first use (can be large ~500MB)
        """
        try:
            # Use the handwritten text recognition model
            self.processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
            self.model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
            self.model_loaded = True
            print("✅ TrOCR model loaded successfully!")
        except Exception as e:
            print(f"⚠️ Could not load TrOCR model: {e}")
            print("This might be due to missing torch. TrOCR features will be disabled.")
            self.model_loaded = False
    
    def preprocess_for_handwriting(self, image_path):
        """
        Preprocess image specifically for handwriting recognition
        """
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply bilateral filter to reduce noise while keeping edges sharp
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Invert if background is dark (handwriting is usually dark on light background)
        if np.mean(thresh) < 127:
            thresh = cv2.bitwise_not(thresh)
        
        return thresh
    
    def extract_handwriting_regions(self, image_path):
        """
        Detect and extract potential handwriting regions
        """
        preprocessed = self.preprocess_for_handwriting(image_path)
        
        # Find contours to identify text regions
        contours, _ = cv2.findContours(preprocessed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by area and aspect ratio
        text_regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = cv2.contourArea(contour)
            aspect_ratio = w / h
            
            # Filter based on size and aspect ratio
            if area > 100 and 0.1 < aspect_ratio < 10:
                # Extract the region
                region = preprocessed[y:y+h, x:x+w]
                text_regions.append({
                    'region': region,
                    'bbox': (x, y, w, h),
                    'area': area
                })
        
        # Sort by area (largest first)
        text_regions.sort(key=lambda x: x['area'], reverse=True)
        return text_regions
    
    def recognize_handwriting_trocr(self, image_path):
        """
        Use TrOCR to recognize handwritten text
        """
        if not self.model_loaded:
            return {"error": "TrOCR model not loaded. Please install torch: pip install torch"}
        
        try:
            # Load and preprocess image
            image = Image.open(image_path)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Process with TrOCR
            pixel_values = self.processor(image, return_tensors="pt").pixel_values
            generated_ids = self.model.generate(pixel_values)
            generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            return {
                'text': generated_text.strip(),
                'confidence': 'N/A',  # TrOCR doesn't provide confidence scores
                'method': 'TrOCR'
            }
            
        except Exception as e:
            return {"error": f"TrOCR processing failed: {str(e)}"}
    
    def recognize_handwriting_regions(self, image_path):
        """
        Extract and recognize text from individual handwriting regions
        """
        if not self.model_loaded:
            return {"error": "TrOCR model not loaded"}
        
        try:
            regions = self.extract_handwriting_regions(image_path)
            results = []
            
            for i, region_data in enumerate(regions[:5]):  # Process top 5 regions
                # Convert region to PIL Image
                region_pil = Image.fromarray(region_data['region']).convert('RGB')
                
                # Process with TrOCR
                pixel_values = self.processor(region_pil, return_tensors="pt").pixel_values
                generated_ids = self.model.generate(pixel_values)
                text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
                
                if text.strip():  # Only add non-empty results
                    results.append({
                        'text': text.strip(),
                        'bbox': region_data['bbox'],
                        'area': region_data['area'],
                        'region_id': i + 1
                    })
            
            return {
                'total_regions': len(regions),
                'processed_regions': len(results),
                'detections': results
            }
            
        except Exception as e:
            return {"error": f"Region processing failed: {str(e)}"}

def test_handwriting_ocr():
    """
    Test function for handwriting OCR
    """
    ocr = HandwritingOCR()
    
    # Test images (you'll need to provide these)
    test_images = [
        "handwritten_notes.png",
        "engineering_sketch.jpg",
        "technical_drawing.png"
    ]
    
    print("🔍 Testing Handwriting OCR...")
    print("=" * 50)
    
    for image_path in test_images:
        if os.path.exists(image_path):
            print(f"\n📄 Processing: {image_path}")
            print("-" * 30)
            
            # Test full image recognition
            result = ocr.recognize_handwriting_trocr(image_path)
            if 'error' not in result:
                print(f"✅ Full Image Text: '{result['text']}'")
            else:
                print(f"❌ Full Image Error: {result['error']}")
            
            # Test region-based recognition
            region_result = ocr.recognize_handwriting_regions(image_path)
            if 'error' not in region_result:
                print(f"📊 Found {region_result['total_regions']} regions, processed {region_result['processed_regions']}")
                for detection in region_result['detections']:
                    print(f"   Region {detection['region_id']}: '{detection['text']}'")
            else:
                print(f"❌ Region Error: {region_result['error']}")
        else:
            print(f"⏭️ Skipping {image_path} - file not found")

def create_sample_handwriting_image():
    """
    Create a simple sample image with text for testing
    """
    try:
        # Create a simple white image with black text
        img = np.ones((200, 400, 3), dtype=np.uint8) * 255
        
        # Add some sample text (this is just for demonstration)
        cv2.putText(img, 'Sample Engineering Drawing', (20, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        cv2.putText(img, 'Dimensions: 150mm x 75mm', (20, 100), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
        cv2.putText(img, 'Material: Steel Grade A', (20, 150), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
        
        cv2.imwrite('sample_engineering_text.png', img)
        print("✅ Created sample_engineering_text.png for testing")
        return True
    except Exception as e:
        print(f"❌ Could not create sample image: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Handwriting OCR for Engineering Drawings")
    print("=" * 50)
    
    # Create a sample image if none exist
    if not any(os.path.exists(f) for f in ["handwritten_notes.png", "engineering_sketch.jpg", "sample_drawing.png"]):
        print("📝 No test images found. Creating a sample image...")
        create_sample_handwriting_image()
    
    # Run the test
    test_handwriting_ocr()