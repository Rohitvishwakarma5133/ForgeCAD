# TesseractForge - AI-Powered Technical Drawing Analysis Pipeline

TesseractForge is a comprehensive AI-powered system for analyzing technical drawings and engineering schematics. It combines multiple OCR engines, computer vision, and advanced AI models to extract, understand, and export technical information from images.

## 🚀 Features

### Multi-Engine OCR
- **OpenAI GPT-4 Vision**: State-of-the-art image-to-text conversion
- **Tesseract OCR**: Traditional OCR with high accuracy
- **EasyOCR**: Deep learning-based text recognition
- **TrOCR**: Transformer-based OCR for complex layouts

### Advanced Symbol Detection
- **OpenCV-based detection**: Geometric shape recognition
- **YOLOv8 integration**: Object detection for technical symbols
- **Custom symbol libraries**: Extensible symbol recognition

### AI-Powered Semantic Understanding
- **GPT-4 Vision API**: Comprehensive drawing analysis
- **Claude AI**: Alternative AI analysis for validation
- **Technical specification extraction**: Automatic identification of dimensions, materials, specifications
- **Component identification**: Automatic parts and assembly detection

### Comprehensive Export Options
- **Excel**: Multi-worksheet reports with formatting and charts
- **PDF**: Professional technical reports with visualizations  
- **JSON**: Structured data for further processing
- **Autodesk API**: Direct integration with Autodesk platforms

### Enterprise Features
- **Batch processing**: Handle multiple drawings simultaneously
- **Background jobs**: Asynchronous processing with progress tracking
- **Web API**: RESTful API for integration
- **Configurable pipeline**: Customizable processing workflows

## 📋 Prerequisites

- Python 3.11+
- Windows 10/11 (tested) or Linux/macOS
- API Keys for:
  - OpenAI (GPT-4 Vision)
  - Anthropic (Claude AI)
  - Google AI Studio (optional)
  - Autodesk (optional)

## 🛠️ Installation

1. **Clone and Navigate**:
   ```bash
   cd C:\Users\Rohit Kumar\Desktop\cadly\tesseractforge
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**:
   - Copy `.env.example` to `.env.local`
   - Add your API keys to `.env.local`

4. **Create Required Directories**:
   ```bash
   mkdir uploads output logs temp
   ```

## ⚙️ Configuration

### Environment Variables (.env.local)
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=2000

# Claude AI Configuration  
ANTHROPIC_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-sonnet-20240229
CLAUDE_MAX_TOKENS=2000

# Google AI Studio (Optional)
GOOGLE_AI_API_KEY=your_google_api_key_here

# Autodesk API (Optional)
AUTODESK_CLIENT_ID=your_autodesk_client_id
AUTODESK_CLIENT_SECRET=your_autodesk_client_secret
```

### Configuration File (config.yaml)
The system uses a comprehensive YAML configuration file. Key sections include:

- **OCR Settings**: Engine preferences and timeout configurations
- **Symbol Detection**: OpenCV and YOLO parameters
- **AI Models**: Temperature, token limits, and model selections
- **Export Options**: Format-specific settings and output preferences
- **Performance**: Memory, GPU, and processing optimization

## 🚀 Usage

### Command Line Interface

#### 1. Start Web Server
```bash
python main_application.py server --host 0.0.0.0 --port 8000 --config config.yaml
```

#### 2. Process Single Image
```bash
python main_application.py process image.jpg --export excel pdf json --output-dir output
```

#### 3. Process Multiple Images (Batch)
```bash
python main_application.py process *.jpg --batch --export excel pdf --output-dir output
```

#### 4. Export Existing Results
```bash
python main_application.py export results.json --formats excel pdf autodesk --output-dir exports
```

### Web API Usage

#### Start the Server
```bash
python main_application.py server
```

#### API Endpoints

**Process Single Image (Synchronous)**:
```bash
curl -X POST "http://localhost:8000/process/single" \
     -H "Content-Type: application/json" \
     -d '{
       "image_path": "path/to/image.jpg",
       "options": {},
       "auto_export": false
     }'
```

**Process Single Image (Background Job)**:
```bash
curl -X POST "http://localhost:8000/process/single" \
     -H "Content-Type: application/json" \
     -d '{
       "image_path": "path/to/image.jpg",
       "auto_export": true,
       "export_formats": ["excel", "pdf"],
       "output_dir": "output"
     }'
```

**Process Batch Images**:
```bash
curl -X POST "http://localhost:8000/process/batch" \
     -H "Content-Type: application/json" \
     -d '{
       "image_paths": ["image1.jpg", "image2.jpg"],
       "auto_export": true,
       "export_formats": ["excel", "pdf", "json"]
     }'
```

**Upload File**:
```bash
curl -X POST "http://localhost:8000/upload" \
     -F "file=@drawing.jpg"
```

**Check Job Status**:
```bash
curl "http://localhost:8000/jobs/job_1_1673123456"
```

**List All Jobs**:
```bash
curl "http://localhost:8000/jobs"
```

### Python Integration

```python
import asyncio
from main_application import TesseractForgeApp

async def main():
    # Initialize application
    app = TesseractForgeApp(config_path='config.yaml')
    
    # Process single image
    result = await app.process_single_image(
        'technical_drawing.jpg',
        options={'enhance_image': True}
    )
    
    # Export results
    if result['status'] == 'success':
        export_result = await app.export_results(
            result['results'],
            formats=['excel', 'pdf'],
            output_dir='output'
        )
        print(f"Export completed: {export_result}")

# Run the example
asyncio.run(main())
```

## 📊 Output Structure

### Processing Results
The system generates comprehensive analysis results:

```json
{
  "status": "success",
  "results": {
    "input_image": "drawing.jpg",
    "timestamp": "2024-01-15T10:30:00",
    "processing_time": 45.2,
    
    "ocr_results": {
      "openai": {
        "text": "Extracted text from OpenAI",
        "confidence": 0.95,
        "coordinates": [[x1,y1,x2,y2], ...]
      },
      "tesseract": {
        "text": "Extracted text from Tesseract",
        "confidence": 0.87
      }
    },
    
    "symbol_results": {
      "detected_symbols": [
        {
          "type": "circle",
          "count": 3,
          "confidence": 0.92,
          "coordinates": [[x,y,w,h], ...]
        }
      ]
    },
    
    "semantic_results": {
      "technical_specifications": {
        "dimensions": "100mm x 50mm",
        "material": "Steel",
        "tolerance": "±0.1mm"
      },
      "components": [
        {
          "id": "C001",
          "type": "Fastener",
          "quantity": 4,
          "specifications": {
            "size": "M6",
            "length": "20mm"
          }
        }
      ]
    }
  }
}
```

### Export Formats

#### Excel Output
- **Summary Sheet**: Overview and statistics
- **OCR Results**: Text extraction results from all engines
- **Symbol Detection**: Detected symbols and their properties
- **Semantic Analysis**: AI-extracted technical information
- **Components**: Identified parts and specifications
- **Visualizations**: Charts and graphs (optional)

#### PDF Output
- Professional technical report format
- Executive summary
- Detailed analysis sections
- Embedded images and visualizations
- Component tables

#### JSON Output
- Complete structured data
- Machine-readable format
- Preserves all analysis metadata
- Suitable for further processing

#### Autodesk Integration
- Direct upload to Autodesk platform
- Compatible with AutoCAD, Inventor, and Fusion 360
- Metadata preservation
- Project integration

## 🔧 Module Architecture

### Core Modules

1. **comprehensive_ai_ocr.py**: Multi-engine OCR processing
2. **enhanced_symbol_detection.py**: Computer vision symbol detection
3. **semantic_understanding.py**: AI-powered technical analysis
4. **data_pipeline.py**: Batch processing and data orchestration
5. **export_module.py**: Multi-format export capabilities
6. **main_application.py**: Main application and API server

### Key Features per Module

#### OCR Module
- Asynchronous processing
- Engine fallback mechanisms
- Confidence scoring
- Coordinate extraction

#### Symbol Detection
- OpenCV geometric detection
- YOLO object recognition
- Custom symbol training
- Confidence thresholding

#### Semantic Understanding  
- Multi-model AI analysis
- Technical specification extraction
- Component identification
- Design validation

#### Data Pipeline
- Concurrent processing
- Error handling and retries
- Progress tracking
- Result caching

#### Export Module
- Template-based formatting
- Multi-format support
- Batch export capabilities
- API integrations

## 🔍 Performance Optimization

### Image Processing
- Automatic image preprocessing
- Resolution optimization
- Noise reduction
- Contrast enhancement

### Memory Management
- Efficient image caching
- Garbage collection optimization
- Memory usage monitoring

### GPU Acceleration
- CUDA support for compatible operations
- Automatic GPU detection
- Memory fraction control

### Batch Processing
- Optimal batch sizes
- Concurrent processing
- Load balancing
- Progress tracking

## 🛡️ Error Handling

### Robust Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- Detailed error logging
- Continuation on partial failures

### Quality Assurance
- Input validation
- Confidence thresholding
- Processing time limits
- Result verification

## 📈 Monitoring and Logging

### Comprehensive Logging
- Structured logging with Loguru
- Multiple log levels
- File rotation and retention
- Performance metrics

### Health Monitoring
- API health endpoints
- Job status tracking
- Resource usage monitoring
- Error rate tracking

## 🔐 Security

### API Security
- Input validation
- File type restrictions
- Size limits
- Error sanitization

### Data Protection
- Secure API key handling
- Local processing (no data leaves system)
- Temporary file cleanup
- Access logging

## 🤝 Integration Examples

### Web Application Integration
```javascript
// JavaScript example for web integration
const processImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  // Upload file
  const uploadResponse = await fetch('/upload', {
    method: 'POST',
    body: formData
  });
  
  const uploadResult = await uploadResponse.json();
  
  // Process uploaded file
  const processResponse = await fetch('/process/single', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      image_path: uploadResult.file_path,
      auto_export: true,
      export_formats: ['excel', 'pdf']
    })
  });
  
  const processResult = await processResponse.json();
  return processResult;
};
```

### CI/CD Integration
```yaml
# GitHub Actions example
name: Technical Drawing Analysis
on: [push]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup TesseractForge
        run: |
          pip install -r requirements.txt
          python main_application.py process drawings/*.jpg --batch
```

## 🔄 Updates and Maintenance

### Keeping Current
- Regular dependency updates
- API version monitoring
- Model updates and improvements
- Performance optimizations

### Backup and Recovery
- Configuration backup
- Result archiving
- Database backups (if applicable)
- Disaster recovery procedures

## 📞 Support and Troubleshooting

### Common Issues
1. **API Key Errors**: Verify keys in `.env.local`
2. **Memory Issues**: Adjust batch sizes and image caching
3. **Processing Timeouts**: Increase timeout values in config
4. **Export Failures**: Check output directory permissions

### Debug Mode
Enable debug mode in `config.yaml`:
```yaml
development:
  debug_mode: true
  save_intermediate_results: true
  profiling_enabled: true
```

### Log Analysis
Check logs in the `logs/` directory for detailed error information and performance metrics.

## 🔮 Future Enhancements

- Real-time processing dashboard
- Advanced symbol training interface
- Mobile app integration
- Cloud deployment options
- Advanced AI model fine-tuning
- Integration with more CAD platforms

---

**TesseractForge** - Transforming technical drawings into structured, actionable data through AI-powered analysis.