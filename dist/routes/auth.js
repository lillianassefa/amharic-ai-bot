"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Register company
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        // Check if company already exists
        const existingCompany = await prisma.company.findUnique({
            where: { email }
        });
        if (existingCompany) {
            return res.status(400).json({ error: 'Company with this email already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create company
        const company = await prisma.company.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({
            id: company.id,
            email: company.email,
            companyId: company.id
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            token,
            company: {
                id: company.id,
                name: company.name,
                email: company.email,
                apiKey: company.apiKey,
                createdAt: company.createdAt
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login company
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find company
        const company = await prisma.company.findUnique({
            where: { email }
        });
        if (!company) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!company.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, company.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({
            id: company.id,
            email: company.email,
            companyId: company.id
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            company: {
                id: company.id,
                name: company.name,
                email: company.email,
                apiKey: company.apiKey,
                createdAt: company.createdAt
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current company profile
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const company = await prisma.company.findUnique({
            where: { id: decoded.companyId },
            select: {
                id: true,
                name: true,
                email: true,
                apiKey: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json({
            success: true,
            company
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Refresh API key
router.post('/refresh-api-key', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const company = await prisma.company.update({
            where: { id: decoded.companyId },
            data: {
                apiKey: Math.random().toString(36).substring(2) + Date.now().toString(36)
            }
        });
        res.json({
            success: true,
            apiKey: company.apiKey
        });
    }
    catch (error) {
        console.error('API key refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map