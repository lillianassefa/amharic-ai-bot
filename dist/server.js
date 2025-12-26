"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const documents_1 = __importDefault(require("./routes/documents"));
const ai_1 = __importDefault(require("./routes/ai"));
const workflows_1 = __importDefault(require("./routes/workflows"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
// Import middleware
const auth_2 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: CLIENT_URL, credentials: true }));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Create uploads directory
const fs_1 = __importDefault(require("fs"));
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Static files
app.use('/uploads', express_1.default.static(uploadsDir));
// Socket.io for real-time features
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-room', (companyId) => {
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
app.use('/api/auth', auth_1.default);
app.use('/api/documents', auth_2.authenticateToken, documents_1.default);
app.use('/api/ai', auth_2.authenticateToken, ai_1.default);
app.use('/api/workflows', auth_2.authenticateToken, workflows_1.default);
app.use('/api/dashboard', auth_2.authenticateToken, dashboard_1.default);
// Serve React app in production
if (process.env.NODE_ENV === 'production') {
    // Vite builds to client/dist
    app.use(express_1.default.static(path_1.default.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../client/dist', 'index.html'));
    });
}
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API available at: http://localhost:${PORT}/api`);
});
//# sourceMappingURL=server.js.map