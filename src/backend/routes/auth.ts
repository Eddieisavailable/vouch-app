import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query, generateUniqueLoginId, isPg } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_vouch_2026';

// Middleware for protected routes
export const requireAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.user_type !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, password, userType } = req.body;

    // Validate
    if (!username || username.length < 4 || username.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Invalid username format.' });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    if (userType !== 'tradesperson' && userType !== 'employer' && userType !== 'agency') {
      return res.status(400).json({ error: 'Invalid user type.' });
    }

    const existingUsers = await query("SELECT 1 FROM users WHERE username = $1", [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const unique_login_id = await generateUniqueLoginId();
    const user_id = uuidv4();
    const is_approved = isPg ? 'false' : '0'; // Boolean maps to 0 in SQLite
    const is_active = isPg ? 'true' : '1';

    // Insert User
    await query(`
      INSERT INTO users (user_id, username, password_hash, unique_login_id, user_type, is_approved, is_active)
      VALUES ($1, $2, $3, $4, $5, ${is_approved}, ${is_active})
    `, [user_id, username, password_hash, unique_login_id, userType]);

    // Insert Default Profile
    const profile_id = uuidv4();
    await query(`
      INSERT INTO user_profiles (profile_id, user_id) VALUES ($1, $2)
    `, [profile_id, user_id]);

    // Insert Type-specific record
    if (userType === 'tradesperson' || userType === 'agency') {
      await query(`
        INSERT INTO tradespeople (tradesperson_id, trades, portfolio_photos, service_areas) 
        VALUES ($1, '[]', '[]', '[]')
      `, [user_id]);
    } else {
      await query(`
        INSERT INTO employers (employer_id) VALUES ($1)
      `, [user_id]);
    }

    res.status(201).json({ 
      message: 'Registration successful. Waiting for admin approval.',
      unique_login_id 
    });

    // Notify Admins
    try {
      const admins = await query("SELECT user_id FROM users WHERE user_type = 'admin'");
      for (const admin of admins) {
        await query(
          "INSERT INTO notifications (notification_id, user_id, type, title, message, link_url, is_read) VALUES ($1, $2, $3, $4, $5, $6, false)",
          [uuidv4(), admin.user_id, 'new_user_registration', 'New User Registered', `A new ${userType}, ${username}, has registered and is waiting for approval.`, '/admin/management']
        );
      }
    } catch (notifyErr) {
      console.error('Failed to notify admins of new registration:', notifyErr);
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, isLoginId } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Credentials required.' });
    }

    const queryStr = isLoginId 
      ? 'SELECT * FROM users WHERE unique_login_id = $1'
      : 'SELECT * FROM users WHERE username = $1';

    const users = await query(queryStr, [identifier]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const approvedBool = isPg ? user.is_approved : !!user.is_approved;
    const activeBool = isPg ? user.is_active : !!user.is_active;

    if (!activeBool) {
      return res.status(403).json({ 
        error: 'Your account has been deactivated. Please contact support.',
        suspension_reason: user.suspension_reason
      });
    }

    // Always generate JWT, but encode approval status so UI knows where to route
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        username: user.username, 
        user_type: user.user_type,
        unique_login_id: user.unique_login_id,
        is_approved: approvedBool
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        user_type: user.user_type,
        unique_login_id: user.unique_login_id,
        is_approved: approvedBool
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Forgot Password - Initiate
router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required.' });

    const users = await query("SELECT user_id, username FROM users WHERE username = $1", [username]);
    if (!users.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await query(
      "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE user_id = $3",
      [token, expires, users[0].user_id]
    );

    console.log(`PASSWORD RESET REQUEST for ${username}. Token: ${token}`);
    res.json({ message: 'Reset token generated.', reset_token: token });
  } catch (error) {
    res.status(500).json({ error: 'Server error during password reset request.' });
  }
});

// Reset Password - Finalize
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required.' });

    const users = await query(
      "SELECT user_id FROM users WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP",
      [token]
    );

    if (!users.length) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE user_id = $2",
      [hash, users[0].user_id]
    );

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during password reset.' });
  }
});

// Change Password - While logged in
router.post('/change-password', requireAuth, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new passwords are required.' });

    const users = await query("SELECT password_hash FROM users WHERE user_id = $1", [req.user.user_id]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [hash, req.user.user_id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during password change.' });
  }
});

export default router;
