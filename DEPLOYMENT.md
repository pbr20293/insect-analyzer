# Insect Analyzer - Express Backend Deployment

## Overview
This application now includes an Express backend server that handles MinIO API interactions securely. The backend serves the React application and provides API endpoints for MinIO operations.

## Architecture
- **Frontend**: React + TypeScript + Vite (served as static files in production)
- **Backend**: Express.js server with API endpoints
- **Storage**: MinIO server at 192.168.86.3:8031
- **AI Processing**: Gradio service at vision.deltathings.com
- **Domain**: Accessible via trapsnap.deltathings.com on port 6263

## Installation

### Development Setup
```bash
# Install all dependencies
npm run install:deps

# Start development servers (frontend + backend)
npm run dev:full

# Or start separately:
npm run dev          # Frontend only (port 5173)
npm run dev:server   # Backend only (port 6263)
```

### Production Deployment
```bash
# Build the application
npm run build

# Start production server
NODE_ENV=production npm start
```

## Environment Configuration

### Development (.env)
- Frontend runs on port 5173
- Backend runs on port 6263
- Frontend calls backend API at localhost:6263

### Production (.env.production)
- Single server serves both frontend and API
- Runs on port 6263
- Accessible via trapsnap.deltathings.com

## API Endpoints

### MinIO Operations
- `POST /api/minio/test-connection` - Test MinIO connectivity
- `POST /api/minio/list-folders` - List folders (customers/cameras/dates)
- `POST /api/minio/list-images` - List images in a path
- `POST /api/minio/get-image-url` - Get presigned image URL
- `POST /api/minio/get-image-blob` - Get image as blob for processing

### Gradio AI Operations
- `POST /api/gradio/connect` - Connect to Gradio service
- `POST /api/gradio/process-image` - Process image with AI model
- `POST /api/gradio/update-model` - Update model configuration

### Health Check
- `GET /api/health` - Server health status

## Security Features
- CORS protection
- Rate limiting (100 requests per 15 minutes per IP)
- Helmet security headers
- Input validation
- File upload limits (50MB)
- Environment-based credential management

## Network Configuration

### Port Forwarding
Configure your router/firewall to forward requests from trapsnap.deltathings.com to:
- Internal IP: Your server's IP
- Port: 6263

### MinIO Access
The backend communicates directly with MinIO at 192.168.86.3:8031 on the local network, avoiding CORS issues.

## Credentials Management

### Development
Set credentials in the UI settings panel (stored in localStorage).

### Production
Set environment variables securely:
```bash
export MINIO_ACCESS_KEY="your_access_key"
export MINIO_SECRET_KEY="your_secret_key"
```

## Deployment Process
1. Set production environment variables
2. Build the application: `npm run build`
3. Start the server: `NODE_ENV=production npm start`
4. Configure reverse proxy if needed
5. Access via trapsnap.deltathings.com:6263