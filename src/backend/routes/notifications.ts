import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, isPg } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();

// GET unread notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await query(
      "SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC LIMIT 50",
      [(req as any).user.user_id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET all notifications
router.get('/all', requireAuth, async (req, res) => {
  try {
    const notifications = await query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200",
      [(req as any).user.user_id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({ error: 'Failed to fetch all notifications' });
  }
});

// PUT mark as read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    await query(
      "UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE notification_id = $1 AND user_id = $2",
      [req.params.id, (req as any).user.user_id]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT mark all as read
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    await query(
      "UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false",
      [(req as any).user.user_id]
    );
    // Cleanup old ones (optional per spec)
    const cleanupQuery = isPg
      ? "DELETE FROM notifications WHERE user_id = $1 AND is_read = true AND read_at < CURRENT_TIMESTAMP - interval '30 days'"
      : "DELETE FROM notifications WHERE user_id = $1 AND is_read = true AND read_at < datetime('now', '-30 days')";
    await query(cleanupQuery, [(req as any).user.user_id]);
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Error marking all read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
