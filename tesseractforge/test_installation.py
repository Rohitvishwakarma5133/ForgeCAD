"""
TesseractForge Installation Test Script
Verifies that all components are properly installed and configured
"""

import asyncio
import os
import sys
from pathlib import Path
import json

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing module imports...")
    
    try:
        from comprehensive_ai_ocr import ComprehensiveOCRModule
        print("✓ OCR module imported successfully")
    except ImportError as e:
        print(f"✗ OCR module import failed: {e}")
        return False
    
    try:
        from enhanced_symbol_detection import EnhancedSymbolDetection
        print("✓ Symbol detection module imported successfully")
    except ImportError as e:
        print(f"✗ Symbol detection module import failed: {e}")
        return False
    
    try:
        from semantic_understanding import SemanticUnderstandingModule
        print("✓ Semantic understanding module imported successfully")
    except ImportError as e:
        print(f"✗ Semantic understanding module import failed: {e}")
        return False
    
    try:
        from data_pipeline import DataProcessingPipeline
        print("✓ Data pipeline module imported successfully")
    except ImportError as e:
        print(f"✗ Data pipeline module import failed: {e}")
        return False
    
    try:
        from export_module import ExportModule
        print("✓ Export module imported successfully")
    except ImportError as e:
        print(f"✗ Export module import failed: {e}")
        return False
    
    try:
        from main_application import TesseractForgeApp
        print("✓ Main application imported successfully")
    except ImportError as e:
        print(f"✗ Main application import failed: {e}")
        return False
    
    return True

def test_environment():
    """Test environment configuration"""
    print("\nTesting environment configuration...")
    
    # Check for required directories
    required_dirs = ['uploads', 'output', 'logs', 'temp']
    for dir_name in required_dirs:
        if not os.path.exists(dir_name):
            print(f"Creating missing directory: {dir_name}")
            os.makedirs(dir_name, exist_ok=True)
        else:
            print(f"✓ Directory exists: {dir_name}")
    
    # Check for configuration files
    config_files = ['.env.local', 'config.yaml']
    for config_file in config_files:
        if os.path.exists(config_file):
            print(f"✓ Configuration file exists: {config_file}")
        else:
            print(f"⚠ Configuration file missing: {config_file}")
    
    # Check for environment variables
    required_env_vars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY']
    for var in required_env_vars:
        if os.getenv(var):
            print(f"✓ Environment variable set: {var}")
        else:
            print(f"⚠ Environment variable missing: {var}")
    
    return True

def test_dependencies():
    """Test if all required dependencies are installed"""
    print("\nTesting Python dependencies...")
    
    required_packages = [
        'openai', 'anthropic', 'opencv-python', 'pillow', 'numpy',
        'pandas', 'xlsxwriter', 'reportlab', 'fastapi', 'uvicorn',
        'loguru', 'aiohttp', 'transformers', 'torch'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ Package available: {package}")
        except ImportError:
            print(f"✗ Package missing: {package}")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\nMissing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    return True

async def test_basic_functionality():
    """Test basic functionality of core components"""
    print("\nTesting basic functionality...")
    
    try:
        # Test main application initialization
        from main_application import TesseractForgeApp
        app = TesseractForgeApp()
        print("✓ Main application initialized successfully")
        
        # Test export module
        from export_module import ExportModule
        export_module = ExportModule()
        
        # Create sample data for testing
        sample_data = {
            'processed_images': ['test_image.jpg'],
            'ocr_results': {
                'test_engine': {
                    'text': 'Test OCR result',
                    'confidence': 0.95
                }
            },
            'symbol_results': {
                'detected_symbols': [
                    {'type': 'circle', 'count': 1, 'confidence': 0.90}
                ]
            },
            'semantic_results': {
                'technical_specs': {
                    'test_spec': 'Test value'
                }
            },
            'components': [
                {'id': 'TEST001', 'type': 'Test Component', 'quantity': 1}
            ],
            'processing_time': 1.0
        }
        
        # Test JSON export
        test_output_dir = Path('temp')
        test_output_dir.mkdir(exist_ok=True)
        
        json_result = await export_module._export_to_json(
            sample_data, 
            str(test_output_dir / 'test_export.json')
        )
        
        if json_result['status'] == 'success':
            print("✓ JSON export functionality working")
            
            # Clean up test file
            test_file = Path(json_result['output_path'])
            if test_file.exists():
                test_file.unlink()
        else:
            print(f"✗ JSON export failed: {json_result.get('error', 'Unknown error')}")
            return False
        
        print("✓ Basic functionality tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Basic functionality test failed: {str(e)}")
        return False

def test_configuration():
    """Test configuration loading"""
    print("\nTesting configuration...")
    
    try:
        from main_application import TesseractForgeApp
        
        # Test default configuration
        app = TesseractForgeApp()
        print("✓ Default configuration loaded successfully")
        
        # Test with config file if it exists
        if os.path.exists('config.yaml'):
            app_with_config = TesseractForgeApp(config_path='config.yaml')
            print("✓ YAML configuration loaded successfully")
        else:
            print("⚠ config.yaml not found, using defaults")
        
        return True
        
    except Exception as e:
        print(f"✗ Configuration test failed: {str(e)}")
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("TesseractForge Installation Test")
    print("=" * 60)
    
    test_results = []
    
    # Run all tests
    test_results.append(("Import Test", test_imports()))
    test_results.append(("Environment Test", test_environment()))
    test_results.append(("Dependencies Test", test_dependencies()))
    test_results.append(("Configuration Test", test_configuration()))
    test_results.append(("Basic Functionality Test", await test_basic_functionality()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed_tests = 0
    for test_name, result in test_results:
        status = "PASSED" if result else "FAILED"
        print(f"{test_name:<30} {status}")
        if result:
            passed_tests += 1
    
    print(f"\nTests passed: {passed_tests}/{len(test_results)}")
    
    if passed_tests == len(test_results):
        print("\n🎉 All tests passed! TesseractForge is ready to use.")
        print("\nNext steps:")
        print("1. Configure your API keys in .env.local")
        print("2. Review and adjust config.yaml settings")
        print("3. Test with a sample image:")
        print("   python main_application.py process sample_image.jpg")
        print("4. Or start the web server:")
        print("   python main_application.py server")
    else:
        print("\n⚠️  Some tests failed. Please address the issues above before using TesseractForge.")
        print("\nCommon solutions:")
        print("- Install missing packages: pip install -r requirements.txt")
        print("- Create missing directories manually")
        print("- Configure API keys in .env.local")
        print("- Check Python version (3.11+ recommended)")
    
    return passed_tests == len(test_results)

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error during testing: {str(e)}")
        sys.exit(1)