import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-pusdatin-key';

export const authService = {
  async login(username: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const payload = {
      id: user.id,
      scope: user.scope,
      divisi: user.divisi,
      wilayahId: user.wilayahId,
      cabangId: user.cabangId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    return {
      token,
      user: payload,
    };
  }
};
