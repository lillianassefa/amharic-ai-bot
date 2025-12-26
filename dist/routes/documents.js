"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF, DOC, DOCX, TXT files
        const allowedTypes = /pdf|doc|docx|txt|rtf/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only PDF, DOC, DOCX, TXT, and RTF files are allowed'));
        }
    }
});
// Language detection helper
const detectLanguage = (text) => {
    // Simple Amharic character detection
    const amharicPattern = /[\u1200-\u137F]/;
    const hasAmharic = amharicPattern.test(text);
    if (hasAmharic) {
        return 'am'; // Amharic
    }
    return 'en'; // Default to English
};
// Extract text from different file types
const extractTextFromFile = async (filePath, mimetype) => {
    try {
        if (mimetype === 'application/pdf') {
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const data = await (0, pdf_parse_1.default)(dataBuffer);
            return data.text;
        }
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth_1.default.extractRawText({ path: filePath });
            return result.value;
        }
        else if (mimetype === 'text/plain') {
            return fs_1.default.readFileSync(filePath, 'utf8');
        }
        return '';
    }
    catch (error) {
        console.error('Text extraction error:', error);
        return '';
    }
};
// Upload document
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Extract text content
        const content = await extractTextFromFile(req.file.path, req.file.mimetype);
        const language = req.body.language || detectLanguage(content);
        // Save document info to database
        const document = await prisma.document.create({
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                content,
                language,
                companyId: req.user.companyId
            }
        });
        // Emit real-time update
        const io = req.app.get('io');
        io.to(req.user.companyId).emit('document-uploaded', {
            id: document.id,
            originalName: document.originalName,
            language: document.language,
            createdAt: document.createdAt
        });
        res.status(201).json({
            success: true,
            document: {
                id: document.id,
                originalName: document.originalName,
                fileType: document.fileType,
                fileSize: document.fileSize,
                language: document.language,
                createdAt: document.createdAt
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        // Clean up file if database save failed
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload document' });
    }
});
// Get all documents
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, language } = req.query;
        const where = {
            companyId: req.user.companyId
        };
        if (search) {
            where.OR = [
                { originalName: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (language && language !== 'all') {
            where.language = language;
        }
        const documents = await prisma.document.findMany({
            where,
            select: {
                id: true,
                originalName: true,
                fileType: true,
                fileSize: true,
                language: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await prisma.document.count({ where });
        res.json({
            success: true,
            documents,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to retrieve documents' });
    }
});
// Get single document
router.get('/:id', async (req, res) => {
    try {
        const document = await prisma.document.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({
            success: true,
            document
        });
    }
    catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to retrieve document' });
    }
});
// Delete document
router.delete('/:id', async (req, res) => {
    try {
        const document = await prisma.document.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        // Delete file from filesystem
        const filePath = path_1.default.join(process.env.UPLOAD_PATH || './uploads', document.filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete from database
        await prisma.document.delete({
            where: { id: req.params.id }
        });
        // Emit real-time update
        const io = req.app.get('io');
        io.to(req.user.companyId).emit('document-deleted', {
            id: document.id
        });
        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});
exports.default = router;
//# sourceMappingURL=documents.js.map