import { Request, Response } from 'express';
import { z } from 'zod';
import { claudeChatService } from '../services/claude.service.js';
import { prisma } from '../services/db.js';

const chatMessageSchema = z.object({
  propertyId: z.string().uuid(),
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().uuid().optional(),
});

export async function sendChatMessage(req: Request, res: Response) {
  try {
    const parse = chatMessageSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { propertyId, message, sessionId } = parse.data;

    const result = await claudeChatService.processGroundedChat({
      propertyId,
      message,
      sessionId,
      userId: req.user?.id,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Chat processing error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process chat message.' });
  }
}

export async function getChatHistory(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        property: {
          select: { id: true, title: true, priceTotal: true, locality: true, city: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    return res.status(200).json({ session });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
}
