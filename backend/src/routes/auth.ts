import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db/pool';
import { config } from '../config/env';

const router = Router();
const googleClient = new OAuth2Client(config.google.clientId);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['parent', 'babysitter']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, first_name, last_name`,
      [data.email, passwordHash, data.role, data.firstName, data.lastName, data.phone || null]
    );

    const user = result.rows[0];

    // Create role-specific profile
    if (data.role === 'parent') {
      await query('INSERT INTO parent_profiles (user_id) VALUES ($1)', [user.id]);
    } else {
      await query('INSERT INTO babysitter_profiles (user_id) VALUES ($1)', [user.id]);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await query(
      'SELECT id, email, role, password_hash, first_name, last_name FROM users WHERE email = $1',
      [data.email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { email, given_name, family_name, picture, sub: googleId } = payload;

    // Check if user exists
    const existing = await query('SELECT id, email, role, first_name, last_name FROM users WHERE email = $1', [email]);

    let user;
    if (existing.rows.length > 0) {
      // Existing user — log them in
      user = existing.rows[0];
    } else {
      // New user — create account (default to 'parent' if no role specified)
      const userRole = role || 'parent';
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const result = await query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, role, first_name, last_name`,
        [email, randomPassword, userRole, given_name || 'User', family_name || '', picture || null]
      );

      user = result.rows[0];

      // Create role-specific profile
      if (userRole === 'parent') {
        await query('INSERT INTO parent_profiles (user_id) VALUES ($1)', [user.id]);
      } else {
        await query('INSERT INTO babysitter_profiles (user_id) VALUES ($1)', [user.id]);
      }
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

export default router;
