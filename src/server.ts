import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import aiRoutes from './routes/ai';
import workflowRoutes from './routes/workflows';
import dashboardRoutes from './routes/dashboard';
import widgetRoutes from './routes/widget';

// Import middleware
import { authenticateToken, authenticateApiKey } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const server = createServer(app);

// CORS configuration - more permissive for development
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost on any port
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // In production, check against CLIENT_URL
    if (origin === CLIENT_URL) {
      return callback(null, true);
    }

    // For the widget API, we allow the origin but our authenticateApiKey middleware 
    // will perform the actual domain whitelisting check. 
    // This allows the browser to at least make the request.
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-api-key'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Socket.IO with proper CORS - allow all localhost origins in development
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? CLIENT_URL 
      : (origin, callback) => {
          if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware - Configure Helmet to allow CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable CSP for development
}));

// Log CORS requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[CORS] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

// CORS must come after Helmet
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || CLIENT_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting for public widget API
const widgetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Create uploads directory
import fs from 'fs';
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static files
app.use('/uploads', express.static(uploadsDir));

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-room', (companyId: string) => {
    socket.join(companyId);
    console.log(`Client ${socket.id} joined room ${companyId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/workflows', authenticateToken, workflowRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/widget', widgetRateLimiter, authenticateApiKey, widgetRoutes);

// Serve widget bundle and assets as static files
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets')));

app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/widget.js'), (err) => {
    if (err) {
      res.status(404).send('Widget bundle not found. Please run a build first.');
    }
  });
});

app.get('/widget.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/widget.css'), (err) => {
    if (err) {
      res.status(404).send('Widget styles not found. Please run a build first.');
    }
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Vite builds to client/dist
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
  console.log(`🔗 CORS enabled for: ${CLIENT_URL}`);
});

export { io }; 