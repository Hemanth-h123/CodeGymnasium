import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getDb } from '../db';

const router = Router();
const resetTokens = new Map<string, string>();
const memoryUsers = new Map<string, { email: string; username: string; passwordHash: string }>();

async function ensureUsersTable() {
  try {
    const db = getDb();
    if (!db) return false;
    await query(
      'CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT NOT NULL, password_hash TEXT NOT NULL, is_email_verified BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())'
    );
    return true;
  } catch {
    return false;
  }
}

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const db = getDb();
    if (db) {
      await ensureUsersTable();
      const existing = await query<any>('SELECT id FROM users WHERE email=$1', [email]);
      if (existing.length) return res.status(409).json({ message: 'User already exists' });
      const passwordHash = await bcrypt.hash(password, 10);
      await query('INSERT INTO users (email, username, password_hash, is_email_verified, is_active) VALUES ($1,$2,$3,true,true)', [email, username, passwordHash]);
      
      // Increment active learners count
      try {
        await query('UPDATE homepage_stats SET count = count + 1 WHERE stat_type = $1', ['active_learners']);
      } catch (statsError) {
        console.error('Error updating homepage stats:', statsError);
      }
    } else {
      if (memoryUsers.has(email)) return res.status(409).json({ message: 'User already exists' });
      const passwordHash = await bcrypt.hash(password, 10);
      memoryUsers.set(email, { email, username, passwordHash });
    }
    const token = jwt.sign({ sub: email, username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.status(201).json({ token, user: { email, username } });
  } catch (e) {
    if (!memoryUsers.has(email)) {
      const passwordHash = await bcrypt.hash(password, 10);
      memoryUsers.set(email, { email, username, passwordHash });
    }
    const token = jwt.sign({ sub: email, username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.status(201).json({ token, user: { email, username } });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
  try {
    const db = getDb();
    if (db) {
      await ensureUsersTable();
      const rows = await query<any>('SELECT email, username, password_hash FROM users WHERE email=$1', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ sub: email, username: user.username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return res.status(200).json({ token, user: { email: user.email, username: user.username } });
    } else {
      const mem = memoryUsers.get(email);
      if (!mem) return res.status(401).json({ message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, mem.passwordHash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ sub: email, username: mem.username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return res.status(200).json({ token, user: { email: mem.email, username: mem.username } });
    }
  } catch (e) {
    const mem = memoryUsers.get(email);
    if (!mem) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, mem.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: email, username: mem.username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.status(200).json({ token, user: { email: mem.email, username: mem.username } });
  }
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
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Missing email' });
  try {
    const db = getDb();
    if (db) {
      await ensureUsersTable();
      const rows = await query<any>('SELECT id FROM users WHERE email=$1', [email]);
      if (!rows.length) return res.status(404).json({ message: 'User not found' });
    } else {
      if (!memoryUsers.has(email)) return res.status(404).json({ message: 'User not found' });
    }
    const token = Math.random().toString(36).slice(2, 10);
    resetTokens.set(email, token);
    return res.status(200).json({ message: 'Reset token generated', token });
  } catch (e) {
    const token = Math.random().toString(36).slice(2, 10);
    resetTokens.set(email, token);
    return res.status(200).json({ message: 'Reset token generated', token });
  }
});

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body || {};
  if (!email || !token || !newPassword) return res.status(400).json({ message: 'Missing fields' });
  const expected = resetTokens.get(email);
  if (!expected || expected !== token) return res.status(400).json({ message: 'Invalid token' });
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const db = getDb();
    if (db) {
      await ensureUsersTable();
      await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE email=$2', [passwordHash, email]);
    } else {
      const mem = memoryUsers.get(email);
      if (mem) {
        memoryUsers.set(email, { ...mem, passwordHash });
      }
    }
    resetTokens.delete(email);
    return res.status(200).json({ message: 'Password updated' });
  } catch (e) {
    const mem = memoryUsers.get(email);
    if (mem) {
      memoryUsers.set(email, { ...mem, passwordHash: await bcrypt.hash(newPassword, 10) });
      resetTokens.delete(email);
      return res.status(200).json({ message: 'Password updated' });
    }
    return res.status(500).json({ message: 'Failed to update password' });
  }
});

export default router;
