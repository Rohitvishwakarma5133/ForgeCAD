"""
TesseractForge Main Application
Integrates all components into a cohesive AI-powered technical drawing analysis pipeline
"""

import asyncio
import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import argparse
import yaml

from loguru import logger
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import our modules
try:
    from comprehensive_ai_ocr import ComprehensiveOCRModule
    from enhanced_symbol_detection import EnhancedSymbolDetection
    from semantic_understanding import SemanticUnderstandingModule  
    from data_pipeline import DataProcessingPipeline
    from export_module import ExportModule
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    sys.exit(1)

class TesseractForgeApp:
    """
    Main application class that orchestrates the entire pipeline
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.setup_logging()
        
        # Initialize all modules
        logger.info("Initializing TesseractForge modules...")
        self.ocr_module = ComprehensiveOCRModule(config=self.config.get('ocr', {}))
        self.symbol_detector = EnhancedSymbolDetection(config=self.config.get('symbol_detection', {}))
        self.semantic_module = SemanticUnderstandingModule(config=self.config.get('semantic', {}))
        self.data_pipeline = DataProcessingPipeline(config=self.config.get('pipeline', {}))
        self.export_module = ExportModule(config=self.config.get('export', {}))
        
        # Application state
        self.processing_jobs = {}
        self.job_counter = 0
        
        logger.success("TesseractForge application initialized successfully")
    
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file or use defaults"""
        default_config = {
            'ocr': {
                'engines': ['openai', 'tesseract', 'easyocr'],
                'max_concurrent': 3,
                'timeout': 30
            },
            'symbol_detection': {
                'use_opencv': True,
                'use_yolo': True,
                'min_confidence': 0.7
            },
            'semantic': {
                'use_openai': True,
                'use_claude': True,
                'temperature': 0.1
            },
            'pipeline': {
                'max_concurrent_jobs': 5,
                'batch_size': 10,
                'retry_attempts': 3
            },
            'export': {
                'default_formats': ['excel', 'pdf', 'json'],
                'output_dir': 'output'
            },
            'server': {
                'host': '0.0.0.0',
                'port': 8000,
                'workers': 1
            }
        }
        
        if config_path and Path(config_path).exists():
            try:
                with open(config_path, 'r') as f:
                    if config_path.endswith('.yaml') or config_path.endswith('.yml'):
                        user_config = yaml.safe_load(f)
                    else:
                        user_config = json.load(f)
                
                # Merge configurations
                for key, value in user_config.items():
                    if isinstance(value, dict) and key in default_config:
                        default_config[key].update(value)
                    else:
                        default_config[key] = value
                        
                logger.info(f"Configuration loaded from {config_path}")
            except Exception as e:
                logger.warning(f"Failed to load config from {config_path}: {e}. Using defaults.")
        
        return default_config
    
    def setup_logging(self):
        """Setup logging configuration"""
        logger.remove()  # Remove default handler
        logger.add(
            sys.stdout,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level="INFO"
        )
        logger.add(
            "logs/tesseractforge_{time}.log",
            rotation="1 day",
            retention="30 days",
            level="DEBUG"
        )
    
    async def process_single_image(self, 
                                 image_path: str, 
                                 options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a single image through the complete pipeline
        
        Args:
            image_path: Path to the image file
            options: Processing options and parameters
            
        Returns:
            Complete analysis results
        """
        try:
            logger.info(f"Starting processing for image: {image_path}")
            start_time = time.time()
            
            options = options or {}
            results = {
                'input_image': image_path,
                'timestamp': datetime.now().isoformat(),
                'processing_options': options
            }
            
            # Step 1: OCR Text Extraction
            logger.info("Step 1: OCR text extraction")
            ocr_results = await self.ocr_module.process_image(image_path)
            results['ocr_results'] = ocr_results
            logger.success(f"OCR completed with {len(ocr_results)} engine results")
            
            # Step 2: Symbol Detection
            logger.info("Step 2: Symbol detection")
            symbol_results = await self.symbol_detector.detect_symbols(image_path)
            results['symbol_results'] = symbol_results
            logger.success(f"Symbol detection completed, found {len(symbol_results.get('detected_symbols', []))} symbols")
            
            # Step 3: Semantic Understanding
            logger.info("Step 3: Semantic analysis")
            semantic_input = {
                'image_path': image_path,
                'ocr_results': ocr_results,
                'symbol_results': symbol_results
            }
            semantic_results = await self.semantic_module.analyze_comprehensive(semantic_input)
            results['semantic_results'] = semantic_results
            logger.success("Semantic analysis completed")
            
            # Step 4: Data Processing and Structuring
            logger.info("Step 4: Data structuring")
            structured_data = await self.data_pipeline.process_single_image(
                image_path, 
                {
                    'ocr_results': ocr_results,
                    'symbol_results': symbol_results,
                    'semantic_results': semantic_results
                }
            )
            results.update(structured_data)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            results['processing_time'] = round(processing_time, 2)
            
            logger.success(f"Single image processing completed in {processing_time:.2f} seconds")
            return {
                'status': 'success',
                'results': results,
                'processing_time': processing_time
            }
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'image_path': image_path,
                'timestamp': datetime.now().isoformat()
            }
    
    async def process_batch_images(self, 
                                 image_paths: List[str], 
                                 options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process multiple images through the pipeline with batch optimization
        
        Args:
            image_paths: List of image file paths
            options: Processing options and parameters
            
        Returns:
            Batch processing results
        """
        try:
            logger.info(f"Starting batch processing for {len(image_paths)} images")
            start_time = time.time()
            
            options = options or {}
            batch_results = {
                'input_images': image_paths,
                'timestamp': datetime.now().isoformat(),
                'processing_options': options,
                'individual_results': [],
                'batch_summary': {}
            }
            
            # Use the data pipeline for batch processing
            pipeline_results = await self.data_pipeline.process_batch(image_paths, options)
            
            batch_results['individual_results'] = pipeline_results.get('results', [])
            batch_results['batch_summary'] = pipeline_results.get('summary', {})
            
            # Calculate total processing time
            processing_time = time.time() - start_time
            batch_results['total_processing_time'] = round(processing_time, 2)
            
            logger.success(f"Batch processing completed for {len(image_paths)} images in {processing_time:.2f} seconds")
            return {
                'status': 'success',
                'results': batch_results,
                'processing_time': processing_time
            }
            
        except Exception as e:
            logger.error(f"Error in batch processing: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'image_paths': image_paths,
                'timestamp': datetime.now().isoformat()
            }
    
    async def export_results(self, 
                           results: Dict[str, Any], 
                           formats: List[str] = None,
                           output_dir: str = None) -> Dict[str, Any]:
        """
        Export results to specified formats
        
        Args:
            results: Processing results to export
            formats: List of export formats ('excel', 'pdf', 'json', 'autodesk')
            output_dir: Output directory for exported files
            
        Returns:
            Export results
        """
        try:
            formats = formats or self.config['export']['default_formats']
            output_dir = output_dir or self.config['export']['output_dir']
            
            logger.info(f"Exporting results to formats: {formats}")
            
            export_results = await self.export_module.batch_export(
                results, 
                output_dir, 
                formats
            )
            
            logger.success(f"Export completed to {output_dir}")
            return export_results
            
        except Exception as e:
            logger.error(f"Error during export: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def create_processing_job(self, 
                                  job_data: Dict[str, Any]) -> str:
        """
        Create and start a background processing job
        
        Args:
            job_data: Job configuration and parameters
            
        Returns:
            Job ID
        """
        self.job_counter += 1
        job_id = f"job_{self.job_counter}_{int(time.time())}"
        
        self.processing_jobs[job_id] = {
            'id': job_id,
            'status': 'queued',
            'created_at': datetime.now().isoformat(),
            'job_data': job_data,
            'results': None,
            'error': None,
            'progress': 0
        }
        
        # Start processing in background
        asyncio.create_task(self._run_background_job(job_id))
        
        logger.info(f"Created processing job: {job_id}")
        return job_id
    
    async def _run_background_job(self, job_id: str):
        """Run a processing job in the background"""
        try:
            job = self.processing_jobs[job_id]
            job['status'] = 'processing'
            job['started_at'] = datetime.now().isoformat()
            
            job_data = job['job_data']
            
            if 'single_image' in job_data:
                # Single image processing
                results = await self.process_single_image(
                    job_data['single_image'],
                    job_data.get('options', {})
                )
            elif 'batch_images' in job_data:
                # Batch processing
                results = await self.process_batch_images(
                    job_data['batch_images'],
                    job_data.get('options', {})
                )
            else:
                raise ValueError("Invalid job data: no images specified")
            
            job['results'] = results
            job['status'] = 'completed'
            job['completed_at'] = datetime.now().isoformat()
            job['progress'] = 100
            
            # Auto-export if requested
            if job_data.get('auto_export', False):
                export_results = await self.export_results(
                    results.get('results', {}),
                    job_data.get('export_formats', ['json']),
                    job_data.get('output_dir')
                )
                job['export_results'] = export_results
            
            logger.success(f"Background job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Background job {job_id} failed: {str(e)}")
            job['status'] = 'failed'
            job['error'] = str(e)
            job['failed_at'] = datetime.now().isoformat()
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get the status of a processing job"""
        if job_id not in self.processing_jobs:
            return {
                'status': 'not_found',
                'error': f'Job {job_id} not found'
            }
        
        return self.processing_jobs[job_id]
    
    def list_jobs(self) -> List[Dict[str, Any]]:
        """List all processing jobs"""
        return list(self.processing_jobs.values())
    
    async def cleanup_completed_jobs(self, max_age_hours: int = 24):
        """Clean up old completed jobs"""
        current_time = datetime.now()
        jobs_to_remove = []
        
        for job_id, job in self.processing_jobs.items():
            if job['status'] in ['completed', 'failed']:
                created_at = datetime.fromisoformat(job['created_at'])
                age_hours = (current_time - created_at).total_seconds() / 3600
                
                if age_hours > max_age_hours:
                    jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            del self.processing_jobs[job_id]
        
        if jobs_to_remove:
            logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")

# FastAPI Web Application
def create_web_app(tesseract_app: TesseractForgeApp) -> FastAPI:
    """Create FastAPI web application"""
    
    app = FastAPI(
        title="TesseractForge API",
        description="AI-powered technical drawing analysis pipeline",
        version="1.0.0"
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Pydantic models
    class ProcessImageRequest(BaseModel):
        image_path: str
        options: Optional[Dict[str, Any]] = {}
        auto_export: bool = False
        export_formats: List[str] = ['json']
        output_dir: Optional[str] = None
    
    class ProcessBatchRequest(BaseModel):
        image_paths: List[str]
        options: Optional[Dict[str, Any]] = {}
        auto_export: bool = False
        export_formats: List[str] = ['json']
        output_dir: Optional[str] = None
    
    class ExportRequest(BaseModel):
        results: Dict[str, Any]
        formats: List[str] = ['excel', 'pdf', 'json']
        output_dir: Optional[str] = None
    
    # API Routes
    @app.get("/")
    async def root():
        return {
            "message": "TesseractForge API",
            "version": "1.0.0",
            "status": "operational"
        }
    
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "active_jobs": len([j for j in tesseract_app.processing_jobs.values() if j['status'] == 'processing'])
        }
    
    @app.post("/process/single")
    async def process_single_image_endpoint(request: ProcessImageRequest, background_tasks: BackgroundTasks):
        """Process a single image"""
        try:
            if request.auto_export:
                # Create background job
                job_data = {
                    'single_image': request.image_path,
                    'options': request.options,
                    'auto_export': True,
                    'export_formats': request.export_formats,
                    'output_dir': request.output_dir
                }
                job_id = await tesseract_app.create_processing_job(job_data)
                return {
                    "message": "Processing job created",
                    "job_id": job_id,
                    "status": "queued"
                }
            else:
                # Process synchronously
                results = await tesseract_app.process_single_image(request.image_path, request.options)
                return results
                
        except Exception as e:
            logger.error(f"API error in single image processing: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/process/batch")
    async def process_batch_images_endpoint(request: ProcessBatchRequest):
        """Process multiple images"""
        try:
            if request.auto_export:
                # Create background job
                job_data = {
                    'batch_images': request.image_paths,
                    'options': request.options,
                    'auto_export': True,
                    'export_formats': request.export_formats,
                    'output_dir': request.output_dir
                }
                job_id = await tesseract_app.create_processing_job(job_data)
                return {
                    "message": "Batch processing job created",
                    "job_id": job_id,
                    "status": "queued"
                }
            else:
                # Process synchronously (not recommended for large batches)
                results = await tesseract_app.process_batch_images(request.image_paths, request.options)
                return results
                
        except Exception as e:
            logger.error(f"API error in batch processing: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/export")
    async def export_results_endpoint(request: ExportRequest):
        """Export processing results"""
        try:
            results = await tesseract_app.export_results(
                request.results,
                request.formats,
                request.output_dir
            )
            return results
            
        except Exception as e:
            logger.error(f"API error in export: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/jobs/{job_id}")
    async def get_job_status_endpoint(job_id: str):
        """Get job status"""
        return tesseract_app.get_job_status(job_id)
    
    @app.get("/jobs")
    async def list_jobs_endpoint():
        """List all jobs"""
        return tesseract_app.list_jobs()
    
    @app.post("/upload")
    async def upload_file(file: UploadFile = File(...)):
        """Upload a file for processing"""
        try:
            # Save uploaded file
            upload_dir = Path("uploads")
            upload_dir.mkdir(exist_ok=True)
            
            file_path = upload_dir / file.filename
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            return {
                "message": "File uploaded successfully",
                "filename": file.filename,
                "file_path": str(file_path),
                "size": len(content)
            }
            
        except Exception as e:
            logger.error(f"File upload error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    return app

# Command Line Interface
def create_cli():
    """Create command line interface"""
    parser = argparse.ArgumentParser(description="TesseractForge - AI-powered technical drawing analysis")
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Server command
    server_parser = subparsers.add_parser('server', help='Start the web server')
    server_parser.add_argument('--host', default='0.0.0.0', help='Server host')
    server_parser.add_argument('--port', type=int, default=8000, help='Server port')
    server_parser.add_argument('--config', help='Configuration file path')
    
    # Process command
    process_parser = subparsers.add_parser('process', help='Process image(s)')
    process_parser.add_argument('images', nargs='+', help='Image file path(s)')
    process_parser.add_argument('--config', help='Configuration file path')
    process_parser.add_argument('--export', nargs='+', default=['json'], 
                               choices=['excel', 'pdf', 'json', 'autodesk'],
                               help='Export formats')
    process_parser.add_argument('--output-dir', default='output', help='Output directory')
    process_parser.add_argument('--batch', action='store_true', help='Process as batch')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export existing results')
    export_parser.add_argument('results_file', help='Results JSON file path')
    export_parser.add_argument('--formats', nargs='+', default=['excel', 'pdf'],
                              choices=['excel', 'pdf', 'json', 'autodesk'],
                              help='Export formats')
    export_parser.add_argument('--output-dir', default='output', help='Output directory')
    
    return parser

async def main():
    """Main application entry point"""
    parser = create_cli()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize application
    app = TesseractForgeApp(config_path=getattr(args, 'config', None))
    
    if args.command == 'server':
        # Start web server
        logger.info(f"Starting TesseractForge server on {args.host}:{args.port}")
        web_app = create_web_app(app)
        uvicorn.run(web_app, host=args.host, port=args.port, workers=1)
        
    elif args.command == 'process':
        # Process images
        if args.batch or len(args.images) > 1:
            logger.info(f"Processing {len(args.images)} images as batch")
            results = await app.process_batch_images(args.images)
        else:
            logger.info(f"Processing single image: {args.images[0]}")
            results = await app.process_single_image(args.images[0])
        
        # Export results
        if results['status'] == 'success':
            export_results = await app.export_results(
                results['results'],
                args.export,
                args.output_dir
            )
            logger.success(f"Results exported to {args.output_dir}")
        else:
            logger.error(f"Processing failed: {results.get('error', 'Unknown error')}")
    
    elif args.command == 'export':
        # Export existing results
        try:
            with open(args.results_file, 'r') as f:
                results = json.load(f)
            
            export_results = await app.export_results(
                results,
                args.formats,
                args.output_dir
            )
            logger.success(f"Results exported to {args.output_dir}")
            
        except Exception as e:
            logger.error(f"Export failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())