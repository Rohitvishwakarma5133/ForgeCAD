#!/usr/bin/env python3
"""
🔥 COMPREHENSIVE AI-POWERED OCR MODULE
=====================================

Multi-API OCR System integrating:
✅ OpenAI GPT-4 Vision API
✅ Claude AI Vision API  
✅ Google Vision AI API
✅ Tesseract OCR (fallback)
✅ TrOCR (handwriting)

For Technical Drawing Analysis & Data Extraction
"""

import os
import json
import base64
import asyncio
import aiohttp
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import time

# Third-party imports
import requests
from PIL import Image
import cv2
import numpy as np

# Internal imports  
from ..scripts.enhanced_ocr import EngineeringOCR
from ..scripts.trocr_handwriting import HandwritingOCR

# API client imports
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

class ComprehensiveAIOCR:
    """🔥 Ultimate Multi-API OCR System"""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize comprehensive OCR system with all APIs"""
        print("🚀 INITIALIZING COMPREHENSIVE AI OCR SYSTEM")
        print("=" * 60)
        
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Initialize API clients
        self.apis_status = {}
        self._initialize_apis()
        
        # Initialize traditional OCR systems
        self.tesseract_ocr = EngineeringOCR()
        self.handwriting_ocr = HandwritingOCR()
        
        # Performance tracking
        self.performance_stats = {
            'total_processed': 0,
            'api_usage': {},
            'average_times': {},
            'success_rates': {}
        }
        
        print("🎯 SYSTEM READY FOR MULTI-AI PROCESSING!")
        print("=" * 60)
    
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load API configuration from environment or config file"""
        config = {
            # OpenAI Configuration
            'openai': {
                'api_key': os.getenv('OPENAI_API_KEY'),
                'model': os.getenv('OPENAI_MODEL', 'gpt-4o'),
                'max_tokens': int(os.getenv('OPENAI_MAX_TOKENS', '4000')),
                'temperature': float(os.getenv('OPENAI_TEMPERATURE', '0.2'))
            },
            
            # Claude AI Configuration  
            'claude': {
                'api_key': os.getenv('CLAUDE_API_KEY'),
                'model': os.getenv('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
                'max_tokens': int(os.getenv('CLAUDE_MAX_TOKENS', '4000'))
            },
            
            # Google AI Configuration
            'google': {
                'api_key': os.getenv('GOOGLE_AI_API_KEY'),
                'vision_api_key': os.getenv('GOOGLE_VISION_API_KEY'),
                'project_name': os.getenv('GOOGLE_AI_PROJECT_NAME'),
                'project_number': os.getenv('GOOGLE_AI_PROJECT_NUMBER')
            }
        }
        
        return config
    
    def _initialize_apis(self):
        """Initialize all API clients and check status"""
        
        # OpenAI GPT-4 Vision
        if OPENAI_AVAILABLE and self.config['openai']['api_key']:
            try:
                self.openai_client = openai.OpenAI(
                    api_key=self.config['openai']['api_key']
                )
                self.apis_status['openai'] = 'ready'
                print("✅ OpenAI GPT-4 Vision API - READY")
            except Exception as e:
                self.apis_status['openai'] = f'error: {str(e)}'
                print(f"❌ OpenAI API failed: {e}")
        else:
            self.apis_status['openai'] = 'not_configured'
            print("⚠️ OpenAI API not configured")
        
        # Claude AI Vision
        if ANTHROPIC_AVAILABLE and self.config['claude']['api_key']:
            try:
                self.claude_client = anthropic.Anthropic(
                    api_key=self.config['claude']['api_key']
                )
                self.apis_status['claude'] = 'ready'
                print("✅ Claude AI Vision API - READY")
            except Exception as e:
                self.apis_status['claude'] = f'error: {str(e)}'
                print(f"❌ Claude API failed: {e}")
        else:
            self.apis_status['claude'] = 'not_configured'
            print("⚠️ Claude AI API not configured")
        
        # Google Vision AI
        if self.config['google']['api_key']:
            self.apis_status['google'] = 'ready'
            print("✅ Google Vision AI API - READY")
        else:
            self.apis_status['google'] = 'not_configured'
            print("⚠️ Google Vision AI not configured")
    
    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64 for API calls"""
        with open(image_path, 'rb') as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def _preprocess_image(self, image_path: str) -> str:
        """Preprocess image for better OCR results"""
        try:
            # Load image
            img = cv2.imread(image_path)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply denoising
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Enhance contrast
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(denoised)
            
            # Save preprocessed image
            preprocessed_path = image_path.replace('.', '_preprocessed.')
            cv2.imwrite(preprocessed_path, enhanced)
            
            return preprocessed_path
            
        except Exception as e:
            print(f"⚠️ Preprocessing failed: {e}, using original")
            return image_path
    
    async def analyze_with_openai(self, image_path: str, context: str = "") -> Dict[str, Any]:
        """Analyze image using OpenAI GPT-4 Vision"""
        if self.apis_status.get('openai') != 'ready':
            return {"error": "OpenAI not available", "status": self.apis_status.get('openai')}
        
        try:
            start_time = time.time()
            
            # Encode image
            base64_image = self._encode_image(image_path)
            
            # Create prompt for technical drawing analysis
            prompt = f"""You are an expert technical drawing analyst. Analyze this engineering drawing and extract:

1. **TEXT CONTENT**: All visible text, dimensions, labels, annotations
2. **TECHNICAL SPECIFICATIONS**: Dimensions, tolerances, materials, part numbers
3. **DRAWING ELEMENTS**: Symbols, geometric features, annotations
4. **METADATA**: Title block info, drawing number, revision, date
5. **STRUCTURAL ANALYSIS**: What type of component/assembly is shown

{context}

Return a structured JSON response with extracted data organized by categories."""
            
            response = self.openai_client.chat.completions.create(
                model=self.config['openai']['model'],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=self.config['openai']['max_tokens'],
                temperature=self.config['openai']['temperature']
            )
            
            processing_time = time.time() - start_time
            
            # Parse response
            content = response.choices[0].message.content
            
            # Try to extract JSON if present
            try:
                import re
                json_match = re.search(r'{.*}', content, re.DOTALL)
                if json_match:
                    structured_data = json.loads(json_match.group())
                else:
                    structured_data = {"analysis": content}
            except:
                structured_data = {"analysis": content}
            
            return {
                "status": "success",
                "api": "openai_gpt4_vision",
                "model": self.config['openai']['model'],
                "processing_time": processing_time,
                "tokens_used": response.usage.total_tokens if response.usage else 0,
                "data": structured_data,
                "raw_response": content
            }
            
        except Exception as e:
            return {
                "status": "error",
                "api": "openai_gpt4_vision", 
                "error": str(e),
                "processing_time": time.time() - start_time if 'start_time' in locals() else 0
            }
    
    async def analyze_with_claude(self, image_path: str, context: str = "") -> Dict[str, Any]:
        """Analyze image using Claude AI Vision"""
        if self.apis_status.get('claude') != 'ready':
            return {"error": "Claude not available", "status": self.apis_status.get('claude')}
        
        try:
            start_time = time.time()
            
            # Encode image
            base64_image = self._encode_image(image_path)
            
            # Create prompt for technical analysis
            prompt = f"""I need you to analyze this technical drawing as an expert engineer. Please extract and organize:

**TEXT EXTRACTION:**
- All visible text, numbers, labels
- Dimensions and measurements  
- Material specifications
- Part numbers and identifiers

**TECHNICAL ELEMENTS:**
- Geometric features and symbols
- Engineering annotations
- Scale and measurement units
- Drawing standards compliance

**STRUCTURAL ANALYSIS:**
- Component type and function
- Assembly relationships
- Design intent and purpose

{context}

Provide detailed, structured analysis suitable for technical documentation."""
            
            response = self.claude_client.messages.create(
                model=self.config['claude']['model'],
                max_tokens=self.config['claude']['max_tokens'],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": base64_image
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            )
            
            processing_time = time.time() - start_time
            
            # Extract response content
            content = response.content[0].text if response.content else ""
            
            return {
                "status": "success",
                "api": "claude_vision",
                "model": self.config['claude']['model'],
                "processing_time": processing_time,
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens if hasattr(response, 'usage') else 0,
                "data": {"analysis": content},
                "raw_response": content
            }
            
        except Exception as e:
            return {
                "status": "error",
                "api": "claude_vision",
                "error": str(e),
                "processing_time": time.time() - start_time if 'start_time' in locals() else 0
            }
    
    async def analyze_with_google_vision(self, image_path: str) -> Dict[str, Any]:
        """Analyze image using Google Vision AI"""
        if self.apis_status.get('google') != 'ready':
            return {"error": "Google Vision not available"}
        
        try:
            start_time = time.time()
            
            # Encode image
            base64_image = self._encode_image(image_path)
            
            # Google Vision API request
            api_key = self.config['google']['vision_api_key']
            url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
            
            payload = {
                "requests": [
                    {
                        "image": {"content": base64_image},
                        "features": [
                            {"type": "TEXT_DETECTION"},
                            {"type": "DOCUMENT_TEXT_DETECTION"},
                            {"type": "OBJECT_LOCALIZATION"},
                            {"type": "LOGO_DETECTION"}
                        ]
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    result = await response.json()
            
            processing_time = time.time() - start_time
            
            # Parse Google Vision response
            if 'responses' in result and result['responses']:
                vision_data = result['responses'][0]
                
                # Extract text
                text_annotations = vision_data.get('textAnnotations', [])
                full_text = text_annotations[0]['description'] if text_annotations else ""
                
                # Extract objects
                objects = vision_data.get('localizedObjectAnnotations', [])
                
                return {
                    "status": "success",
                    "api": "google_vision",
                    "processing_time": processing_time,
                    "data": {
                        "full_text": full_text,
                        "text_annotations": len(text_annotations) - 1 if text_annotations else 0,
                        "objects_detected": len(objects),
                        "objects": [obj['name'] for obj in objects]
                    },
                    "raw_response": vision_data
                }
            else:
                return {"status": "error", "api": "google_vision", "error": "No response data"}
                
        except Exception as e:
            return {
                "status": "error",
                "api": "google_vision",
                "error": str(e),
                "processing_time": time.time() - start_time if 'start_time' in locals() else 0
            }
    
    def analyze_with_tesseract(self, image_path: str) -> Dict[str, Any]:
        """Analyze image using Tesseract OCR"""
        try:
            start_time = time.time()
            
            # Use existing enhanced OCR
            result = self.tesseract_ocr.process_engineering_drawing(image_path)
            
            processing_time = time.time() - start_time
            
            return {
                "status": "success",
                "api": "tesseract_ocr",
                "processing_time": processing_time,
                "data": result,
                "method": "traditional_ocr"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "api": "tesseract_ocr",
                "error": str(e),
                "processing_time": time.time() - start_time if 'start_time' in locals() else 0
            }
    
    def analyze_with_trocr(self, image_path: str) -> Dict[str, Any]:
        """Analyze handwriting using TrOCR"""
        try:
            start_time = time.time()
            
            if not self.handwriting_ocr.model_loaded:
                return {"status": "error", "api": "trocr", "error": "TrOCR model not loaded"}
            
            # Use existing TrOCR system
            result = self.handwriting_ocr.recognize_handwriting_trocr(image_path)
            
            processing_time = time.time() - start_time
            
            return {
                "status": "success", 
                "api": "trocr",
                "processing_time": processing_time,
                "data": result,
                "method": "handwriting_recognition"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "api": "trocr", 
                "error": str(e),
                "processing_time": time.time() - start_time if 'start_time' in locals() else 0
            }
    
    async def comprehensive_analysis(self, image_path: str, enable_preprocessing: bool = True) -> Dict[str, Any]:
        """🔥 ULTIMATE COMPREHENSIVE AI ANALYSIS"""
        
        print(f"🔥 COMPREHENSIVE AI ANALYSIS: {os.path.basename(image_path)}")
        print("=" * 60)
        
        analysis_start = time.time()
        
        # Preprocess image if enabled
        processed_image = self._preprocess_image(image_path) if enable_preprocessing else image_path
        
        results = {
            'image_path': image_path,
            'preprocessed_image': processed_image if enable_preprocessing else None,
            'timestamp': datetime.now().isoformat(),
            'api_results': {},
            'performance': {},
            'summary': {}
        }
        
        # Run all available APIs concurrently
        tasks = []
        
        # AI-powered APIs (async)
        if self.apis_status.get('openai') == 'ready':
            tasks.append(('openai', self.analyze_with_openai(processed_image)))
            print("🤖 Queuing OpenAI GPT-4 Vision...")
        
        if self.apis_status.get('claude') == 'ready':
            tasks.append(('claude', self.analyze_with_claude(processed_image)))
            print("🤖 Queuing Claude AI Vision...")
        
        if self.apis_status.get('google') == 'ready':
            tasks.append(('google', self.analyze_with_google_vision(processed_image)))
            print("🤖 Queuing Google Vision AI...")
        
        # Execute AI APIs concurrently
        if tasks:
            print("⚡ Running AI APIs concurrently...")
            ai_results = await asyncio.gather(*[task[1] for task in tasks], return_exceptions=True)
            
            for i, (api_name, _) in enumerate(tasks):
                result = ai_results[i]
                if isinstance(result, Exception):
                    results['api_results'][api_name] = {
                        "status": "error", 
                        "error": str(result)
                    }
                else:
                    results['api_results'][api_name] = result
                    
                # Log results
                if isinstance(result, dict) and result.get('status') == 'success':
                    time_taken = result.get('processing_time', 0)
                    print(f"   ✅ {api_name.upper()}: Success in {time_taken:.1f}s")
                else:
                    print(f"   ❌ {api_name.upper()}: Failed")
        
        # Traditional OCR (synchronous)
        print("📝 Running Traditional OCR...")
        tesseract_result = self.analyze_with_tesseract(processed_image)
        results['api_results']['tesseract'] = tesseract_result
        
        if tesseract_result.get('status') == 'success':
            print(f"   ✅ TESSERACT: Success in {tesseract_result.get('processing_time', 0):.1f}s")
        else:
            print("   ❌ TESSERACT: Failed")
        
        # Handwriting recognition
        print("✍️ Running Handwriting Recognition...")
        trocr_result = self.analyze_with_trocr(processed_image)
        results['api_results']['trocr'] = trocr_result
        
        if trocr_result.get('status') == 'success':
            print(f"   ✅ TrOCR: Success in {trocr_result.get('processing_time', 0):.1f}s")
        else:
            print("   ❌ TrOCR: Failed")
        
        # Calculate performance metrics
        total_time = time.time() - analysis_start
        successful_apis = sum(1 for result in results['api_results'].values() 
                             if result.get('status') == 'success')
        total_apis = len(results['api_results'])
        
        results['performance'] = {
            'total_processing_time': total_time,
            'successful_apis': successful_apis,
            'total_apis_attempted': total_apis,
            'success_rate': (successful_apis / total_apis) * 100 if total_apis > 0 else 0,
            'apis_used': list(results['api_results'].keys())
        }
        
        # Generate summary
        results['summary'] = self._generate_analysis_summary(results['api_results'])
        
        # Update performance statistics
        self.performance_stats['total_processed'] += 1
        
        print("🎉 COMPREHENSIVE ANALYSIS COMPLETE!")
        print(f"⚡ Total Time: {total_time:.2f}s")
        print(f"🏆 Success Rate: {results['performance']['success_rate']:.0f}% ({successful_apis}/{total_apis})")
        print("=" * 60)
        
        return results
    
    def _generate_analysis_summary(self, api_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate consolidated summary from all API results"""
        summary = {
            'text_extracted': [],
            'technical_insights': [],
            'confidence_scores': {},
            'recommended_actions': []
        }
        
        # Consolidate text from all sources
        for api_name, result in api_results.items():
            if result.get('status') == 'success':
                data = result.get('data', {})
                
                # Extract text based on API type
                if api_name == 'openai':
                    if 'analysis' in data:
                        summary['technical_insights'].append({
                            'source': 'GPT-4 Vision',
                            'insight': data['analysis']
                        })
                
                elif api_name == 'claude':
                    if 'analysis' in data:
                        summary['technical_insights'].append({
                            'source': 'Claude AI',
                            'insight': data['analysis']
                        })
                
                elif api_name == 'google':
                    if 'full_text' in data:
                        summary['text_extracted'].append({
                            'source': 'Google Vision',
                            'text': data['full_text'],
                            'annotations': data.get('text_annotations', 0)
                        })
                
                elif api_name == 'tesseract':
                    if 'extracted_text' in data:
                        summary['text_extracted'].append({
                            'source': 'Tesseract OCR', 
                            'text': data['extracted_text'],
                            'detections': data.get('total_detections', 0)
                        })
                
                elif api_name == 'trocr':
                    if 'text' in data:
                        summary['text_extracted'].append({
                            'source': 'TrOCR Handwriting',
                            'text': data['text']
                        })
        
        return summary
    
    async def batch_process(self, image_paths: List[str], output_dir: str = None) -> Dict[str, Any]:
        """Process multiple images in batch"""
        print(f"🔥 BATCH PROCESSING: {len(image_paths)} images")
        print("=" * 60)
        
        batch_start = time.time()
        batch_results = {
            'batch_id': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'total_images': len(image_paths),
            'results': {},
            'batch_summary': {}
        }
        
        # Process each image
        for i, image_path in enumerate(image_paths, 1):
            print(f"📸 Processing image {i}/{len(image_paths)}: {os.path.basename(image_path)}")
            
            if os.path.exists(image_path):
                result = await self.comprehensive_analysis(image_path)
                batch_results['results'][image_path] = result
            else:
                print(f"⚠️ Image not found: {image_path}")
                batch_results['results'][image_path] = {
                    'status': 'error',
                    'error': 'File not found'
                }
        
        # Calculate batch statistics
        batch_time = time.time() - batch_start
        successful = sum(1 for r in batch_results['results'].values() 
                        if r.get('status') != 'error')
        
        batch_results['batch_summary'] = {
            'total_processing_time': batch_time,
            'successful_images': successful,
            'failed_images': len(image_paths) - successful,
            'success_rate': (successful / len(image_paths)) * 100,
            'average_time_per_image': batch_time / len(image_paths)
        }
        
        # Save batch results if output directory specified
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            output_file = os.path.join(output_dir, f"batch_results_{batch_results['batch_id']}.json")
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(batch_results, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Batch results saved: {output_file}")
        
        print(f"🎉 BATCH PROCESSING COMPLETE!")
        print(f"⚡ Total Time: {batch_time:.2f}s")
        print(f"🏆 Success Rate: {batch_results['batch_summary']['success_rate']:.0f}%")
        
        return batch_results
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Get detailed performance report"""
        return {
            'system_status': self.apis_status,
            'performance_stats': self.performance_stats,
            'available_apis': [api for api, status in self.apis_status.items() if status == 'ready'],
            'total_apis_configured': len([s for s in self.apis_status.values() if s == 'ready'])
        }


# Async helper function
async def run_comprehensive_analysis(image_path: str) -> Dict[str, Any]:
    """Helper function to run comprehensive analysis"""
    ocr_system = ComprehensiveAIOCR()
    return await ocr_system.comprehensive_analysis(image_path)


if __name__ == "__main__":
    # Demo usage
    async def demo():
        print("🔥 COMPREHENSIVE AI OCR DEMO")
        
        ocr = ComprehensiveAIOCR()
        
        # Test with sample image
        test_image = "../sample_images/sample_engineering_drawing.png"
        
        if os.path.exists(test_image):
            results = await ocr.comprehensive_analysis(test_image)
            
            # Print summary
            print("\n📊 RESULTS SUMMARY:")
            print("=" * 40)
            perf = results['performance']
            print(f"⚡ Processing Time: {perf['total_processing_time']:.2f}s")
            print(f"🏆 Success Rate: {perf['success_rate']:.0f}%")
            print(f"🤖 APIs Used: {', '.join(perf['apis_used'])}")
            
        else:
            print(f"❌ Test image not found: {test_image}")
    
    # Run demo
    asyncio.run(demo())