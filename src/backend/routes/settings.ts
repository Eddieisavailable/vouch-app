import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: any, res) => {
  try {
     let settings = await query("SELECT * FROM user_settings WHERE user_id = $1", [req.user.user_id]);
     if (!settings.length) {
        // Create defaults
        const setting_id = uuidv4();
        await query(
          `INSERT INTO user_settings (setting_id, user_id, email_notifications_enabled, notify_bid_received, notify_bid_accepted, notify_job_completed, notify_payment_received, notify_review_received, notify_messages)
           VALUES ($1, $2, false, true, true, true, true, true, true)`,
          [setting_id, req.user.user_id]
        );
        settings = await query("SELECT * FROM user_settings WHERE user_id = $1", [req.user.user_id]);
     }
     res.json(settings[0]);
  } catch(e) {
     res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', async (req: any, res) => {
  try {
     const { email_notifications_enabled, notify_bid_received, notify_bid_accepted, notify_job_completed, notify_payment_received, notify_review_received, notify_messages } = req.body;
     
     await query(
        `UPDATE user_settings SET 
         email_notifications_enabled = $1, notify_bid_received = $2, notify_bid_accepted = $3, 
         notify_job_completed = $4, notify_payment_received = $5, notify_review_received = $6, notify_messages = $7,
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $8`,
        [email_notifications_enabled, notify_bid_received, notify_bid_accepted, notify_job_completed, notify_payment_received, notify_review_received, notify_messages, req.user.user_id]
     );
     
     res.json({ message: 'Saved successfully' });
  } catch(e) {
     res.status(500).json({ error: 'Server error' });
  }
});

export default router;
