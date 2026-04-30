import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();

// POST create dispute
router.post('/', requireAuth, async (req, res) => {
  try {
    const { job_id, dispute_type, description, evidence_urls } = req.body;
    
    // Validate job is in progress or later
    const jobRes = await query("SELECT status, employer_id FROM jobs WHERE job_id = $1", [job_id]);
    if (!jobRes.length) return res.status(404).json({ error: 'Job not found' });
    const job = jobRes[0];
    
    if (job.status === 'open' || job.status === 'pending_approval') {
      return res.status(400).json({ error: 'Cannot dispute a job that has not started' });
    }

    const bidRes = await query("SELECT tradesperson_id FROM bids WHERE job_id = $1 AND status = 'accepted'", [job_id]);
    const tradesperson_id = bidRes.length ? bidRes[0].tradesperson_id : null;

    let against_user = null;
    if ((req as any).user.user_id === job.employer_id) {
       against_user = tradesperson_id;
    } else if ((req as any).user.user_id === tradesperson_id) {
       against_user = job.employer_id;
    } else {
       return res.status(403).json({ error: 'Not authorized for this job' });
    }

    const disputeId = uuidv4();
    await query(
      `INSERT INTO disputes (dispute_id, job_id, raised_by, against_user, dispute_type, description, evidence_urls, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', CURRENT_TIMESTAMP)`,
      [disputeId, job_id, (req as any).user.user_id, against_user, dispute_type, description, JSON.stringify(evidence_urls || [])]
    );

    await query("UPDATE jobs SET status = 'disputed' WHERE job_id = $1", [job_id]);

    await query(
      "INSERT INTO notifications (notification_id, user_id, type, title, message, link_url) VALUES ($1, $2, $3, $4, $5, $6)",
      [uuidv4(), against_user, 'dispute', 'Dispute Filed', 'A dispute has been filed for this job.', `/disputes/${disputeId}`]
    );

    res.status(201).json({ message: 'Dispute filed. Admin team will review and respond within 48 hours.', dispute_id: disputeId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET disputes (user)
router.get('/my-disputes', requireAuth, async (req: any, res) => {
  try {
    let disputes;
    if (req.user.user_type === 'admin') {
      disputes = await query(
        `SELECT d.*, j.title as job_title, r.username as raised_by_name, a.username as against_name 
         FROM disputes d 
         JOIN jobs j ON d.job_id = j.job_id 
         JOIN users r ON d.raised_by = r.user_id
         JOIN users a ON d.against_user = a.user_id
         ORDER BY d.created_at DESC`
      );
    } else {
      disputes = await query(
        `SELECT d.*, j.title as job_title FROM disputes d JOIN jobs j ON d.job_id = j.job_id WHERE d.raised_by = $1 OR d.against_user = $1 ORDER BY d.created_at DESC`,
        [req.user.user_id]
      );
    }
    res.json(disputes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET dispute details
router.get('/:id', requireAuth, async (req, res) => {
   try {
      const { id } = req.params;
      const disputeRes = await query(`SELECT d.*, j.title as job_title, r.username as raised_by_user, a.username as against_username 
         FROM disputes d
         JOIN jobs j ON d.job_id = j.job_id
         JOIN users r ON d.raised_by = r.user_id
         JOIN users a ON d.against_user = a.user_id
         WHERE d.dispute_id = $1`, [id]);
      if (!disputeRes.length) return res.status(404).json({error: 'Not found'});
      
      const isPart = disputeRes[0].raised_by === (req as any).user.user_id || disputeRes[0].against_user === (req as any).user.user_id || (req as any).user.user_type === 'admin';
      if (!isPart) return res.status(403).json({error: 'Forbidden'});
      
      const messages = await query(
         `SELECT m.*, u.username as sender_name FROM dispute_messages m JOIN users u ON m.sender_id = u.user_id WHERE m.dispute_id = $1 ORDER BY m.created_at ASC`,
         [id]
      );
      
      res.json({ dispute: disputeRes[0], messages });
   } catch(err) {
      console.error(err);
      res.status(500).json({error: 'Server error'});
   }
});

// POST message
router.post('/:id/messages', requireAuth, async (req, res) => {
   try {
      const { message_text } = req.body;
      const { id } = req.params;
      await query(
         `INSERT INTO dispute_messages (message_id, dispute_id, sender_id, message_text, is_admin, created_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
         [uuidv4(), id, (req as any).user.user_id, message_text, (req as any).user.user_type === 'admin']
      );
      res.status(201).json({message: 'Added'});
   } catch(err) {
      console.error(err);
      res.status(500).json({error: 'Server error'});
   }
});

// ADMIN ONLY - resolve dispute
router.put('/:id/resolve', requireAuth, async (req, res) => {
   try {
      if((req as any).user.user_type !== 'admin') return res.status(403).json({error: 'Forbidden'});
      const { resolution_action, resolution_notes, next_job_status } = req.body;
      const { id } = req.params;
      
      await query(
         `UPDATE disputes SET status = 'resolved', resolution_action = $1, resolution_notes = $2, resolved_at = CURRENT_TIMESTAMP, resolved_by = $3 WHERE dispute_id = $4`,
         [resolution_action, resolution_notes, (req as any).user.user_id, id]
      );
      
      const dRes = await query("SELECT job_id, raised_by, against_user FROM disputes WHERE dispute_id = $1", [id]);
      if(dRes.length > 0 && next_job_status) {
         await query("UPDATE jobs SET status = $1 WHERE job_id = $2", [next_job_status, dRes[0].job_id]);
         // notify both...
      }
      res.json({message: 'Resolved'});
   } catch(err) {
      console.error(err);
      res.status(500).json({error: 'Server error'});
   }
});

export default router;
