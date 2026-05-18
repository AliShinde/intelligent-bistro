import { Router, Request, Response } from 'express';
import { MENU_ITEMS } from '../data/menu';
import { MenuResponse } from '../types/index';

export const menuRouter = Router();

menuRouter.get('/', (_req: Request, res: Response): void => {
  const response: MenuResponse = { data: MENU_ITEMS };
  res.json(response);
});
