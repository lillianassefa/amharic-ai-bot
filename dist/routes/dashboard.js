"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const companyId = req.user.companyId;
        // Get basic counts
        const [totalDocuments, totalConversations, totalWorkflows, activeWorkflows] = await Promise.all([
            prisma.document.count({ where: { companyId } }),
            prisma.conversation.count({ where: { companyId } }),
            prisma.workflow.count({ where: { companyId } }),
            prisma.workflow.count({ where: { companyId, isActive: true } })
        ]);
        // Get language distribution
        const languageStats = await prisma.document.groupBy({
            by: ['language'],
            where: { companyId },
            _count: true
        });
        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentDocuments = await prisma.document.count({
            where: {
                companyId,
                createdAt: { gte: thirtyDaysAgo }
            }
        });
        const recentConversations = await prisma.conversation.count({
            where: {
                companyId,
                createdAt: { gte: thirtyDaysAgo }
            }
        });
        // Get workflow execution stats
        const workflowExecutions = await prisma.workflowExecution.groupBy({
            by: ['status'],
            where: {
                workflow: { companyId },
                startedAt: { gte: thirtyDaysAgo }
            },
            _count: true
        });
        // Get storage usage
        const storageStats = await prisma.document.aggregate({
            where: { companyId },
            _sum: { fileSize: true }
        });
        const totalStorageBytes = storageStats._sum.fileSize || 0;
        const totalStorageMB = Math.round(totalStorageBytes / (1024 * 1024) * 100) / 100;
        res.json({
            success: true,
            stats: {
                overview: {
                    totalDocuments,
                    totalConversations,
                    totalWorkflows,
                    activeWorkflows,
                    storageUsedMB: totalStorageMB
                },
                recentActivity: {
                    documentsUploaded: recentDocuments,
                    conversationsStarted: recentConversations,
                    workflowExecutions: workflowExecutions.reduce((sum, item) => sum + item._count, 0)
                },
                languageDistribution: languageStats.map(stat => ({
                    language: stat.language || 'unknown',
                    count: stat._count
                })),
                workflowExecutions: workflowExecutions.map(stat => ({
                    status: stat.status,
                    count: stat._count
                }))
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve dashboard statistics' });
    }
});
// Get recent activities
router.get('/activities', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const companyId = req.user.companyId;
        // Get recent documents
        const recentDocuments = await prisma.document.findMany({
            where: { companyId },
            select: {
                id: true,
                originalName: true,
                language: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: Math.floor(Number(limit) / 3)
        });
        // Get recent conversations
        const recentConversations = await prisma.conversation.findMany({
            where: { companyId },
            select: {
                id: true,
                title: true,
                language: true,
                createdAt: true,
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: Math.floor(Number(limit) / 3)
        });
        // Get recent workflow executions
        const recentExecutions = await prisma.workflowExecution.findMany({
            where: {
                workflow: { companyId }
            },
            include: {
                workflow: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { startedAt: 'desc' },
            take: Math.floor(Number(limit) / 3)
        });
        // Combine and sort activities
        const activities = [
            ...recentDocuments.map(doc => ({
                id: doc.id,
                type: 'document',
                title: `Document uploaded: ${doc.originalName}`,
                language: doc.language,
                timestamp: doc.createdAt,
                metadata: { originalName: doc.originalName }
            })),
            ...recentConversations.map(conv => ({
                id: conv.id,
                type: 'conversation',
                title: conv.title || 'New Conversation',
                language: conv.language,
                timestamp: conv.createdAt,
                metadata: { messageCount: conv._count.messages }
            })),
            ...recentExecutions.map(exec => ({
                id: exec.id,
                type: 'workflow',
                title: `Workflow executed: ${exec.workflow.name}`,
                status: exec.status,
                timestamp: exec.startedAt,
                metadata: {
                    workflowName: exec.workflow.name,
                    status: exec.status,
                    completedAt: exec.completedAt
                }
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, Number(limit));
        res.json({
            success: true,
            activities
        });
    }
    catch (error) {
        console.error('Dashboard activities error:', error);
        res.status(500).json({ error: 'Failed to retrieve activities' });
    }
});
// Get analytics data for charts
router.get('/analytics', async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const companyId = req.user.companyId;
        const periodDays = Number(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        // Get daily document uploads
        const dailyDocuments = await prisma.$queryRaw `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM documents 
      WHERE company_id = ${companyId} AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
        // Get daily conversations
        const dailyConversations = await prisma.$queryRaw `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM conversations 
      WHERE company_id = ${companyId} AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
        // Get workflow execution trends
        const workflowTrends = await prisma.$queryRaw `
      SELECT DATE(we.started_at) as date, we.status, COUNT(*) as count
      FROM workflow_executions we
      JOIN workflows w ON we.workflow_id = w.id
      WHERE w.company_id = ${companyId} AND we.started_at >= ${startDate}
      GROUP BY DATE(we.started_at), we.status
      ORDER BY date ASC
    `;
        // Get top used languages
        const languageUsage = await prisma.document.groupBy({
            by: ['language'],
            where: {
                companyId,
                createdAt: { gte: startDate }
            },
            _count: true,
            orderBy: {
                _count: {
                    language: 'desc'
                }
            }
        });
        res.json({
            success: true,
            analytics: {
                period: periodDays,
                dailyDocuments,
                dailyConversations,
                workflowTrends,
                languageUsage: languageUsage.map(item => ({
                    language: item.language || 'unknown',
                    count: item._count
                }))
            }
        });
    }
    catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics data' });
    }
});
// Export data
router.get('/export', async (req, res) => {
    try {
        const { type, format = 'json' } = req.query;
        const companyId = req.user.companyId;
        let data = {};
        switch (type) {
            case 'documents':
                data = await prisma.document.findMany({
                    where: { companyId },
                    select: {
                        originalName: true,
                        fileType: true,
                        fileSize: true,
                        language: true,
                        createdAt: true
                    }
                });
                break;
            case 'conversations':
                data = await prisma.conversation.findMany({
                    where: { companyId },
                    include: {
                        messages: {
                            select: {
                                content: true,
                                role: true,
                                language: true,
                                createdAt: true
                            }
                        }
                    }
                });
                break;
            case 'workflows':
                data = await prisma.workflow.findMany({
                    where: { companyId },
                    include: {
                        executions: {
                            select: {
                                status: true,
                                startedAt: true,
                                completedAt: true
                            }
                        }
                    }
                });
                break;
            default:
                return res.status(400).json({ error: 'Invalid export type' });
        }
        if (format === 'csv' && type === 'documents') {
            // Simple CSV export for documents
            const csv = [
                'Name,Type,Size,Language,Created',
                ...data.map((item) => `"${item.originalName}","${item.fileType}",${item.fileSize},"${item.language}","${item.createdAt}"`)
            ].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
            return res.send(csv);
        }
        res.json({
            success: true,
            data,
            exportedAt: new Date(),
            type,
            count: Array.isArray(data) ? data.length : 1
        });
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map