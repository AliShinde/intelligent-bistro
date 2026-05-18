import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { parseMessage } from '../services/nlpService';
import { ChatRequest } from '../types/index';

const CartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image: z.string(),
}).strict();

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  cart: z.array(CartItemSchema),
}).strict();

export const chatRouter = Router();

chatRouter.post('/', validate(ChatRequestSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await parseMessage(req.body as ChatRequest);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
