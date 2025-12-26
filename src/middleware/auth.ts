import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    companyId: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
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
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

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
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(403).json({ error: 'Invalid API key' });
  }
}; 