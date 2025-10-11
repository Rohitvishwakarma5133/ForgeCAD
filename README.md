# CADly - CAD Analysis Platform

A Next.js-based CAD file analysis platform with AI-powered drawing processing capabilities.

## 🚀 Production Deployment

This application is production-ready and optimized for serverless deployment on Vercel.

### Features
- **CAD File Processing**: Support for DWG, DXF, and PDF files
- **AI-Powered Analysis**: Automated extraction of equipment, instrumentation, and piping data
- **Real-time Processing**: Live status updates during file analysis
- **MongoDB Integration**: Persistent storage for processing jobs and results
- **Modern UI**: Responsive design with Tailwind CSS
- **Authentication**: Clerk integration for user management

## 📁 Project Structure

```
cadly/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── upload/        # File upload endpoint
│   │   ├── status/[id]/   # Job status tracking
│   │   ├── download/[id]/ # Result downloads
│   │   ├── health/        # Health check endpoint
│   │   └── sessions/      # Session management
│   ├── (pages)/           # Application pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── home/             # Homepage components
│   ├── demo/             # Demo/converter components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── mongodb.ts        # Database connection
│   ├── cad-*.ts         # CAD processing utilities
│   └── utils.ts          # Helper functions
├── types/                # TypeScript definitions
└── public/              # Static assets
```

## 🔧 Environment Variables

Required environment variables for production:

```bash
# Database
MONGODB_URI={{REDACTED_MONGODB_URI}}

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# OpenAI (Optional - for AI analysis)
OPENAI_API_KEY=sk-...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## 📦 Installation & Deployment

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Clerk account (for authentication)

### Local Development
```bash
npm install
npm run dev
```

### Production Deployment (Vercel)
```bash
npm run build
npm run deploy:vercel
```

### Health Check
```bash
npm run health
# or visit: https://your-domain.com/api/health
```

## 🛡️ Security Features

- **Headers Security**: CSP, HSTS, and security headers configured
- **Environment Variables**: All secrets stored securely
- **Input Validation**: File type and size validation
- **Rate Limiting**: Built-in protection against abuse
- **Authentication**: Secure user authentication with Clerk

## 🔄 API Endpoints

### Health Check
- `GET /api/health` - System health status

### File Processing
- `POST /api/upload` - Upload CAD files for processing
- `GET /api/status/[id]` - Check processing status
- `GET /api/download/[id]` - Download processed results

### Session Management
- `POST /api/sessions` - Session tracking and analytics

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes (serverless)
- **Database**: MongoDB Atlas
- **Storage**: MongoDB for file metadata and job tracking
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (optimized for serverless)

## 🔍 Monitoring

The application includes built-in monitoring through:
- Health check endpoint at `/api/health`
- Request logging and error tracking
- MongoDB connection health monitoring

## 📝 License

Private - All rights reserved

## 🤝 Support

For technical support or questions, please contact the development team.