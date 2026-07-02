import { Router } from 'express';
import { authService } from './auth.service.js';
import { AccessControlGuard } from './guards/access-control.guard.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

// Example protected endpoint testing the guard
router.get('/protected-formal', AccessControlGuard('FORMAL'), (req: any, res) => {
  res.json({ message: 'Welcome to formal division data', user: req.user });
});

export default router;
