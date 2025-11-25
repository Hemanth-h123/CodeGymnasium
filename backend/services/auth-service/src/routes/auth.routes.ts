import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const users = new Map<string, { email: string; username: string; passwordHash: string }>();

const router = Router();
const resetTokens = new Map<string, string>();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (users.has(email)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users.set(email, { email, username, passwordHash });
  const token = jwt.sign({ sub: email, username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.status(201).json({ token, user: { email, username } });
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }
  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ sub: email, username: user.username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.status(200).json({ token, user: { email: user.email, username: user.username } });
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', (req, res) => {
  return res.status(200).json({ message: 'OK' });
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
  return res.status(200).json({ message: 'OK' });
});

// POST /api/auth/verify-email - Verify email
router.post('/verify-email', (req, res) => {
  return res.status(200).json({ message: 'OK' });
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Missing email' });
  if (!users.has(email)) return res.status(404).json({ message: 'User not found' });
  const token = Math.random().toString(36).slice(2, 10);
  resetTokens.set(email, token);
  return res.status(200).json({ message: 'Reset token generated', token });
});

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body || {};
  if (!email || !token || !newPassword) return res.status(400).json({ message: 'Missing fields' });
  const expected = resetTokens.get(email);
  if (!expected || expected !== token) return res.status(400).json({ message: 'Invalid token' });
  const user = users.get(email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  resetTokens.delete(email);
  return res.status(200).json({ message: 'Password updated' });
});

export default router;
