import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';
import { createNotification } from './jobs.js';

const router = Router();

// POST /api/feedback -> Submit feedback
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { category, message } = req.body;
    const userId = req.user.user_id;
    const pageUrl = req.headers.referer || '';
    const userAgent = req.headers['user-agent'] || '';

    if (!category || !message) return res.status(400).json({ error: 'Category and message are required' });

    const feedback_id = uuidv4();
    await query(`
      INSERT INTO feedback (feedback_id, user_id, category, message, page_url, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [feedback_id, userId, category, message, pageUrl, userAgent]);

    res.status(201).json({ message: 'Thank you for your feedback! We review all submissions.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Admin routes for feedback
const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use((req: any, res, next) => {
  if (req.user.user_type !== 'admin') return res.status(403).json({ error: 'Access denied' });
  next();
});

// GET /api/admin/feedback -> List feedback
adminRouter.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;
    let sql = `
      SELECT f.*, u.username, u.email 
      FROM feedback f
      JOIN users u ON f.user_id = u.user_id
    `;
    const params: any[] = [];
    let where = [];

    if (status) {
       where.push(`f.status = $${params.length + 1}`);
       params.push(status);
    }
    if (category) {
       where.push(`f.category = $${params.length + 1}`);
       params.push(category);
    }

    if (where.length > 0) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY f.created_at DESC";

    const results = await query(sql, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// PUT /api/admin/feedback/:id -> Respond to feedback
adminRouter.put('/:id', async (req: any, res) => {
  try {
    const { status, admin_response } = req.body;
    const feedback_id = req.params.id;
    const adminId = req.user.user_id;

    const existing = await query("SELECT user_id, category FROM feedback WHERE feedback_id = $1", [feedback_id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Feedback not found' });

    await query(`
      UPDATE feedback 
      SET status = $1, admin_response = $2, responded_by = $3, responded_at = CURRENT_TIMESTAMP
      WHERE feedback_id = $4
    `, [status, admin_response, adminId, feedback_id]);

    // Notify user
    await createNotification(
       existing[0].user_id,
       'feedback_response',
       'Feedback Update',
       `An admin has responded to your ${existing[0].category.replace('_', ' ')}. Check your feedback status.`,
       '/settings'
    );

    res.json({ message: 'Feedback updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

export { router as feedbackRoutes, adminRouter as adminFeedbackRoutes };
