import express, { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// N8N webhook configuration (no API key needed)
const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';

// Create new workflow
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, config, webhookUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        config: config || {},
        n8nWorkflowId: webhookUrl, // Store webhook URL instead of workflow ID
        companyId: req.user!.companyId
      }
    });

    res.status(201).json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Get workflows
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { companyId: req.user!.companyId },
      include: {
        _count: {
          select: { executions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      workflows
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: 'Failed to retrieve workflows' });
  }
});

// Execute workflow
router.post('/:id/execute', async (req: AuthRequest, res: Response) => {
  try {
    const { input } = req.body;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!workflow.isActive) {
      return res.status(400).json({ error: 'Workflow is not active' });
    }

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        input: input || {}
      }
    });

    try {
      let result = null;
      
      // Execute workflow via webhook if configured
      if (workflow.n8nWorkflowId) {
        const webhookUrl = workflow.n8nWorkflowId; // This is now the full webhook URL
        const response = await axios.post(webhookUrl, {
          companyId: req.user!.companyId,
          workflowId: workflow.id,
          executionId: execution.id,
          input: input || {},
          timestamp: new Date().toISOString()
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        result = response.data;
      } else {
        // Execute built-in workflow logic
        result = await executeBuiltInWorkflow(workflow, input || {}, req.user!.companyId);
      }

      // Update execution with success
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          output: result,
          completedAt: new Date()
        }
      });

      // Emit real-time update
      const io = req.app.get('io');
      io.to(req.user!.companyId).emit('workflow-completed', {
        workflowId: workflow.id,
        executionId: execution.id,
        status: 'completed',
        output: result
      });

      res.json({
        success: true,
        execution: {
          id: execution.id,
          status: 'completed',
          output: result
        }
      });
    } catch (executionError) {
      // Update execution with error
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: (executionError as Error).message,
          completedAt: new Date()
        }
      });

      throw executionError;
    }
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

// Built-in workflow execution logic
async function executeBuiltInWorkflow(workflow: any, input: any, companyId: string) {
  const config = workflow.config || {};
  
  switch (config.type) {
    case 'document-summary':
      return await executeDocumentSummary(companyId, input);
    case 'language-translation':
      return await executeLanguageTranslation(input);
    case 'data-extraction':
      return await executeDataExtraction(companyId, input);
    case 'amharic-english-translation':
      return await executeAmharicEnglishTranslation(input);
    default:
      throw new Error('Unknown workflow type');
  }
}

// Document summary workflow
async function executeDocumentSummary(companyId: string, input: any) {
  const documents = await prisma.document.findMany({
    where: { companyId },
    take: 5
  });

  return {
    summary: `Processed ${documents.length} documents`,
    documents: documents.map(doc => ({
      name: doc.originalName,
      language: doc.language,
      size: doc.fileSize
    }))
  };
}

// Language translation workflow
async function executeLanguageTranslation(input: any) {
  const { text, targetLanguage } = input;
  
  if (!text || !targetLanguage) {
    throw new Error('Text and target language are required');
  }

  // Mock translation (in real implementation, use translation service)
  return {
    originalText: text,
    translatedText: `[${targetLanguage.toUpperCase()}] ${text}`,
    targetLanguage
  };
}

// Amharic-English translation workflow
async function executeAmharicEnglishTranslation(input: any) {
  const { text, direction = 'am-to-en' } = input;
  
  if (!text) {
    throw new Error('Text is required');
  }

  // Detect if text contains Amharic characters
  const amharicPattern = /[\u1200-\u137F]/;
  const hasAmharic = amharicPattern.test(text);

  return {
    originalText: text,
    translatedText: direction === 'am-to-en' 
      ? `[ENGLISH] ${text}` 
      : `[AMHARIC] ${text}`,
    direction,
    detectedLanguage: hasAmharic ? 'amharic' : 'english'
  };
}

// Data extraction workflow
async function executeDataExtraction(companyId: string, input: any) {
  const documents = await prisma.document.findMany({
    where: { companyId },
    select: {
      originalName: true,
      content: true,
      language: true
    }
  });

  return {
    extractedData: documents.map(doc => ({
      filename: doc.originalName,
      language: doc.language,
      wordCount: doc.content?.split(' ').length || 0,
      hasAmharicContent: /[\u1200-\u137F]/.test(doc.content || '')
    }))
  };
}

// Get workflow executions
router.get('/:id/executions', async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId: req.params.id },
      orderBy: { startedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.workflowExecution.count({
      where: { workflowId: req.params.id }
    });

    res.json({
      success: true,
      executions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ error: 'Failed to retrieve executions' });
  }
});

// Update workflow
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, config, isActive, webhookUrl } = req.body;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(config && { config }),
        ...(isActive !== undefined && { isActive }),
        ...(webhookUrl !== undefined && { n8nWorkflowId: webhookUrl })
      }
    });

    res.json({
      success: true,
      workflow: updatedWorkflow
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user!.companyId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await prisma.workflow.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

export default router; 