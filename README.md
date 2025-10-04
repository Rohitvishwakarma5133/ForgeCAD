# 🔥 Cadly - Ultimate AI Integration Platform

**Complete Technical Drawing Analysis System with Multi-API AI Integration**

## 🎯 Project Overview
Cadly is the ultimate AI-powered platform for technical drawing analysis and CAD file processing. It combines cutting-edge AI technologies including GPT-4 Vision, Claude AI, Google Vision AI, and Autodesk Forge API to deliver unprecedented automation in drawing and datasheet conversions.

### 🏆 Key Features
- **Multi-AI OCR Integration**: OpenAI GPT-4 Vision, Claude AI, Google Vision AI
- **Advanced Symbol Detection**: YOLOv8 + OpenCV for precise geometric analysis
- **Semantic Understanding**: AI-powered interpretation of technical content
- **Professional Export**: Excel, PDF, JSON, CAD-compatible formats
- **Autodesk Forge Integration**: Direct CAD system connectivity
- **Real-time Processing**: Asynchronous pipeline for maximum performance
- **Comprehensive Analytics**: Quality assessment and performance metrics

### 🤖 AI Technologies Integrated
- **OpenAI GPT-4 Vision** - Advanced image understanding and analysis
- **Claude AI (Anthropic)** - Semantic interpretation and reasoning
- **Google Vision AI** - Text detection and document analysis
- **Autodesk Forge API** - CAD file processing and visualization
- **YOLOv8 + OpenCV** - Computer vision and object detection
- **Tesseract + TrOCR** - Traditional and handwriting OCR

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- All API credentials configured

### Setup Instructions

1. **Clone the repository:**
```bash
git clone <repository-url>
cd cadly
```

2. **Set up the Python Backend:**
```bash
cd tesseractforge
pip install -r requirements.txt
```

3. **Configure API Credentials:**
```bash
# Copy environment template
cp .env.example nextjs_frontend/.env.local

# Edit .env.local with your API credentials:
OPENAI_API_KEY=your_openai_key_here
CLAUDE_API_KEY=your_claude_key_here
GOOGLE_AI_API_KEY=your_google_key_here
FORGE_CLIENT_ID=your_forge_client_id
FORGE_CLIENT_SECRET=your_forge_secret
```

4. **Set up the Frontend (Next.js):**
```bash
cd nextjs_frontend
npm install
npm run dev
```

5. **Run Ultimate AI Integration Demo:**
```bash
cd tesseractforge
python cadly_ultimate_integration.py
```

## 📁 Project Structure
```
cadly/
├── nextjs_frontend/               # Next.js Web Application
│   ├── app/                      # App Router Pages
│   │   └── api/forge/           # Forge API Routes
│   ├── lib/                      # Utility Libraries
│   │   └── forge.ts             # Forge Client Library
│   ├── types/                    # TypeScript Types
│   ├── .env.local               # Environment Variables
│   └── .env.example             # Environment Template
├── tesseractforge/               # Ultimate AI Integration Backend
│   ├── modules/                  # Core AI Modules
│   │   ├── comprehensive_ai_ocr.py      # Multi-API OCR Engine
│   │   ├── enhanced_symbol_detection.py # Computer Vision & Symbol Detection
│   │   ├── semantic_understanding.py    # AI Semantic Analysis
│   │   ├── data_pipeline.py             # Processing Pipeline
│   │   └── export_engine.py             # Multi-format Export System
│   ├── scripts/                  # Legacy OCR Scripts
│   ├── sample_images/           # Test Images
│   ├── models/                  # AI Model Files
│   ├── cadly_ultimate_integration.py # 🔥 MAIN APPLICATION
│   └── requirements.txt         # Python Dependencies
└── README.md                     # This File
```

## 🎆 System Architecture

### Processing Pipeline Flow
```
Input Image → Preprocessing → Multi-AI OCR → Symbol Detection → Semantic Analysis → Export
     │              │              │              │                 │             │
  Validation    Image Enhancement   5 AI APIs    Computer Vision   AI Understanding  Multi-format
     │              │              │              │                 │             │
   Format        Noise Removal    ┌─GPT-4 Vision   YOLOv8+OpenCV    GPT-4+Claude    Excel+PDF+JSON
   Support       Contrast Boost   ├─Claude AI     Shape Detection   Technical AI    +CAD Integration
   Quality       Resolution       ├─Google Vision  Dimension Lines  Interpretation   +Forge Export
   Metrics       Optimization     ├─Tesseract     Symbol Analysis   Structured       +Reports
                                  └─TrOCR        Annotations       Data Output
```

### AI Integration Matrix
| AI System | Purpose | Input Type | Output Type |
|-----------|---------|------------|-------------|
| **GPT-4 Vision** | Advanced image understanding | Image + Context | Structured analysis |
| **Claude AI** | Semantic reasoning & interpretation | Text + Context | Technical insights |
| **Google Vision AI** | Text detection & document analysis | Image | Text + Coordinates |
| **Tesseract OCR** | Traditional text extraction | Image | Raw text |
| **TrOCR** | Handwriting recognition | Image regions | Handwritten text |
| **YOLOv8** | Object & symbol detection | Image | Bounding boxes + classes |
| **OpenCV** | Computer vision preprocessing | Image | Enhanced image + features |
| **Autodesk Forge** | CAD integration & visualization | Structured data | CAD files + 3D viewer |

## 🔧 Autodesk Forge API Integration

### Available API Endpoints

- **GET** `/api/forge/token` - Get viewer authentication token
- **POST** `/api/forge/buckets` - Create new storage bucket
- **GET** `/api/forge/buckets?key={bucketKey}` - Get bucket details
- **POST** `/api/forge/upload` - Upload CAD file and start translation
- **GET** `/api/forge/upload?bucketKey={bucketKey}` - List bucket objects
- **GET** `/api/forge/translate?urn={urn}` - Check translation status
- **POST** `/api/forge/translate` - Start model translation

### Usage Examples

**Upload and process a CAD file:**
```javascript
const formData = new FormData();
formData.append('file', cadFile);
formData.append('bucketKey', 'my-bucket-key');

const response = await fetch('/api/forge/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('URN:', result.data.urn);
```

**Get viewer token:**
```javascript
const tokenResponse = await fetch('/api/forge/token');
const { access_token } = await tokenResponse.json();
```

### Supported File Formats
- AutoCAD (.dwg, .dwf, .dxf)
- Autodesk Inventor (.ipt, .iam)
- SolidWorks (.sldprt, .sldasm)
- STEP (.stp, .step)
- IGES (.igs, .iges)
- And 50+ more formats

## 🤖 AI Technologies
- **Autodesk Forge API** - CAD file processing and 3D visualization
- **Tesseract OCR** - Printed text extraction
- **TrOCR** - Handwriting recognition
- **YOLOv8** - Symbol and shape detection
- **GPT-4 Vision** - Intelligent analysis
- **Google Cloud Vision** - Enhanced OCR

## 🔒 Security Notes

- Never commit your `.env.local` file to version control
- Keep your Forge API credentials secure
- Use environment variables for all sensitive configuration
- The `.gitignore` file is configured to exclude environment files

## 🛠️ Development

### TypeScript Support
The project includes comprehensive TypeScript types for the Forge API:
- Authentication responses
- Bucket operations
- File upload/download
- Translation status
- Viewer integration

### Error Handling
All API routes include proper error handling with informative error messages and appropriate HTTP status codes.

## 🏆 Hackathon Ready
This project demonstrates state-of-the-art AI integration with real-world CAD processing capabilities, featuring:

- ✅ Complete Autodesk Forge API integration
- ✅ Secure credential management
- ✅ TypeScript support
- ✅ RESTful API design
- ✅ Error handling and validation
- ✅ Production-ready code structure

**Ready to win! 🚀**
# Deployment trigger
