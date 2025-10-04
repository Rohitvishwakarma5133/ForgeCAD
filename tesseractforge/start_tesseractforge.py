#!/usr/bin/env python3
"""
TesseractForge Startup Script
Simple script to start TesseractForge with different modes
"""

import sys
import os
import asyncio
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def print_banner():
    """Print TesseractForge banner"""
    banner = """
    ╔════════════════════════════════════════════════════════════════════╗
    ║                          TesseractForge                            ║
    ║                AI-Powered Technical Drawing Analysis               ║
    ║                                                                    ║
    ║  🔧 Multi-Engine OCR  📊 Symbol Detection  🧠 AI Analysis        ║
    ║  📄 Smart Export      🚀 Web API          ⚡ Batch Processing    ║
    ╚════════════════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_environment():
    """Check if environment is properly configured"""
    issues = []
    
    # Check for API keys
    if not os.getenv('OPENAI_API_KEY'):
        issues.append("❌ OPENAI_API_KEY not found in environment")
    else:
        print("✅ OpenAI API key configured")
    
    if not os.getenv('ANTHROPIC_API_KEY'):
        issues.append("❌ ANTHROPIC_API_KEY not found in environment")
    else:
        print("✅ Anthropic API key configured")
    
    # Check for required directories
    required_dirs = ['uploads', 'output', 'logs', 'temp']
    for directory in required_dirs:
        if not Path(directory).exists():
            Path(directory).mkdir(parents=True, exist_ok=True)
            print(f"📁 Created directory: {directory}")
        else:
            print(f"✅ Directory exists: {directory}")
    
    # Check for config file
    if not Path('config.yaml').exists():
        issues.append("⚠️  config.yaml not found (will use defaults)")
    else:
        print("✅ Configuration file found")
    
    if issues:
        print("\n⚠️  Environment Issues:")
        for issue in issues:
            print(f"   {issue}")
        print("\n💡 To fix:")
        print("   1. Copy .env.example to .env.local")
        print("   2. Add your API keys to .env.local")
        print("   3. Load environment: set -a; source .env.local; set +a")
        return False
    
    print("\n✅ Environment looks good!")
    return True

def show_usage():
    """Show usage instructions"""
    usage = """
🚀 TesseractForge Usage:

📋 Quick Start:
   python start_tesseractforge.py server        # Start web server
   python start_tesseractforge.py test          # Run system test
   python start_tesseractforge.py process <image>  # Process single image

🔧 Available Commands:
   server          - Start the web API server (default port 8000)
   test            - Run installation and functionality tests
   process <file>  - Process a single image file
   batch <files>   - Process multiple image files
   help            - Show this help message

📡 API Examples:
   Server: http://localhost:8000
   Health: http://localhost:8000/health
   Docs:   http://localhost:8000/docs

📁 File Locations:
   Config:  config.yaml
   Env:     .env.local
   Logs:    logs/
   Output:  output/
   Uploads: uploads/

🔑 Required API Keys:
   - OpenAI API Key (GPT-4 Vision)
   - Anthropic API Key (Claude AI)
   - Google AI Studio Key (optional)
   - Autodesk API Key (optional)
    """
    print(usage)

async def main():
    """Main startup function"""
    print_banner()
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("🤖 Welcome to TesseractForge!")
        print("\nChecking environment...")
        
        if check_environment():
            print("\n🚀 Ready to start! Choose a command:")
            show_usage()
        else:
            print("\n❌ Please fix the environment issues above first.")
        return
    
    command = sys.argv[1].lower()
    
    if command == 'help' or command == '--help' or command == '-h':
        show_usage()
        return
    
    if command == 'test':
        print("🧪 Running system tests...")
        try:
            import test_installation
            await test_installation.main()
        except ImportError:
            print("❌ Test module not found")
        except Exception as e:
            print(f"❌ Test failed: {e}")
        return
    
    if command == 'server':
        print("🌐 Starting TesseractForge web server...")
        if not check_environment():
            print("❌ Please fix environment issues first")
            return
        
        try:
            from main_application import TesseractForgeApp, create_web_app
            import uvicorn
            
            app = TesseractForgeApp()
            web_app = create_web_app(app)
            
            host = os.getenv('TESSERACT_HOST', '0.0.0.0')
            port = int(os.getenv('TESSERACT_PORT', 8000))
            
            print(f"🚀 Server starting on http://{host}:{port}")
            print("📖 API Documentation: http://localhost:8000/docs")
            print("❤️  Health Check: http://localhost:8000/health")
            
            uvicorn.run(web_app, host=host, port=port, workers=1)
            
        except ImportError as e:
            print(f"❌ Failed to import modules: {e}")
            print("💡 Try running: python test_tesseractforge.py first")
        except Exception as e:
            print(f"❌ Server startup failed: {e}")
        return
    
    if command == 'process':
        if len(sys.argv) < 3:
            print("❌ Please specify an image file to process")
            print("💡 Usage: python start_tesseractforge.py process image.jpg")
            return
        
        image_file = sys.argv[2]
        if not Path(image_file).exists():
            print(f"❌ Image file not found: {image_file}")
            return
        
        print(f"🖼️  Processing image: {image_file}")
        if not check_environment():
            print("❌ Please fix environment issues first")
            return
        
        try:
            from main_application import TesseractForgeApp
            app = TesseractForgeApp()
            
            print("⚙️  Starting processing pipeline...")
            result = await app.process_single_image(image_file)
            
            if result['status'] == 'success':
                print("✅ Processing completed successfully!")
                print(f"⏱️  Processing time: {result['processing_time']:.2f} seconds")
                
                # Auto-export results
                export_result = await app.export_results(
                    result['results'],
                    formats=['json', 'excel'],
                    output_dir='output'
                )
                
                if export_result['status'] == 'success':
                    print("📄 Results exported to output/ directory")
                else:
                    print(f"⚠️  Export warning: {export_result.get('error', 'Unknown issue')}")
                    
            else:
                print(f"❌ Processing failed: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Processing error: {e}")
        return
    
    if command == 'batch':
        if len(sys.argv) < 3:
            print("❌ Please specify image files to process")
            print("💡 Usage: python start_tesseractforge.py batch *.jpg")
            return
        
        image_files = sys.argv[2:]
        valid_files = [f for f in image_files if Path(f).exists()]
        
        if not valid_files:
            print("❌ No valid image files found")
            return
        
        print(f"📦 Processing {len(valid_files)} images in batch...")
        if not check_environment():
            print("❌ Please fix environment issues first")
            return
        
        try:
            from main_application import TesseractForgeApp
            app = TesseractForgeApp()
            
            result = await app.process_batch_images(valid_files)
            
            if result['status'] == 'success':
                print("✅ Batch processing completed!")
                print(f"⏱️  Total processing time: {result['processing_time']:.2f} seconds")
                
                # Auto-export results
                export_result = await app.export_results(
                    result['results'],
                    formats=['json', 'excel'],
                    output_dir='output'
                )
                
                if export_result['status'] == 'success':
                    print("📄 Results exported to output/ directory")
                    
            else:
                print(f"❌ Batch processing failed: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Batch processing error: {e}")
        return
    
    # Unknown command
    print(f"❌ Unknown command: {command}")
    show_usage()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)