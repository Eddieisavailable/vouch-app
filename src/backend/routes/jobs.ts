import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, isPg } from '../db.js';
import { requireAuth } from './auth.js';
import { sendEmail, Templates } from '../email.js';

const router = Router();
router.use(requireAuth);

export const createNotification = async (userId: string, type: string, title: string, message: string, link: string, emailTemplate?: { name: keyof typeof Templates, args: any[] }) => {
  try {
    const id = uuidv4();
    const expiresQuery = isPg 
      ? `CURRENT_TIMESTAMP + interval '30 days'`
      : `datetime('now', '+30 days')`;
    
    await query(`
      INSERT INTO notifications (notification_id, user_id, type, title, message, link_url, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, ${expiresQuery})
    `, [id, userId, type, title, message, link]);

    // Send Email if applicable
    if (emailTemplate) {
       // Check user email and settings
       const u = await query("SELECT email FROM users WHERE user_id = $1", [userId]);
       const email = u[0]?.email;
       if (email) {
          const s = await query("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
          const settings = s[0] || {};
          
          let shouldSend = settings.email_notifications_enabled;
          if (shouldSend) {
             if (type === 'bid_received' && !settings.notify_bid_received) shouldSend = false;
             if (type === 'bid_accepted' && !settings.notify_bid_accepted) shouldSend = false;
             if (type === 'job_completed' && !settings.notify_job_completed) shouldSend = false;
             if (type === 'payment_recorded' && !settings.notify_payment_received) shouldSend = false;
             if (type === 'review_received' && !settings.notify_review_received) shouldSend = false;
             if (type === 'new_message' && !settings.notify_messages) shouldSend = false;
          }

          if (shouldSend) {
             const tplFn = Templates[emailTemplate.name] as any;
             if (tplFn) {
                const html = tplFn(...emailTemplate.args);
                await sendEmail(email, title, html);
             }
          }
       }
    }

  } catch (err) {
    console.error("Failed to create notification", err);
  }
};

// GET /api/jobs -> Find Jobs (open jobs)
router.get('/', async (req: any, res) => {
  try {
    const { trade_category, county, city, budget_min, budget_max, urgency_level, sort, page = 1, limit = 20, q } = req.query;
    
    let baseQuery = `
      FROM jobs j
      JOIN trade_categories tc ON j.trade_category_id = tc.category_id
      LEFT JOIN user_profiles p ON j.employer_id = p.user_id
      LEFT JOIN users u ON j.employer_id = u.user_id
      WHERE j.status = 'open'
    `;
    
    // Add expires_at check
    if (isPg) baseQuery += ` AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP) `;
    else baseQuery += ` AND (j.expires_at IS NULL OR j.expires_at > datetime('now')) `;

    const params: any[] = [];
    let paramCount = 1;

    if (trade_category) { baseQuery += ` AND j.trade_category_id = $${paramCount++}`; params.push(trade_category); }
    if (county && county !== 'All Counties') { baseQuery += ` AND j.county = $${paramCount++}`; params.push(county); }
    if (city) { baseQuery += ` AND j.city ILIKE $${paramCount++}`; params.push(`%${city}%`); }
    if (budget_min) { baseQuery += ` AND j.budget_max_lrd >= $${paramCount++}`; params.push(budget_min); }
    if (budget_max) { baseQuery += ` AND j.budget_min_lrd <= $${paramCount++}`; params.push(budget_max); }
    if (urgency_level) { baseQuery += ` AND j.urgency_level = $${paramCount++}`; params.push(urgency_level); }
    
    if (q) {
      if (isPg) {
        baseQuery += ` AND j.search_vector @@ websearch_to_tsquery('english', $${paramCount})`;
        params.push(q);
      } else {
        baseQuery += ` AND (j.title LIKE $${paramCount} OR j.description LIKE $${paramCount})`;
        params.push(`%${q}%`);
      }
      paramCount++;
    }

    let orderBy = 'ORDER BY j.created_at DESC';
    if (sort === 'budget_high') orderBy = 'ORDER BY j.budget_max_lrd DESC';
    if (sort === 'budget_low') orderBy = 'ORDER BY j.budget_min_lrd ASC';
    if (sort === 'urgent') orderBy = 'ORDER BY j.urgency_level DESC, j.created_at DESC';

    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const resultQuery = `
      SELECT j.*, tc.name as category_name, tc.icon_class, p.first_name, u.username
      ${baseQuery}
      ${orderBy}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    const totalRes = await query(countQuery, params);
    const jobsRes = await query(resultQuery, [...params, limit, offset]);

    res.json({
      jobs: jobsRes,
      total: parseInt(totalRes[0]?.total || 0),
      page: Number(page),
      limit: Number(limit)
    });

  } catch (err) {
    console.error('Fetch jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/trade-categories
router.get('/trade-categories', async (req, res) => {
  try {
    const cats = await query("SELECT * FROM trade_categories ORDER BY display_order ASC");
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/jobs/my-jobs -> Jobs posted by current employer
router.get('/my-jobs', async (req: any, res) => {
  try {
    const userId = req.user.user_id;
    if (req.user.user_type !== 'employer') {
      return res.status(403).json({ error: 'Only employers have owned jobs' });
    }

    const jobs = await query(`
      SELECT j.*, tc.name as category_name,
      (SELECT COUNT(*) FROM bids b WHERE b.job_id = j.job_id) as bid_count
      FROM jobs j
      LEFT JOIN trade_categories tc ON j.trade_category_id = tc.category_id
      WHERE j.employer_id = $1
      ORDER BY j.created_at DESC
    `, [userId]);

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your jobs' });
  }
});

// GET /api/jobs/:id -> Get job details
router.get('/:id', async (req, res) => {
  try {
    const jobs = await query(`
      SELECT j.*, tc.name as category_name, tc.icon_class, u.username,
      (SELECT COUNT(*) FROM bids b WHERE b.job_id = j.job_id) as bid_count,
      (SELECT tradesperson_id FROM bids b WHERE b.job_id = j.job_id AND b.status = 'accepted' LIMIT 1) as tp_id,
      (SELECT transaction_id FROM transactions t WHERE t.job_id = j.job_id AND t.status = 'pending' ORDER BY t.created_at DESC LIMIT 1) as pending_tx_id
      FROM jobs j
      JOIN trade_categories tc ON j.trade_category_id = tc.category_id
      JOIN users u ON j.employer_id = u.user_id
      WHERE j.job_id = $1
    `, [req.params.id]);

    if (!jobs.length) return res.status(404).json({ error: 'Job not found' });
    res.json(jobs[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs
router.post('/', async (req: any, res) => {
  try {
    if (req.user.user_type !== 'employer') {
      return res.status(403).json({ error: 'Only employers can post jobs' });
    }

    const { title, trade_category_id, description, county, city, budget_min_lrd, budget_max_lrd, urgency_level, currency } = req.body;

    if (!title || !trade_category_id || !description || !county || !city || budget_min_lrd === undefined || budget_max_lrd === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (Number(budget_min_lrd) >= Number(budget_max_lrd)) {
      return res.status(400).json({ error: 'Minimum budget must be less than maximum budget' });
    }

    const job_id = uuidv4();
    const expiresQuery = isPg 
      ? `CURRENT_TIMESTAMP + interval '30 days'`
      : `datetime('now', '+30 days')`;

    await query(`
      INSERT INTO jobs (job_id, employer_id, trade_category_id, title, description, county, city, budget_min_lrd, budget_max_lrd, urgency_level, status, expires_at, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open', ${expiresQuery}, $11)
    `, [job_id, req.user.user_id, trade_category_id, title, description, county, city, budget_min_lrd, budget_max_lrd, urgency_level || 'normal', currency || 'LRD']);

    res.status(201).json({ job_id, message: 'Job posted successfully!' });
  } catch (err) {
    console.error('Post job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/jobs/:id (Edit Job)
router.put('/:id', async (req: any, res) => {
  try {
    const job_id = req.params.id;
    const { title, description, county, city, budget_min_lrd, budget_max_lrd, urgency_level, currency } = req.body;

    const existing = await query("SELECT * FROM jobs WHERE job_id = $1", [job_id]);
    if (!existing.length || existing[0].employer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized to edit this job' });
    }

    // Set to pending_approval again if major fields change
    const newStatus = existing[0].status; // Simplification: we keep it in pending_approval to be reviewed 
    
    await query(`
      UPDATE jobs 
      SET title=$1, description=$2, county=$3, city=$4, budget_min_lrd=$5, budget_max_lrd=$6, urgency_level=$7, currency=$8, status='open', updated_at=CURRENT_TIMESTAMP
      WHERE job_id=$9
    `, [title, description, county, city, budget_min_lrd, budget_max_lrd, urgency_level, currency || 'LRD', job_id]);

    res.json({ message: 'Job updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req: any, res) => {
  try {
    const job_id = req.params.id;
    const existing = await query("SELECT * FROM jobs WHERE job_id = $1", [job_id]);
    if (!existing.length || existing[0].employer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const job = existing[0];
    if (job.status === 'in_progress' || job.status === 'work_started' || job.status === 'awaiting_completion' || job.status === 'awaiting_payment' || job.status === 'payment_pending') {
       // Optional: just cancel instead of delete if it's already "live" with someone assigned
       await query("UPDATE jobs SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE job_id = $1", [job_id]);
       return res.json({ message: 'Job has active participants and was cancelled instead of deleted.' });
    }

    await query("DELETE FROM jobs WHERE job_id = $1", [job_id]);
    res.json({ message: 'Job permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/jobs/:id/start-work
router.put('/:id/start-work', async (req: any, res) => {
  try {
    const job_id = req.params.id;
    const existing = await query("SELECT * FROM jobs WHERE job_id = $1", [job_id]);
    if (!existing.length) return res.status(404).json({ error: 'Job not found' });
    
    const bid = await query("SELECT tradesperson_id FROM bids WHERE job_id = $1 AND status = 'accepted'", [job_id]);
    if (!bid.length || bid[0].tradesperson_id !== req.user.user_id) {
       return res.status(403).json({ error: 'Only the assigned tradesperson can start work' });
    }
    
    // Status should be in_progress (set when bid accepted), we move it to work_started
    await query("UPDATE jobs SET status='work_started', updated_at=CURRENT_TIMESTAMP WHERE job_id=$1", [job_id]);
    res.json({ message: 'Work started' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/jobs/:id/request-completion
router.put('/:id/request-completion', async (req: any, res) => {
  try {
    const job_id = req.params.id;
    const existing = await query("SELECT * FROM jobs WHERE job_id = $1", [job_id]);
    if (!existing.length) return res.status(404).json({ error: 'Job not found' });
    
    const job = existing[0];
    const bid = await query("SELECT tradesperson_id FROM bids WHERE job_id = $1 AND status = 'accepted'", [job_id]);
    if (!bid.length || bid[0].tradesperson_id !== req.user.user_id) {
       return res.status(403).json({ error: 'Only the assigned tradesperson can request completion' });
    }
    
    await query("UPDATE jobs SET status='awaiting_completion', updated_at=CURRENT_TIMESTAMP WHERE job_id=$1", [job_id]);
    
    await createNotification(
      job.employer_id,
      'completion_requested',
      'Work Completion Requested',
      `Tradesperson has marked work as finished for job: "${job.title}". Please confirm.`,
      `/jobs/${job_id}`
    );

    res.json({ message: 'Completion requested' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/jobs/:id/confirm-completion
router.put('/:id/confirm-completion', async (req: any, res) => {
  try {
    const job_id = req.params.id;
    const existing = await query("SELECT * FROM jobs WHERE job_id = $1", [job_id]);
    if (!existing.length) return res.status(404).json({ error: 'Job not found' });
    
    const job = existing[0];
    if (job.employer_id !== req.user.user_id) {
       return res.status(403).json({ error: 'Only the employer can confirm completion' });
    }
    
    await query("UPDATE jobs SET status='awaiting_payment', updated_at=CURRENT_TIMESTAMP WHERE job_id=$1", [job_id]);
    res.json({ message: 'Work confirmed' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/jobs/:id/complete
router.put('/:id/complete', async (req: any, res) => {
  try {
    const job_id = req.params.id;
    const existing = await query(`
      SELECT j.*, 
        (SELECT tradesperson_id FROM bids WHERE job_id = j.job_id AND status = 'accepted' LIMIT 1) as tp_id
      FROM jobs j WHERE job_id = $1
    `, [job_id]);

    if (!existing.length) return res.status(404).json({ error: 'Job not found' });
    
    const job = existing[0];
    if (job.employer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Only the employer can complete the job' });
    }

    await query("UPDATE jobs SET status='completed', updated_at=CURRENT_TIMESTAMP WHERE job_id=$1", [job_id]);
    
    // Create notifications for review
    const employerId = job.employer_id;
    const tradespersonId = job.tp_id;

    if (tradespersonId) {
       const uEmployer = await query("SELECT username FROM users WHERE user_id=$1", [employerId]);
       const uTp = await query("SELECT username FROM users WHERE user_id=$1", [tradespersonId]);

       await createNotification(
         tradespersonId,
         'review_prompt',
         `Please review ${uEmployer[0]?.username}`,
         `Job "${job.title}" has been marked complete. Click to leave a review.`,
         `/jobs/${job_id}`
       );

       await createNotification(
         employerId,
         'review_prompt',
         `Please review ${uTp[0]?.username}`,
         `Job "${job.title}" is complete. Click to leave a review.`,
         `/jobs/${job_id}`
       );
    }
    
    res.json({ message: 'Job completed successfully' });
  } catch (err) {
    console.error('Complete job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
