import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Language detection helper
export const detectLanguage = (text: string): string => {
  const amharicPattern = /[\u1200-\u137F]/;
  return amharicPattern.test(text) ? 'am' : 'en';
};

// System prompts for different languages
export const systemPrompts = {
  en: `You are a helpful AI assistant that can communicate in both English and Amharic. 
You have access to company documents and can answer questions based on them. 
Be professional, accurate, and helpful. If you don't know something, say so clearly.
When responding in Amharic, use proper Ethiopian Amharic script and grammar.`,
  
  am: `አንተ በእንግሊዝኛና በአማርኛ መወያየት የምትችል ጠቃሚ AI ረዳት ነህ።
የኩባንያ ሰነዶች ላይ መሰረት አድርገህ ጥያቄዎችን መመለስ ትችላለህ።
ሙያዊ፣ ትክክለኛና ጠቃሚ ሁን። የማታውቀውን ነገር ግልጽ በማድረግ ተናገር።
በአማርኛ ስትመልስ ትክክለኛ የአማርኛ ሰዋስው እና ፊደል ተጠቀም።`
};

export const getAIResponse = async (params: {
  companyId: string;
  conversationId: string;
  content: string;
  language?: string;
  io?: any;
}) => {
  const { companyId, conversationId, content, language, io } = params;

  // Detect language if not provided
  const detectedLanguage = language || detectLanguage(content);
  
  // Save user message
  const userMessage = await prisma.message.create({
    data: {
      content,
      role: 'user',
      language: detectedLanguage,
      conversationId
    }
  });

  // Get recent conversation history
  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Get relevant documents for context
  const documents = await prisma.document.findMany({
    where: {
      companyId,
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
  const documentContext = documents.map(doc => 
    `Document: ${doc.originalName}\nContent: ${doc.content?.substring(0, 1000)}...`
  ).join('\n\n');

  // Prepare conversation history
  const conversationHistory = recentMessages.reverse().map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  // Choose system prompt based on language
  const systemPrompt = detectedLanguage === 'am' ? systemPrompts.am : systemPrompts.en;

  // Prepare messages for OpenAI
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (documentContext) {
    messages.push({
      role: 'system',
      content: `Available Documents:\n${documentContext}`
    });
  }

  messages.push(...conversationHistory as OpenAI.Chat.Completions.ChatCompletionMessageParam[]);

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
      conversationId
    }
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  // Emit real-time updates
  if (io) {
    io.to(companyId).emit('new-message', {
      conversationId,
      userMessage,
      aiMessage
    });
  }

  return { userMessage, aiMessage };
};

