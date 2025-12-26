import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { getAIResponse } from '../services/ai';

const router = express.Router();
const prisma = new PrismaClient();

// Get widget configuration
router.get('/config', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;

    let settings = await prisma.widgetSettings.findUnique({
      where: { companyId }
    });

    // If no settings exist yet, return defaults or create them
    if (!settings) {
      settings = await prisma.widgetSettings.create({
        data: { companyId }
      });
    }

    res.json({
      success: true,
      config: {
        primaryColor: settings.primaryColor,
        welcomeMessage: settings.welcomeMessage,
        welcomeMessageAm: settings.welcomeMessageAm,
        botName: settings.botName,
        botNameAm: settings.botNameAm,
        logoUrl: settings.logoUrl,
        isEnabled: settings.isEnabled
      }
    });
  } catch (error) {
    console.error('Get widget config error:', error);
    res.status(500).json({ error: 'Failed to retrieve widget configuration' });
  }
});

// Start/Resume anonymous conversation
router.post('/conversations', async (req: AuthRequest, res) => {
  try {
    const { visitorId, language = 'auto' } = req.body;
    const companyId = req.user!.companyId;

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    // Try to find an existing conversation for this visitor at this company
    let conversation = await prisma.conversation.findFirst({
      where: {
        companyId,
        visitorId,
        source: 'widget'
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          companyId,
          visitorId,
          source: 'widget',
          language,
          title: `Visitor Session: ${visitorId.substring(0, 8)}`
        },
        include: {
          messages: true
        }
      });
    }

    res.json({
      success: true,
      conversationId: conversation.id,
      messages: conversation.messages
    });
  } catch (error) {
    console.error('Start widget conversation error:', error);
    res.status(500).json({ error: 'Failed to initialize conversation' });
  }
});

// Send message via widget
router.post('/conversations/:id/messages', async (req: AuthRequest, res) => {
  try {
    const { content, visitorId, language } = req.body;
    const companyId = req.user!.companyId;
    const conversationId = req.params.id;

    if (!content || !visitorId) {
      return res.status(400).json({ error: 'content and visitorId are required' });
    }

    // Verify conversation belongs to company and visitor
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        companyId,
        visitorId
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    const result = await getAIResponse({
      companyId,
      conversationId,
      content,
      language,
      io: req.app.get('io')
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Widget chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
