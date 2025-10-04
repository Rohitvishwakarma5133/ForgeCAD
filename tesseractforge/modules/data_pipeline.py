#!/usr/bin/env python3
"""
🔥 DATA STRUCTURING & CONVERSION PIPELINE
=========================================

Advanced data pipeline for organizing multi-stage processing:
OCR → Symbol Detection → AI Analysis → Structured Output

✅ Asynchronous processing pipeline
✅ Data validation and cleaning
✅ Multi-format export (JSON, XML, CSV, Excel)
✅ Database integration ready
✅ Error handling and recovery
✅ Progress tracking and logging
✅ Pipeline performance optimization

For Engineering Data Processing Automation
"""

import os
import json
import csv
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Callable
import time
import uuid
import logging
from dataclasses import dataclass, asdict
from enum import Enum

# Import our custom modules
from .comprehensive_ai_ocr import ComprehensiveAIOCR
from .enhanced_symbol_detection import EnhancedSymbolDetector
from .semantic_understanding import SemanticUnderstandingEngine

# Data export libraries
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    from openpyxl import Workbook
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

try:
    import xml.etree.ElementTree as ET
    XML_AVAILABLE = True
except ImportError:
    XML_AVAILABLE = False

class ProcessingStage(Enum):
    """Pipeline processing stages"""
    INITIALIZED = "initialized"
    OCR_PROCESSING = "ocr_processing"
    SYMBOL_DETECTION = "symbol_detection"
    SEMANTIC_ANALYSIS = "semantic_analysis"
    DATA_STRUCTURING = "data_structuring"
    EXPORT_GENERATION = "export_generation"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class PipelineConfig:
    """Pipeline configuration settings"""
    enable_preprocessing: bool = True
    enable_parallel_processing: bool = True
    output_formats: List[str] = None
    export_directory: str = "output"
    log_level: str = "INFO"
    max_concurrent_tasks: int = 3
    enable_caching: bool = True
    validation_enabled: bool = True
    
    def __post_init__(self):
        if self.output_formats is None:
            self.output_formats = ["json", "excel"]

@dataclass
class ProcessingResult:
    """Individual processing result data structure"""
    pipeline_id: str
    image_path: str
    stage: ProcessingStage
    status: str
    processing_time: float
    data: Dict[str, Any]
    errors: List[str]
    metadata: Dict[str, Any]
    timestamp: str

class DataStructuringPipeline:
    """🔥 Advanced Data Processing Pipeline"""
    
    def __init__(self, config: Optional[PipelineConfig] = None):
        """Initialize the comprehensive data pipeline"""
        
        print("🚀 INITIALIZING DATA STRUCTURING PIPELINE")
        print("=" * 60)
        
        # Configuration
        self.config = config or PipelineConfig()
        
        # Initialize processing modules
        self.ocr_engine = ComprehensiveAIOCR()
        self.symbol_detector = EnhancedSymbolDetector()
        self.semantic_engine = SemanticUnderstandingEngine()
        
        # Pipeline state tracking
        self.active_pipelines = {}
        self.completed_pipelines = {}
        self.pipeline_stats = {
            'total_processed': 0,
            'successful_completions': 0,
            'failed_processes': 0,
            'average_processing_time': 0.0,
            'stage_performance': {}
        }
        
        # Setup logging
        self.logger = self._setup_logging()
        
        # Output directory setup
        os.makedirs(self.config.export_directory, exist_ok=True)
        
        print("🎯 DATA PIPELINE READY!")
        print(f"📁 Output Directory: {self.config.export_directory}")
        print(f"📊 Export Formats: {', '.join(self.config.output_formats)}")
        print("=" * 60)
    
    def _setup_logging(self) -> logging.Logger:
        """Setup pipeline logging"""
        logger = logging.getLogger('DataPipeline')
        logger.setLevel(getattr(logging, self.config.log_level))
        
        # Create file handler
        log_file = os.path.join(self.config.export_directory, 'pipeline.log')
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        
        # Create console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # Add handlers to logger
        if not logger.handlers:
            logger.addHandler(file_handler)
            logger.addHandler(console_handler)
        
        return logger
    
    def _generate_pipeline_id(self) -> str:
        """Generate unique pipeline ID"""
        return f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    
    def _validate_input(self, image_path: str) -> bool:
        """Validate input image file"""
        try:
            if not os.path.exists(image_path):
                self.logger.error(f"Input file does not exist: {image_path}")
                return False
            
            # Check file extension
            valid_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.pdf']
            file_ext = Path(image_path).suffix.lower()
            
            if file_ext not in valid_extensions:
                self.logger.warning(f"Unusual file extension: {file_ext}")
            
            # Check file size (max 50MB)
            file_size = os.path.getsize(image_path) / (1024 * 1024)  # MB
            if file_size > 50:
                self.logger.warning(f"Large file size: {file_size:.1f}MB")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Input validation failed: {str(e)}")
            return False
    
    async def process_single_image(self, image_path: str, 
                                 context: str = "", 
                                 pipeline_id: Optional[str] = None) -> ProcessingResult:
        """🔥 PROCESS SINGLE IMAGE THROUGH COMPLETE PIPELINE"""
        
        # Generate pipeline ID
        if pipeline_id is None:
            pipeline_id = self._generate_pipeline_id()
        
        self.logger.info(f"Starting pipeline {pipeline_id} for {os.path.basename(image_path)}")
        
        # Initialize result tracking
        result = ProcessingResult(
            pipeline_id=pipeline_id,
            image_path=image_path,
            stage=ProcessingStage.INITIALIZED,
            status="processing",
            processing_time=0.0,
            data={},
            errors=[],
            metadata={
                'context': context,
                'start_time': datetime.now().isoformat(),
                'config': asdict(self.config)
            },
            timestamp=datetime.now().isoformat()
        )
        
        # Track in active pipelines
        self.active_pipelines[pipeline_id] = result
        
        start_time = time.time()
        
        try:
            # Validate input
            if self.config.validation_enabled and not self._validate_input(image_path):
                raise ValueError("Input validation failed")
            
            # Stage 1: OCR Processing
            print(f"🔍 Stage 1: OCR Processing - {os.path.basename(image_path)}")
            result.stage = ProcessingStage.OCR_PROCESSING
            
            stage_start = time.time()
            ocr_results = await self.ocr_engine.comprehensive_analysis(
                image_path, 
                enable_preprocessing=self.config.enable_preprocessing
            )
            stage_time = time.time() - stage_start
            
            result.data['ocr_results'] = ocr_results
            self.logger.info(f"OCR completed in {stage_time:.2f}s")
            print(f"   ✅ OCR Processing complete in {stage_time:.1f}s")
            
            # Stage 2: Symbol Detection
            print(f"🔷 Stage 2: Symbol Detection - {os.path.basename(image_path)}")
            result.stage = ProcessingStage.SYMBOL_DETECTION
            
            stage_start = time.time()
            # Extract text data for symbol analysis
            text_data = self._extract_text_from_ocr(ocr_results)
            symbol_results = self.symbol_detector.comprehensive_symbol_analysis(
                image_path, text_data
            )
            stage_time = time.time() - stage_start
            
            result.data['symbol_results'] = symbol_results
            self.logger.info(f"Symbol detection completed in {stage_time:.2f}s")
            print(f"   ✅ Symbol Detection complete in {stage_time:.1f}s")
            
            # Stage 3: Semantic Analysis
            print(f"🧠 Stage 3: Semantic Analysis - {os.path.basename(image_path)}")
            result.stage = ProcessingStage.SEMANTIC_ANALYSIS
            
            stage_start = time.time()
            # Prepare combined data for semantic analysis
            combined_data = {
                'ocr_results': result.data['ocr_results'].get('api_results', {}),
                'symbol_results': result.data['symbol_results']
            }
            
            semantic_results = await self.semantic_engine.comprehensive_semantic_analysis(
                combined_data, context
            )
            stage_time = time.time() - stage_start
            
            result.data['semantic_results'] = semantic_results
            self.logger.info(f"Semantic analysis completed in {stage_time:.2f}s")
            print(f"   ✅ Semantic Analysis complete in {stage_time:.1f}s")
            
            # Stage 4: Data Structuring
            print(f"📊 Stage 4: Data Structuring - {os.path.basename(image_path)}")
            result.stage = ProcessingStage.DATA_STRUCTURING
            
            stage_start = time.time()
            structured_data = self._structure_pipeline_data(result.data)
            result.data['structured_output'] = structured_data
            stage_time = time.time() - stage_start
            
            self.logger.info(f"Data structuring completed in {stage_time:.2f}s")
            print(f"   ✅ Data Structuring complete in {stage_time:.1f}s")
            
            # Stage 5: Export Generation
            print(f"📤 Stage 5: Export Generation - {os.path.basename(image_path)}")
            result.stage = ProcessingStage.EXPORT_GENERATION
            
            stage_start = time.time()
            export_files = await self._generate_exports(pipeline_id, result.data)
            result.data['export_files'] = export_files
            stage_time = time.time() - stage_start
            
            self.logger.info(f"Export generation completed in {stage_time:.2f}s")
            print(f"   ✅ Export Generation complete in {stage_time:.1f}s")
            
            # Complete pipeline
            total_time = time.time() - start_time
            result.stage = ProcessingStage.COMPLETED
            result.status = "completed"
            result.processing_time = total_time
            result.metadata['end_time'] = datetime.now().isoformat()
            
            # Update statistics
            self.pipeline_stats['total_processed'] += 1
            self.pipeline_stats['successful_completions'] += 1
            self._update_average_time(total_time)
            
            # Move to completed pipelines
            self.completed_pipelines[pipeline_id] = result
            if pipeline_id in self.active_pipelines:
                del self.active_pipelines[pipeline_id]
            
            print(f"🎉 PIPELINE COMPLETE: {os.path.basename(image_path)}")
            print(f"⚡ Total Time: {total_time:.2f}s")
            print(f"📁 Exports: {len(export_files)} files generated")
            
            return result
            
        except Exception as e:
            # Handle pipeline failure
            error_msg = str(e)
            result.stage = ProcessingStage.FAILED
            result.status = "failed"
            result.errors.append(error_msg)
            result.processing_time = time.time() - start_time
            result.metadata['error_time'] = datetime.now().isoformat()
            
            self.pipeline_stats['failed_processes'] += 1
            self.logger.error(f"Pipeline {pipeline_id} failed: {error_msg}")
            
            # Move to completed (failed) pipelines
            self.completed_pipelines[pipeline_id] = result
            if pipeline_id in self.active_pipelines:
                del self.active_pipelines[pipeline_id]
            
            print(f"❌ PIPELINE FAILED: {os.path.basename(image_path)} - {error_msg}")
            
            return result
    
    async def process_batch(self, image_paths: List[str], 
                          context: str = "", 
                          progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """🔥 BATCH PROCESS MULTIPLE IMAGES"""
        
        print(f"🔥 BATCH PROCESSING: {len(image_paths)} images")
        print("=" * 60)
        
        batch_id = self._generate_pipeline_id()
        batch_start = time.time()
        
        batch_results = {
            'batch_id': batch_id,
            'total_images': len(image_paths),
            'processed_images': 0,
            'successful_pipelines': 0,
            'failed_pipelines': 0,
            'individual_results': {},
            'batch_summary': {},
            'export_summary': {}
        }
        
        # Process images with concurrency control
        semaphore = asyncio.Semaphore(self.config.max_concurrent_tasks)
        
        async def process_with_semaphore(image_path: str) -> ProcessingResult:
            async with semaphore:
                pipeline_id = f"{batch_id}_img_{len(batch_results['individual_results']) + 1}"
                result = await self.process_single_image(image_path, context, pipeline_id)
                
                # Update batch progress
                batch_results['processed_images'] += 1
                if result.status == "completed":
                    batch_results['successful_pipelines'] += 1
                else:
                    batch_results['failed_pipelines'] += 1
                
                # Progress callback
                if progress_callback:
                    progress = batch_results['processed_images'] / batch_results['total_images']
                    progress_callback(progress, result)
                
                return result
        
        # Create and execute batch tasks
        print(f"⚡ Processing with max {self.config.max_concurrent_tasks} concurrent tasks...")
        tasks = [process_with_semaphore(img_path) for img_path in image_paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Compile batch results
        for i, result in enumerate(results):
            image_path = image_paths[i]
            if isinstance(result, Exception):
                batch_results['individual_results'][image_path] = {
                    'status': 'error',
                    'error': str(result)
                }
            else:
                batch_results['individual_results'][image_path] = result
        
        # Generate batch summary
        batch_time = time.time() - batch_start
        batch_results['batch_summary'] = {
            'total_processing_time': batch_time,
            'average_time_per_image': batch_time / len(image_paths),
            'success_rate': (batch_results['successful_pipelines'] / len(image_paths)) * 100,
            'throughput_images_per_minute': (len(image_paths) / batch_time) * 60
        }
        
        # Generate batch export summary
        export_summary = self._generate_batch_export_summary(batch_results['individual_results'])
        batch_results['export_summary'] = export_summary
        
        # Save batch results
        batch_file = os.path.join(self.config.export_directory, f"batch_results_{batch_id}.json")
        with open(batch_file, 'w', encoding='utf-8') as f:
            json.dump(batch_results, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"🎉 BATCH PROCESSING COMPLETE!")
        print(f"⚡ Total Time: {batch_time:.2f}s")
        print(f"🏆 Success Rate: {batch_results['batch_summary']['success_rate']:.1f}%")
        print(f"📁 Batch Results: {batch_file}")
        
        return batch_results
    
    def _extract_text_from_ocr(self, ocr_results: Dict[str, Any]) -> List[str]:
        """Extract text data from OCR results for symbol analysis"""
        text_data = []
        
        api_results = ocr_results.get('api_results', {})
        for api_name, result in api_results.items():
            if result.get('status') == 'success':
                data = result.get('data', {})
                
                # Handle different OCR result formats
                if 'analysis' in data and isinstance(data['analysis'], str):
                    text_data.append(data['analysis'])
                elif 'full_text' in data:
                    text_data.append(data['full_text'])
                elif 'extracted_text' in data:
                    text_data.append(data['extracted_text'])
                elif 'text' in data:
                    text_data.append(data['text'])
        
        return [text for text in text_data if text and isinstance(text, str)]
    
    def _structure_pipeline_data(self, pipeline_data: Dict[str, Any]) -> Dict[str, Any]:
        """Structure complete pipeline data into organized format"""
        
        structured = {
            'metadata': {
                'processing_timestamp': datetime.now().isoformat(),
                'pipeline_version': '1.0',
                'data_schema': 'cadly_v1'
            },
            'ocr_analysis': {},
            'symbol_analysis': {},
            'semantic_analysis': {},
            'technical_data': {},
            'export_ready_data': {}
        }
        
        # Structure OCR data
        ocr_results = pipeline_data.get('ocr_results', {})
        structured['ocr_analysis'] = {
            'performance': ocr_results.get('performance', {}),
            'api_results_summary': self._summarize_api_results(ocr_results.get('api_results', {})),
            'text_extracted': self._extract_all_text_content(ocr_results)
        }
        
        # Structure symbol data
        symbol_results = pipeline_data.get('symbol_results', {})
        structured['symbol_analysis'] = {
            'performance': symbol_results.get('performance', {}),
            'geometric_elements': symbol_results.get('analysis_results', {}).get('geometric_shapes', {}),
            'annotations': symbol_results.get('analysis_results', {}).get('annotations', {}),
            'insights': symbol_results.get('insights', {})
        }
        
        # Structure semantic data
        semantic_results = pipeline_data.get('semantic_results', {})
        structured['semantic_analysis'] = {
            'performance': semantic_results.get('performance_metrics', {}),
            'ai_analyses': semantic_results.get('ai_analyses', {}),
            'consolidated_insights': semantic_results.get('consolidated_insights', {})
        }
        
        # Generate technical data summary
        structured['technical_data'] = self._generate_technical_summary(pipeline_data)
        
        # Prepare export-ready data
        structured['export_ready_data'] = self._prepare_export_data(structured)
        
        return structured
    
    def _summarize_api_results(self, api_results: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize API results performance"""
        summary = {
            'total_apis_used': len(api_results),
            'successful_apis': 0,
            'failed_apis': 0,
            'total_tokens_used': 0,
            'total_processing_time': 0.0,
            'api_performance': {}
        }
        
        for api_name, result in api_results.items():
            if result.get('status') == 'success':
                summary['successful_apis'] += 1
                summary['total_tokens_used'] += result.get('tokens_used', 0)
                summary['total_processing_time'] += result.get('processing_time', 0)
                
                summary['api_performance'][api_name] = {
                    'status': 'success',
                    'processing_time': result.get('processing_time', 0),
                    'tokens_used': result.get('tokens_used', 0)
                }
            else:
                summary['failed_apis'] += 1
                summary['api_performance'][api_name] = {
                    'status': 'failed',
                    'error': result.get('error', 'Unknown error')
                }
        
        return summary
    
    def _extract_all_text_content(self, ocr_results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract all text content with source attribution"""
        text_content = []
        
        api_results = ocr_results.get('api_results', {})
        for api_name, result in api_results.items():
            if result.get('status') == 'success':
                data = result.get('data', {})
                
                # Extract text based on API type
                text = ""
                if 'analysis' in data:
                    text = data['analysis']
                elif 'full_text' in data:
                    text = data['full_text']
                elif 'extracted_text' in data:
                    text = data['extracted_text']
                elif 'text' in data:
                    text = data['text']
                
                if text and isinstance(text, str):
                    text_content.append({
                        'source': api_name,
                        'text': text.strip(),
                        'length': len(text),
                        'processing_time': result.get('processing_time', 0)
                    })
        
        return text_content
    
    def _generate_technical_summary(self, pipeline_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive technical summary"""
        
        technical_summary = {
            'dimensions_found': [],
            'materials_identified': [],
            'tolerances_specified': [],
            'standards_referenced': [],
            'processes_indicated': [],
            'component_classification': {},
            'quality_metrics': {}
        }
        
        # Extract from semantic analysis
        semantic_results = pipeline_data.get('semantic_results', {})
        if semantic_results:
            # Try to extract from structured AI analyses
            ai_analyses = semantic_results.get('ai_analyses', {})
            for ai_name, analysis in ai_analyses.items():
                if analysis.get('status') == 'success':
                    analysis_data = analysis.get('analysis', {})
                    
                    # Look for technical specifications
                    if isinstance(analysis_data, dict):
                        # Component identification
                        if 'COMPONENT_IDENTIFICATION' in analysis_data:
                            comp_info = analysis_data['COMPONENT_IDENTIFICATION']
                            technical_summary['component_classification'] = comp_info
                        
                        # Technical specifications
                        if 'TECHNICAL_SPECIFICATIONS' in analysis_data:
                            tech_specs = analysis_data['TECHNICAL_SPECIFICATIONS']
                            if 'dimensions' in tech_specs:
                                technical_summary['dimensions_found'].extend(
                                    tech_specs['dimensions'] if isinstance(tech_specs['dimensions'], list)
                                    else [str(tech_specs['dimensions'])]
                                )
                            if 'materials' in tech_specs:
                                technical_summary['materials_identified'].extend(
                                    tech_specs['materials'] if isinstance(tech_specs['materials'], list)
                                    else [str(tech_specs['materials'])]
                                )
        
        # Extract from OCR text patterns
        ocr_results = pipeline_data.get('ocr_results', {})
        all_text = " ".join([
            content['text'] for content in self._extract_all_text_content(ocr_results)
        ]).lower()
        
        # Pattern matching for technical information
        import re
        
        # Find dimensions
        dimension_patterns = [
            r'\d+\.?\d*\s*(?:mm|cm|m|in|ft|inch|inches)',
            r'(?:ø|∅|dia\.?|diameter)\s*\d+\.?\d*',
            r'\d+\.?\d*\s*[x×]\s*\d+\.?\d*'
        ]
        
        for pattern in dimension_patterns:
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            technical_summary['dimensions_found'].extend(matches)
        
        # Find tolerances
        tolerance_patterns = [
            r'[±∓]\s*\d+\.?\d*',
            r'[+-]\d+\.?\d*\s*/-\d+\.?\d*',
            r'[hH]\d+|[IT]\d+'
        ]
        
        for pattern in tolerance_patterns:
            matches = re.findall(pattern, all_text)
            technical_summary['tolerances_specified'].extend(matches)
        
        # Remove duplicates and limit results
        for key in ['dimensions_found', 'materials_identified', 'tolerances_specified']:
            technical_summary[key] = list(set(technical_summary[key]))[:10]  # Max 10 each
        
        # Calculate quality metrics
        technical_summary['quality_metrics'] = {
            'technical_content_richness': len(technical_summary['dimensions_found']) + 
                                        len(technical_summary['materials_identified']) +
                                        len(technical_summary['tolerances_specified']),
            'ocr_confidence': self._calculate_ocr_confidence(ocr_results),
            'semantic_confidence': self._calculate_semantic_confidence(semantic_results)
        }
        
        return technical_summary
    
    def _calculate_ocr_confidence(self, ocr_results: Dict[str, Any]) -> float:
        """Calculate overall OCR confidence score"""
        api_results = ocr_results.get('api_results', {})
        confidences = []
        
        for result in api_results.values():
            if result.get('status') == 'success':
                # Different APIs might have different confidence metrics
                if 'confidence' in result:
                    confidences.append(result['confidence'])
                elif result.get('tokens_used', 0) > 0:  # AI-based OCR
                    confidences.append(0.8)  # Assume high confidence for AI OCR
                else:
                    confidences.append(0.6)  # Default confidence for traditional OCR
        
        return sum(confidences) / len(confidences) if confidences else 0.0
    
    def _calculate_semantic_confidence(self, semantic_results: Dict[str, Any]) -> float:
        """Calculate semantic analysis confidence"""
        performance = semantic_results.get('performance_metrics', {})
        return performance.get('average_confidence', 0.0)
    
    def _prepare_export_data(self, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare data optimized for various export formats"""
        
        export_data = {
            # Table-friendly data for CSV/Excel
            'tabular_data': [],
            
            # Hierarchical data for JSON/XML
            'hierarchical_data': structured_data,
            
            # Summary data for reports
            'summary_data': {},
            
            # Raw data for debugging
            'raw_data_references': {}
        }
        
        # Create tabular representation
        technical_data = structured_data.get('technical_data', {})
        
        # Basic information row
        basic_info = {
            'Type': 'Basic Information',
            'Category': 'Metadata',
            'Value': structured_data.get('metadata', {}).get('processing_timestamp', ''),
            'Source': 'Pipeline',
            'Confidence': 1.0
        }
        export_data['tabular_data'].append(basic_info)
        
        # Dimensions data
        for dim in technical_data.get('dimensions_found', [])[:5]:  # Limit to 5
            dim_info = {
                'Type': 'Dimension',
                'Category': 'Technical Specification',
                'Value': dim,
                'Source': 'OCR Analysis',
                'Confidence': technical_data.get('quality_metrics', {}).get('ocr_confidence', 0.5)
            }
            export_data['tabular_data'].append(dim_info)
        
        # Materials data
        for material in technical_data.get('materials_identified', [])[:3]:  # Limit to 3
            material_info = {
                'Type': 'Material',
                'Category': 'Technical Specification',
                'Value': material,
                'Source': 'Semantic Analysis',
                'Confidence': technical_data.get('quality_metrics', {}).get('semantic_confidence', 0.5)
            }
            export_data['tabular_data'].append(material_info)
        
        # Generate summary data
        export_data['summary_data'] = {
            'total_dimensions': len(technical_data.get('dimensions_found', [])),
            'total_materials': len(technical_data.get('materials_identified', [])),
            'total_tolerances': len(technical_data.get('tolerances_specified', [])),
            'overall_quality_score': technical_data.get('quality_metrics', {}).get('technical_content_richness', 0),
            'processing_performance': {
                'ocr_apis_used': structured_data.get('ocr_analysis', {}).get('performance', {}).get('successful_apis', 0),
                'semantic_ai_used': len(structured_data.get('semantic_analysis', {}).get('ai_analyses', {})),
                'symbols_detected': structured_data.get('symbol_analysis', {}).get('performance', {}).get('total_elements_detected', 0)
            }
        }
        
        return export_data
    
    async def _generate_exports(self, pipeline_id: str, pipeline_data: Dict[str, Any]) -> List[str]:
        """Generate export files in specified formats"""
        
        export_files = []
        structured_data = pipeline_data.get('structured_output', {})
        export_ready_data = structured_data.get('export_ready_data', {})
        
        for format_type in self.config.output_formats:
            try:
                if format_type.lower() == 'json':
                    file_path = await self._export_json(pipeline_id, structured_data)
                    export_files.append(file_path)
                
                elif format_type.lower() == 'excel':
                    file_path = await self._export_excel(pipeline_id, export_ready_data)
                    export_files.append(file_path)
                
                elif format_type.lower() == 'csv':
                    file_path = await self._export_csv(pipeline_id, export_ready_data)
                    export_files.append(file_path)
                
                elif format_type.lower() == 'xml':
                    file_path = await self._export_xml(pipeline_id, structured_data)
                    export_files.append(file_path)
                
            except Exception as e:
                self.logger.error(f"Export generation failed for {format_type}: {str(e)}")
        
        return export_files
    
    async def _export_json(self, pipeline_id: str, data: Dict[str, Any]) -> str:
        """Export data as JSON"""
        file_path = os.path.join(self.config.export_directory, f"{pipeline_id}_data.json")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        return file_path
    
    async def _export_excel(self, pipeline_id: str, export_data: Dict[str, Any]) -> str:
        """Export data as Excel file"""
        if not PANDAS_AVAILABLE:
            raise ImportError("pandas is required for Excel export")
        
        file_path = os.path.join(self.config.export_directory, f"{pipeline_id}_data.xlsx")
        
        # Create DataFrame from tabular data
        tabular_data = export_data.get('tabular_data', [])
        if tabular_data:
            df = pd.DataFrame(tabular_data)
        else:
            df = pd.DataFrame([{'Message': 'No tabular data available'}])
        
        # Write to Excel with multiple sheets
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Technical Data', index=False)
            
            # Summary sheet
            summary_data = export_data.get('summary_data', {})
            if summary_data:
                summary_df = pd.DataFrame([summary_data])
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        return file_path
    
    async def _export_csv(self, pipeline_id: str, export_data: Dict[str, Any]) -> str:
        """Export data as CSV"""
        file_path = os.path.join(self.config.export_directory, f"{pipeline_id}_data.csv")
        
        tabular_data = export_data.get('tabular_data', [])
        if not tabular_data:
            tabular_data = [{'Message': 'No tabular data available'}]
        
        # Get fieldnames from first row
        fieldnames = list(tabular_data[0].keys()) if tabular_data else ['Message']
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(tabular_data)
        
        return file_path
    
    async def _export_xml(self, pipeline_id: str, data: Dict[str, Any]) -> str:
        """Export data as XML"""
        if not XML_AVAILABLE:
            raise ImportError("xml.etree.ElementTree is required for XML export")
        
        file_path = os.path.join(self.config.export_directory, f"{pipeline_id}_data.xml")
        
        # Create XML structure
        root = ET.Element("TechnicalDrawingAnalysis")
        root.set("pipeline_id", pipeline_id)
        root.set("timestamp", datetime.now().isoformat())
        
        # Add metadata
        metadata = ET.SubElement(root, "Metadata")
        for key, value in data.get('metadata', {}).items():
            elem = ET.SubElement(metadata, key.replace(' ', '_'))
            elem.text = str(value)
        
        # Add technical data
        technical = ET.SubElement(root, "TechnicalData")
        tech_data = data.get('technical_data', {})
        for key, value in tech_data.items():
            if isinstance(value, list):
                list_elem = ET.SubElement(technical, key)
                for item in value:
                    item_elem = ET.SubElement(list_elem, "item")
                    item_elem.text = str(item)
            else:
                elem = ET.SubElement(technical, key)
                elem.text = str(value)
        
        # Write XML file
        tree = ET.ElementTree(root)
        tree.write(file_path, encoding='utf-8', xml_declaration=True)
        
        return file_path
    
    def _generate_batch_export_summary(self, individual_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate batch export summary"""
        export_summary = {
            'total_export_files': 0,
            'export_formats_used': set(),
            'successful_exports': 0,
            'export_file_sizes': {},
            'format_breakdown': {}
        }
        
        for result in individual_results.values():
            if isinstance(result, ProcessingResult) and result.status == 'completed':
                export_files = result.data.get('export_files', [])
                export_summary['total_export_files'] += len(export_files)
                export_summary['successful_exports'] += 1
                
                for file_path in export_files:
                    if os.path.exists(file_path):
                        # Get file format
                        file_ext = Path(file_path).suffix.lower()
                        export_summary['export_formats_used'].add(file_ext)
                        
                        # Track format count
                        if file_ext not in export_summary['format_breakdown']:
                            export_summary['format_breakdown'][file_ext] = 0
                        export_summary['format_breakdown'][file_ext] += 1
                        
                        # Get file size
                        try:
                            file_size = os.path.getsize(file_path)
                            export_summary['export_file_sizes'][os.path.basename(file_path)] = file_size
                        except:
                            pass
        
        export_summary['export_formats_used'] = list(export_summary['export_formats_used'])
        return export_summary
    
    def _update_average_time(self, processing_time: float):
        """Update average processing time statistics"""
        current_avg = self.pipeline_stats['average_processing_time']
        total_processed = self.pipeline_stats['total_processed']
        
        # Calculate new average
        new_avg = ((current_avg * (total_processed - 1)) + processing_time) / total_processed
        self.pipeline_stats['average_processing_time'] = new_avg
    
    def get_pipeline_status(self, pipeline_id: str) -> Optional[ProcessingResult]:
        """Get status of specific pipeline"""
        if pipeline_id in self.active_pipelines:
            return self.active_pipelines[pipeline_id]
        elif pipeline_id in self.completed_pipelines:
            return self.completed_pipelines[pipeline_id]
        else:
            return None
    
    def get_system_statistics(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        return {
            'pipeline_stats': self.pipeline_stats,
            'active_pipelines': len(self.active_pipelines),
            'completed_pipelines': len(self.completed_pipelines),
            'system_config': asdict(self.config),
            'module_status': {
                'ocr_engine': 'operational',
                'symbol_detector': 'operational', 
                'semantic_engine': 'operational'
            },
            'export_capabilities': {
                'pandas_available': PANDAS_AVAILABLE,
                'openpyxl_available': OPENPYXL_AVAILABLE,
                'xml_available': XML_AVAILABLE
            }
        }


# Helper functions for standalone usage
async def process_single_drawing(image_path: str, context: str = "", 
                               output_formats: List[str] = None) -> ProcessingResult:
    """Helper function to process a single technical drawing"""
    config = PipelineConfig(output_formats=output_formats or ["json", "excel"])
    pipeline = DataStructuringPipeline(config)
    return await pipeline.process_single_image(image_path, context)

async def process_multiple_drawings(image_paths: List[str], context: str = "", 
                                  output_formats: List[str] = None) -> Dict[str, Any]:
    """Helper function to process multiple technical drawings"""
    config = PipelineConfig(output_formats=output_formats or ["json", "excel"])
    pipeline = DataStructuringPipeline(config)
    return await pipeline.process_batch(image_paths, context)


if __name__ == "__main__":
    # Demo usage
    async def demo():
        print("🔥 DATA STRUCTURING PIPELINE DEMO")
        
        # Setup configuration
        config = PipelineConfig(
            output_formats=["json", "excel", "csv"],
            export_directory="demo_output",
            max_concurrent_tasks=2
        )
        
        pipeline = DataStructuringPipeline(config)
        
        # Demo with sample image (if it exists)
        test_images = [
            "../sample_images/sample_engineering_drawing.png",
            "../sample_images/sample_engineering_text.png"
        ]
        
        existing_images = [img for img in test_images if os.path.exists(img)]
        
        if existing_images:
            print(f"\n📸 Processing {len(existing_images)} images...")
            
            # Process batch
            results = await pipeline.process_batch(
                existing_images, 
                "Demo technical drawing analysis"
            )
            
            # Print summary
            print("\n📊 PIPELINE RESULTS SUMMARY:")
            print("=" * 40)
            summary = results['batch_summary']
            print(f"⚡ Total Time: {summary['total_processing_time']:.2f}s")
            print(f"🏆 Success Rate: {summary['success_rate']:.1f}%")
            print(f"📈 Throughput: {summary['throughput_images_per_minute']:.1f} images/min")
            
            # System statistics
            stats = pipeline.get_system_statistics()
            print(f"\n🔧 System Status:")
            print(f"   Active Pipelines: {stats['active_pipelines']}")
            print(f"   Completed Pipelines: {stats['completed_pipelines']}")
            print(f"   Average Processing Time: {stats['pipeline_stats']['average_processing_time']:.2f}s")
            
        else:
            print("❌ No test images found for demo")
            print("Please ensure sample images are available in ../sample_images/")
    
    # Run demo
    asyncio.run(demo())