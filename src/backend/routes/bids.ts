import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';
import { createNotification } from './jobs.js'; // Helper defined in jobs.ts

const router = Router();
router.use(requireAuth);

// POST /api/bids -> Submit Bid
router.post('/', async (req: any, res) => {
  try {
    if (req.user.user_type !== 'tradesperson' && req.user.user_type !== 'agency') {
      return res.status(403).json({ error: 'Only service providers can bid' });
    }

    const { job_id, proposed_price_lrd, estimated_days, cover_message } = req.body;
    const userId = req.user.user_id;

    // Check Job validation
    const jobRes = await query("SELECT employer_id, status, title FROM jobs WHERE job_id = $1", [job_id]);
    if (!jobRes.length) return res.status(404).json({ error: 'Job not found' });
    
    const job = jobRes[0];
    if (job.employer_id === userId) return res.status(400).json({ error: 'Cannot bid on your own job' });
    if (job.status !== 'open') return res.status(400).json({ error: 'Job is not open for bidding' });

    // Check if already bid
    const existingBid = await query("SELECT 1 FROM bids WHERE job_id=$1 AND tradesperson_id=$2", [job_id, userId]);
    if (existingBid.length > 0) return res.status(400).json({ error: 'Already bid on this job' });

    const bid_id = uuidv4();
    await query(`
      INSERT INTO bids (bid_id, job_id, tradesperson_id, proposed_price_lrd, estimated_days, cover_message)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [bid_id, job_id, userId, proposed_price_lrd, estimated_days, cover_message]);

    // Notify Employer
    await createNotification(
      job.employer_id, 
      'bid_received', 
      'New Bid Received', 
      `${req.user.username} has submitted a bid on your job: ${job.title}`,
      `/jobs/${job_id}/bids`
    );

    res.status(201).json({ bid_id, message: 'Bid submitted successfully!' });
  } catch (err) {
    console.error('Submit bid err:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bids/my-bids -> Bids by current tradesperson
router.get('/my-bids', async (req: any, res) => {
  try {
    const bids = await query(`
      SELECT b.*, j.title as job_title, j.budget_min_lrd, j.budget_max_lrd 
      FROM bids b
      JOIN jobs j ON b.job_id = j.job_id
      WHERE b.tradesperson_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.user_id]);
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/jobs/:id/bids -> Bids for a job (Employer only)
router.get('/job/:job_id', async (req: any, res) => {
  try {
    const job_id = req.params.job_id;
    const job = await query("SELECT employer_id FROM jobs WHERE job_id = $1", [job_id]);
    if (!job.length || job[0].employer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized to view bids for this job' });
    }

    const bids = await query(`
      SELECT b.*, u.username, up.profile_photo_url, tp.company_name
      FROM bids b
      JOIN users u ON b.tradesperson_id = u.user_id
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      LEFT JOIN tradespeople tp ON u.user_id = tp.tradesperson_id
      WHERE b.job_id = $1
      ORDER BY b.created_at DESC
    `, [job_id]);
    
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/bids/:id -> Tradesperson removes bid
router.delete('/:id', async (req: any, res) => {
  try {
    const bidRes = await query("SELECT status, tradesperson_id FROM bids WHERE bid_id=$1", [req.params.id]);
    if (!bidRes.length || bidRes[0].tradesperson_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Only allow deletion if not accepted yet
    if (bidRes[0].status === 'accepted') {
       return res.status(400).json({ error: 'Cannot withdraw an accepted bid that is in progress' });
    }

    await query("DELETE FROM bids WHERE bid_id=$1", [req.params.id]);
    res.json({ message: 'Bid withdrawn and removed' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bids/:id/accept -> Employer accepts bid
router.put('/:id/accept', async (req: any, res) => {
  try {
    const bid_id = req.params.id;
    const bidRes = await query(`
      SELECT b.*, j.employer_id, j.title 
      FROM bids b JOIN jobs j ON b.job_id = j.job_id 
      WHERE b.bid_id = $1
    `, [bid_id]);
    
    if (!bidRes.length || bidRes[0].employer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const bid = bidRes[0];

    // Accept bid
    await query("UPDATE bids SET status='accepted', accepted_at=CURRENT_TIMESTAMP WHERE bid_id=$1", [bid_id]);
    
    // Reject other bids
    await query("UPDATE bids SET status='rejected' WHERE job_id=$1 AND bid_id != $2", [bid.job_id, bid_id]);

    // Update job status
    await query("UPDATE jobs SET status='in_progress' WHERE job_id=$1", [bid.job_id]);

    // Notify Tradesperson
    await createNotification(
      bid.tradesperson_id,
      'bid_accepted',
      'Bid Accepted!',
      `Your bid for "${bid.title}" was accepted. You can now message the employer.`,
      `/my-bids`
    );

    res.json({ message: 'Bid accepted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bids/:id/reject -> Employer rejects bid
router.put('/:id/reject', async (req: any, res) => {
  try {
    const bidRes = await query(`
      SELECT b.*, j.employer_id FROM bids b JOIN jobs j ON b.job_id = j.job_id WHERE b.bid_id = $1
    `, [req.params.id]);
    
    if (!bidRes.length || bidRes[0].employer_id !== req.user.user_id) return res.status(403).json({ error: 'Unauthorized' });

    await query("UPDATE bids SET status='rejected' WHERE bid_id=$1", [req.params.id]);
    res.json({ message: 'Bid rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
