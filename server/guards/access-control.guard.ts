import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-pusdatin-key';

export interface AuthRequest extends Request {
  user?: any;
}

export function AccessControlGuard(requiredDivisi?: string, requiredScope?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      req.user = payload;

      // Check Divisi
      if (requiredDivisi) {
        if (payload.divisi !== requiredDivisi && payload.divisi !== 'ALL') {
          return res.status(403).json({ message: 'Forbidden: Insufficient Divisi access' });
        }
      }

      // Check Scope (Geographic)
      if (requiredScope) {
        if (requiredScope === 'GLOBAL' && payload.scope !== 'GLOBAL') {
          return res.status(403).json({ message: 'Forbidden: Requires GLOBAL scope' });
        }
        if (requiredScope === 'WILAYAH' && payload.scope !== 'GLOBAL' && payload.scope !== 'WILAYAH') {
           return res.status(403).json({ message: 'Forbidden: Requires WILAYAH scope' });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  };
}
