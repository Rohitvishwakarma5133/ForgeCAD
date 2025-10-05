# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Cadly is an AI-powered technical drawing analysis platform that converts engineering drawings and datasheets into structured CAD files. The project integrates multiple AI technologies including GPT-4 Vision, Claude AI, Google Vision AI, and Autodesk Forge API.

### Key Technologies
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend AI**: Python with comprehensive OCR engines, symbol detection, semantic analysis
- **Authentication**: Clerk (optional configuration)
- **Database**: MongoDB for data persistence
- **CAD Integration**: Autodesk Forge API for 3D visualization and file processing
- **AI APIs**: OpenAI GPT-4 Vision, Claude AI, Google Vision AI
- **UI Components**: Radix UI primitives with custom styling

## Architecture

### Dual Architecture Structure
The project uses a hybrid architecture with both Next.js frontend and Python AI processing:

1. **Next.js Application** (`/` root and `/nextjs_frontend/`):
   - Modern React 19 app with App Router
   - Forge API integration for CAD processing
   - Comprehensive validation system with testing framework
   - Dashboard with analytics and project management

2. **Python AI Engine** (`/tesseractforge/`):
   - Ultimate AI integration system (`cadly_ultimate_integration.py`)
   - Multi-API OCR processing (OpenAI, Claude, Google Vision)
   - Advanced symbol detection with YOLOv8 and OpenCV
   - Semantic understanding and export engines

### Key Components

**Frontend Components:**
- Dashboard with analytics and usage tracking
- File upload system with drag-and-drop
- Project management and history tracking
- Real-time processing status and notifications
- Responsive design with mobile support

**AI Processing Pipeline:**
- `ComprehensiveAIOCR`: Multi-API text extraction
- `EnhancedSymbolDetector`: Computer vision for engineering symbols
- `SemanticUnderstandingEngine`: AI-powered content analysis
- `AdvancedExportEngine`: Multi-format output (Excel, PDF, JSON, CAD)

**Validation System:**
- Tag parsing and normalization validation
- Missing equipment detection with multi-scale analysis
- False positive elimination with semantic correlation
- Automated testing framework with comprehensive metrics

## Common Development Commands

### Frontend Development (Next.js)
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Validation testing
npm run test:validation

# Run specific validation demo
npm run validation:demo
```

### Python AI Development
```bash
# Navigate to AI engine
cd tesseractforge

# Install Python dependencies
pip install -r requirements.txt

# Run ultimate AI integration demo
python cadly_ultimate_integration.py

# Run individual AI components for testing
python -m modules.comprehensive_ai_ocr
python -m modules.enhanced_symbol_detection
python -m modules.semantic_understanding
```

### Testing and Validation
```bash
# Run comprehensive validation tests
npm run test:validation

# Run specific validation tests
tsx scripts/test-false-positive-validator.ts
tsx scripts/test-complete-pipeline.ts

# Simple validation tests (no TypeScript deps)
cd nextjs_frontend/production-package/tests
node simple-test.js
node simple-false-positive-test.js
```

### Environment Configuration
Required environment variables in `.env.local`:
```bash
# AI API Keys
OPENAI_API_KEY=your_key_here
CLAUDE_API_KEY=your_key_here  
GOOGLE_AI_API_KEY=your_key_here

# Autodesk Forge API
FORGE_CLIENT_ID=your_client_id
FORGE_CLIENT_SECRET=your_client_secret

# Authentication (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Database
MONGODB_URI=your_mongodb_connection
```

## Key Architecture Patterns

### Multi-API Integration Strategy
The system employs a sophisticated fallback strategy for AI services:
- Primary: GPT-4 Vision for advanced image understanding
- Secondary: Claude AI for semantic reasoning and interpretation  
- Tertiary: Google Vision AI for text detection and document analysis
- Fallback: Tesseract OCR + TrOCR for traditional text extraction

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

### Validation and Quality Assurance
- **Tag Parsing**: Normalization and validation with confidence scoring
- **Missing Equipment Detection**: Multi-scale OCR analysis with critical failure detection  
- **False Positive Validation**: Cross-validation with 85% symbol confidence + 25mm proximity thresholds
- **Semantic Correlation**: Symbol-tag correlation checking with manufacturing insight extraction
- **Automated Testing**: Comprehensive test framework with performance benchmarks

### Export System Architecture
- **Multi-format Support**: JSON, Excel (with charts), PDF (professional reports), XML, CAD integration
- **Autodesk Forge Integration**: Direct upload to Forge for 3D visualization and model processing
- **Template System**: Configurable export templates (Basic, Detailed, Technical Report, Executive Summary)
- **Batch Processing**: Efficient handling of multiple drawings with consolidated analytics

## File Structure Notes

### Critical Configuration Files
- `next.config.ts`: Next.js configuration with minimal setup
- `middleware.ts`: Conditional Clerk authentication with graceful fallback
- `eslint.config.mjs`: ESLint configuration with TypeScript rules
- `tailwind.config.js`: Tailwind CSS configuration (auto-generated)
- `components.json`: Shadcn/ui component configuration

### Key Directories
- `/app/`: Next.js App Router pages and API routes
- `/components/`: React components organized by feature
- `/lib/`: Shared utilities, API clients, and validation logic
- `/hooks/`: Custom React hooks for state management
- `/tesseractforge/`: Python AI processing engine
- `/tesseractforge/modules/`: Core AI processing modules
- `/scripts/`: Development and testing scripts

## Development Guidelines

### Code Organization
- Use TypeScript throughout the frontend for type safety
- Follow Next.js 15 App Router conventions for routing
- Implement proper error boundaries and loading states
- Use Radix UI primitives for consistent component behavior
- Maintain separation between UI components and business logic

### AI Integration Best Practices
- Always implement fallback strategies for AI API failures
- Use confidence scoring and validation for all AI outputs
- Implement proper rate limiting and token management
- Log comprehensive metrics for AI performance monitoring
- Provide manual review workflows for low-confidence results

### Testing Strategy
- Use the comprehensive validation framework for AI components
- Test at multiple scales (100%, 200%, 400%) for OCR accuracy
- Validate against real engineering drawing samples
- Implement performance benchmarks for processing speed
- Test error handling and fallback scenarios

### Performance Considerations
- Implement image preprocessing for optimal AI performance
- Use parallel processing for batch operations
- Cache AI results when appropriate
- Optimize export generation for large datasets
- Monitor memory usage during intensive processing

## Deployment Notes

The application supports flexible deployment with optional services:
- Frontend can run independently without AI backend
- Authentication is optional (Clerk middleware gracefully handles missing credentials)
- Database connections include proper error handling
- AI services degrade gracefully when API keys are unavailable
- Export functionality adapts based on available libraries and services

This architecture ensures the system remains functional even with partial configuration, making it suitable for various deployment scenarios from development to full production.