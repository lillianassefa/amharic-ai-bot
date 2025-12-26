"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Initialize OpenAI
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
// Language detection helper
const detectLanguage = (text) => {
    const amharicPattern = /[\u1200-\u137F]/;
    return amharicPattern.test(text) ? 'am' : 'en';
};
// System prompts for different languages
const systemPrompts = {
    en: `You are a helpful AI assistant that can communicate in both English and Amharic. 
You have access to company documents and can answer questions based on them. 
Be professional, accurate, and helpful. If you don't know something, say so clearly.
When responding in Amharic, use proper Ethiopian Amharic script and grammar.`,
    am: `አንተ በእንግሊዝኛና በአማርኛ መወያየት የምትችል ጠቃሚ AI ረዳት ነህ።
የኩባንያ ሰነዶች ላይ መሰረት አድርገህ ጥያቄዎችን መመለስ ትችላለህ።
ሙያዊ፣ ትክክለኛና ጠቃሚ ሁን። የማታውቀውን ነገር ግልጽ በማድረግ ተናገር።
በአማርኛ ስትመልስ ትክክለኛ የአማርኛ ሰዋስው እና ፊደል ተጠቀም።`
};
// Start new conversation
router.post('/conversations', async (req, res) => {
    try {
        const { title, language = 'auto' } = req.body;
        const conversation = await prisma.conversation.create({
            data: {
                title: title || 'New Conversation',
                language,
                companyId: req.user.companyId
            }
        });
        res.status(201).json({
            success: true,
            conversation
        });
    }
    catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});
// Get conversations
router.get('/conversations', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const conversations = await prisma.conversation.findMany({
            where: { companyId: req.user.companyId },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        res.json({
            success: true,
            conversations
        });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to retrieve conversations' });
    }
});
// Get conversation messages
router.get('/conversations/:id/messages', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        const messages = await prisma.message.findMany({
            where: { conversationId: req.params.id },
            orderBy: { createdAt: 'asc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        res.json({
            success: true,
            messages,
            conversation
        });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to retrieve messages' });
    }
});
// Send message to AI
router.post('/conversations/:id/messages', async (req, res) => {
    try {
        const { content, language } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        // Verify conversation belongs to company
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        // Detect language if not provided
        const detectedLanguage = language || detectLanguage(content);
        // Save user message
        const userMessage = await prisma.message.create({
            data: {
                content,
                role: 'user',
                language: detectedLanguage,
                conversationId: req.params.id
            }
        });
        // Get recent conversation history
        const recentMessages = await prisma.message.findMany({
            where: { conversationId: req.params.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        // Get relevant documents for context
        const documents = await prisma.document.findMany({
            where: {
                companyId: req.user.companyId,
                OR: [
                    { language: detectedLanguage },
                    { language: 'auto' }
                ]
            },
            select: {
                originalName: true,
                content: true
            },
            take: 5
        });
        // Prepare context
        const documentContext = documents.map(doc => `Document: ${doc.originalName}\nContent: ${doc.content?.substring(0, 1000)}...`).join('\n\n');
        // Prepare conversation history
        const conversationHistory = recentMessages.reverse().map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        // Choose system prompt based on language
        const systemPrompt = detectedLanguage === 'am' ? systemPrompts.am : systemPrompts.en;
        // Prepare messages for OpenAI
        const messages = [
            { role: 'system', content: systemPrompt },
        ];
        if (documentContext) {
            messages.push({
                role: 'system',
                content: `Available Documents:\n${documentContext}`
            });
        }
        messages.push(...conversationHistory);
        // Get AI response
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 2000
        });
        const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        // Save AI message
        const aiMessage = await prisma.message.create({
            data: {
                content: aiResponse,
                role: 'assistant',
                language: detectedLanguage,
                conversationId: req.params.id
            }
        });
        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: req.params.id },
            data: { updatedAt: new Date() }
        });
        // Emit real-time updates
        const io = req.app.get('io');
        io.to(req.user.companyId).emit('new-message', {
            conversationId: req.params.id,
            userMessage,
            aiMessage
        });
        res.json({
            success: true,
            userMessage,
            aiMessage
        });
    }
    catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});
// Delete conversation
router.delete('/conversations/:id', async (req, res) => {
    try {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        await prisma.conversation.delete({
            where: { id: req.params.id }
        });
        res.json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});
// API endpoint for external integration
router.post('/chat', async (req, res) => {
    try {
        const { message, language, context } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const detectedLanguage = language || detectLanguage(message);
        const systemPrompt = detectedLanguage === 'am' ? systemPrompts.am : systemPrompts.en;
        const messages = [
            { role: 'system', content: systemPrompt }
        ];
        if (context) {
            messages.push({ role: 'system', content: `Context: ${context}` });
        }
        messages.push({ role: 'user', content: message });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 1000
        });
        const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        res.json({
            success: true,
            response,
            language: detectedLanguage
        });
    }
    catch (error) {
        console.error('API chat error:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map