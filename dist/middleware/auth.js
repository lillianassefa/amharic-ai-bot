"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Verify company still exists and is active
        const company = await prisma.company.findUnique({
            where: { id: decoded.companyId }
        });
        if (!company || !company.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive account' });
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            companyId: decoded.companyId
        };
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }
        const company = await prisma.company.findUnique({
            where: { apiKey }
        });
        if (!company || !company.isActive) {
            return res.status(401).json({ error: 'Invalid API key' });
        }
        req.user = {
            id: company.id,
            email: company.email,
            companyId: company.id
        };
        next();
    }
    catch (error) {
        console.error('API key auth error:', error);
        return res.status(403).json({ error: 'Invalid API key' });
    }
};
exports.authenticateApiKey = authenticateApiKey;
//# sourceMappingURL=auth.js.map