"""
TesseractForge - AI-Powered Technical Drawing Analysis Pipeline
"""

__version__ = "1.0.0"
__author__ = "TesseractForge Team"
__email__ = "support@tesseractforge.com"
__description__ = "AI-powered technical drawing analysis and processing pipeline"

# Import main components for easy access
try:
    from .comprehensive_ai_ocr import ComprehensiveOCRModule
    from .enhanced_symbol_detection import EnhancedSymbolDetection
    from .semantic_understanding import SemanticUnderstandingModule
    from .data_pipeline import DataProcessingPipeline
    from .export_module import ExportModule
    from .main_application import TesseractForgeApp
    
    __all__ = [
        'ComprehensiveOCRModule',
        'EnhancedSymbolDetection', 
        'SemanticUnderstandingModule',
        'DataProcessingPipeline',
        'ExportModule',
        'TesseractForgeApp'
    ]
    
except ImportError as e:
    # During development or if dependencies are missing
    __all__ = []
    import warnings
    warnings.warn(f"Some TesseractForge modules could not be imported: {e}")