import os
import json
from datetime import datetime
from pathlib import Path

# Import our custom modules
from enhanced_ocr import EngineeringOCR
from trocr_handwriting import HandwritingOCR
from yolo_symbol_detection import SymbolDetector

# Also support Google Cloud Vision API
try:
    from google.cloud import vision
    GOOGLE_VISION_AVAILABLE = True
except ImportError:
    GOOGLE_VISION_AVAILABLE = False

class ComprehensiveEngineeringOCR:
    def __init__(self, use_google_vision=False, google_api_key=None):
        """
        Initialize comprehensive OCR pipeline for engineering drawings
        
        Args:
            use_google_vision: Whether to use Google Cloud Vision API
            google_api_key: Google Cloud Vision API key
        """
        print("🚀 Initializing Comprehensive Engineering OCR Pipeline")
        print("=" * 60)
        
        # Initialize all OCR engines
        self.tesseract_ocr = EngineeringOCR()
        print("✅ Tesseract OCR initialized")
        
        self.handwriting_ocr = HandwritingOCR()
        if self.handwriting_ocr.model_loaded:
            print("✅ TrOCR handwriting recognition initialized")
        else:
            print("⚠️ TrOCR not available (missing dependencies)")
        
        self.symbol_detector = SymbolDetector()
        if self.symbol_detector.model_loaded:
            print("✅ YOLOv8 symbol detection initialized")
        else:
            print("⚠️ YOLOv8 not available")
        
        # Google Cloud Vision setup
        self.use_google_vision = use_google_vision and GOOGLE_VISION_AVAILABLE
        if self.use_google_vision and google_api_key:
            os.environ['GOOGLE_API_KEY'] = google_api_key
            print("✅ Google Cloud Vision API configured")
        elif use_google_vision:
            print("⚠️ Google Cloud Vision requested but not properly configured")
        
        print("-" * 60)
    
    def analyze_with_google_vision(self, image_path):
        """Use Google Cloud Vision API for OCR"""
        if not self.use_google_vision:
            return {"error": "Google Vision not configured"}
        
        try:
            import requests
            import base64
            
            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_content = base64.b64encode(image_file.read()).decode('utf-8')
            
            # API request
            api_key = os.environ.get('GOOGLE_API_KEY')
            url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
            
            payload = {
                "requests": [
                    {
                        "image": {"content": image_content},
                        "features": [
                            {"type": "TEXT_DETECTION"},
                            {"type": "DOCUMENT_TEXT_DETECTION"}
                        ]
                    }
                ]
            }
            
            response = requests.post(url, json=payload)
            result = response.json()
            
            if 'responses' in result and result['responses']:
                text_annotations = result['responses'][0].get('textAnnotations', [])
                if text_annotations:
                    full_text = text_annotations[0]['description']
                    return {
                        'text': full_text,
                        'method': 'Google Cloud Vision',
                        'confidence': 'High',
                        'total_detections': len(text_annotations) - 1  # First is full text
                    }
            
            return {"error": "No text detected by Google Vision"}
            
        except Exception as e:
            return {"error": f"Google Vision API error: {str(e)}"}
    
    def comprehensive_analysis(self, image_path, save_results=True):
        """
        Run complete OCR analysis using all available methods
        
        Args:
            image_path: Path to the engineering drawing image
            save_results: Whether to save results to JSON file
        """
        print(f"🔍 Comprehensive Analysis of: {os.path.basename(image_path)}")
        print("=" * 60)
        
        if not os.path.exists(image_path):
            return {"error": f"File not found: {image_path}"}
        
        results = {
            'image_path': image_path,
            'analysis_timestamp': datetime.now().isoformat(),
            'methods_used': [],
            'results': {}
        }
        
        # 1. Tesseract OCR (printed text)
        print("📝 1. Running Tesseract OCR (printed text)...")
        tesseract_result = self.tesseract_ocr.process_engineering_drawing(image_path)
        if 'error' not in tesseract_result:
            results['methods_used'].append('tesseract')
            results['results']['tesseract'] = tesseract_result
            print(f"   ✅ Found {tesseract_result.get('total_detections', 0)} text elements")
        else:
            print(f"   ❌ Tesseract failed: {tesseract_result['error']}")
        
        # 2. TrOCR (handwriting)
        print("✍️ 2. Running TrOCR (handwriting recognition)...")
        if self.handwriting_ocr.model_loaded:
            handwriting_result = self.handwriting_ocr.recognize_handwriting_trocr(image_path)
            if 'error' not in handwriting_result:
                results['methods_used'].append('trocr')
                results['results']['trocr'] = handwriting_result
                print(f"   ✅ Extracted handwritten text")
            else:
                print(f"   ❌ TrOCR failed: {handwriting_result['error']}")
        else:
            print("   ⚠️ TrOCR not available")
        
        # 3. YOLO Symbol Detection
        print("🔷 3. Running YOLO symbol detection...")
        if self.symbol_detector.model_loaded:
            symbol_result = self.symbol_detector.comprehensive_analysis(image_path)
            if 'error' not in symbol_result:
                results['methods_used'].append('yolo')
                results['results']['yolo'] = symbol_result
                shapes = symbol_result.get('shapes', {}).get('total_shapes', 0)
                lines = symbol_result.get('lines', {}).get('total_lines', 0)
                objects = symbol_result.get('yolo', {}).get('total_detections', 0)
                print(f"   ✅ Found {shapes} shapes, {lines} lines, {objects} objects")
            else:
                print(f"   ❌ YOLO failed: {symbol_result['error']}")
        else:
            print("   ⚠️ YOLO not available")
        
        # 4. Google Cloud Vision (if available)
        if self.use_google_vision:
            print("🌍 4. Running Google Cloud Vision...")
            gv_result = self.analyze_with_google_vision(image_path)
            if 'error' not in gv_result:
                results['methods_used'].append('google_vision')
                results['results']['google_vision'] = gv_result
                print(f"   ✅ Google Vision extraction complete")
            else:
                print(f"   ❌ Google Vision failed: {gv_result['error']}")
        
        # 5. Combine and analyze results
        print("🔍 5. Combining results...")
        combined_result = self.combine_results(results['results'])
        results['combined'] = combined_result
        
        # Save results if requested
        if save_results:
            results_file = image_path.replace('.', '_analysis_results.json')
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"   💾 Results saved to: {results_file}")
        
        print("-" * 60)
        return results
    
    def combine_results(self, method_results):
        """Combine results from all OCR methods"""
        combined = {
            'all_text': [],
            'shapes_detected': [],
            'lines_detected': [],
            'confidence_scores': {},
            'method_summary': {}
        }
        
        # Extract text from all methods
        for method, result in method_results.items():
            if method == 'tesseract':
                if 'extracted_text' in result and result['extracted_text'].strip():
                    combined['all_text'].append({
                        'method': 'tesseract',
                        'text': result['extracted_text'].strip(),
                        'type': 'printed'
                    })
                combined['method_summary']['tesseract'] = {
                    'detections': result.get('total_detections', 0),
                    'type': 'printed_text'
                }
            
            elif method == 'trocr':
                if 'text' in result and result['text'].strip():
                    combined['all_text'].append({
                        'method': 'trocr',
                        'text': result['text'].strip(),
                        'type': 'handwritten'
                    })
                combined['method_summary']['trocr'] = {
                    'text_found': bool(result.get('text', '').strip()),
                    'type': 'handwritten_text'
                }
            
            elif method == 'google_vision':
                if 'text' in result and result['text'].strip():
                    combined['all_text'].append({
                        'method': 'google_vision',
                        'text': result['text'].strip(),
                        'type': 'mixed'
                    })
                combined['method_summary']['google_vision'] = {
                    'detections': result.get('total_detections', 0),
                    'type': 'mixed_text'
                }
            
            elif method == 'yolo':
                # Extract shapes
                if 'shapes' in result and 'shapes' in result['shapes']:
                    combined['shapes_detected'] = result['shapes']['shapes']
                
                # Extract lines
                if 'lines' in result and 'lines' in result['lines']:
                    combined['lines_detected'] = result['lines']['lines']
                
                combined['method_summary']['yolo'] = {
                    'shapes': result.get('shapes', {}).get('total_shapes', 0),
                    'lines': result.get('lines', {}).get('total_lines', 0),
                    'objects': result.get('yolo', {}).get('total_detections', 0),
                    'type': 'visual_elements'
                }
        
        return combined
    
    def generate_report(self, analysis_results):
        """Generate a human-readable report from analysis results"""
        report = []
        report.append("🔍 ENGINEERING DRAWING ANALYSIS REPORT")
        report.append("=" * 60)
        report.append(f"Image: {os.path.basename(analysis_results['image_path'])}")
        report.append(f"Analysis Date: {analysis_results['analysis_timestamp']}")
        report.append(f"Methods Used: {', '.join(analysis_results['methods_used'])}")
        report.append("")
        
        combined = analysis_results.get('combined', {})
        
        # Text Summary
        report.append("📝 TEXT EXTRACTION SUMMARY:")
        report.append("-" * 40)
        all_text = combined.get('all_text', [])
        if all_text:
            for i, text_item in enumerate(all_text, 1):
                report.append(f"{i}. [{text_item['method'].upper()} - {text_item['type']}]:")
                report.append(f"   {text_item['text'][:100]}{'...' if len(text_item['text']) > 100 else ''}")
        else:
            report.append("   No text detected")
        report.append("")
        
        # Shapes Summary
        report.append("🔷 SHAPES DETECTED:")
        report.append("-" * 40)
        shapes = combined.get('shapes_detected', [])
        if shapes:
            shape_counts = {}
            for shape in shapes:
                shape_type = shape['shape_type']
                shape_counts[shape_type] = shape_counts.get(shape_type, 0) + 1
            for shape_type, count in shape_counts.items():
                report.append(f"   {shape_type}: {count}")
        else:
            report.append("   No shapes detected")
        report.append("")
        
        # Lines Summary
        lines_count = len(combined.get('lines_detected', []))
        report.append(f"📏 LINES DETECTED: {lines_count}")
        report.append("")
        
        # Method Summary
        report.append("📊 METHOD PERFORMANCE:")
        report.append("-" * 40)
        for method, summary in combined.get('method_summary', {}).items():
            report.append(f"   {method.upper()}: {summary}")
        
        return "\n".join(report)

def main():
    """Main function to demonstrate the comprehensive OCR pipeline"""
    # Initialize with your Google API key
    GOOGLE_API_KEY = "{{REDACTED_GOOGLE_API_KEY}}"  # Your provided key
    
    ocr_pipeline = ComprehensiveEngineeringOCR(
        use_google_vision=True,
        google_api_key=GOOGLE_API_KEY
    )
    
    # Test images to analyze
    test_images = [
        "sample_engineering_drawing.png",
        "sample_engineering_text.png",
        "sample_drawing.png",
        "engineering_diagram.jpg"
    ]
    
    for image_path in test_images:
        if os.path.exists(image_path):
            print(f"\n🎨 Processing: {image_path}")
            results = ocr_pipeline.comprehensive_analysis(image_path)
            
            if 'error' not in results:
                # Generate and display report
                report = ocr_pipeline.generate_report(results)
                print("\n" + report)
                
                # Save report to file
                report_file = image_path.replace('.', '_report.txt')
                with open(report_file, 'w', encoding='utf-8') as f:
                    f.write(report)
                print(f"\n💾 Report saved to: {report_file}")
            else:
                print(f"\n❌ Analysis failed: {results['error']}")
        else:
            print(f"\n⏭️ Skipping {image_path} - file not found")
    
    print("\n🎉 Comprehensive OCR analysis complete!")

if __name__ == "__main__":
    main()
