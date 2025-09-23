import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).userId = (decoded as any).userId;
    next();
  } catch (err) {
    console.error('Ошибка аутентификации:', err);
    res.status(401).json({ message: 'Неверный токен' });
  }
}