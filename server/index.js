import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import minioRoutes from './routes/minio.js';
import gradioRoutes from './routes/gradio.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6263;

// Trust proxy for TLS termination
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://192.168.86.3:*", "https://192.168.86.3:*", "http://localhost:*", "http://127.0.0.1:*", "https://vision.deltathings.com"],
      connectSrc: ["'self'", "ws:", "wss:", "http://192.168.86.3:*", "https://192.168.86.3:*", "http://localhost:*", "http://127.0.0.1:*", "https://vision.deltathings.com"],
    },
  } : false, // Disable CSP in development/testing
}));

// Rate limiting - more generous for image monitoring app
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs (increased for slideshow + polling)
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://trapsnap.deltathings.com', 'http://localhost:6263'] 
    : ['http://localhost:5173', 'http://localhost:6264', 'http://localhost:6263'],
  credentials: true
}));

// Compression and JSON parsing
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api/minio', minioRoutes);
app.use('/api/gradio', gradioRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // Handle React routing - catch all non-API routes
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Insect Analyzer API Server', 
      mode: 'development',
      frontend: 'http://localhost:5173'
    });
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MinIO Endpoint: ${process.env.MINIO_ENDPOINT || 'Not configured'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 Frontend Dev Server: http://localhost:5173`);
  }
});

export default app;