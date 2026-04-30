import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();

// POST create transaction
router.post('/', requireAuth, async (req, res) => {
  try {
    const { job_id, amount_lrd, payment_method, notes, transaction_type } = req.body;
    
    // Default payee is tradesperson (from accepted bid)
    const bidRes = await query("SELECT tradesperson_id FROM bids WHERE job_id = $1 AND status = 'accepted'", [job_id]);
    if (!bidRes.length) return res.status(400).json({ error: 'No accepted bid found for this job' });
    
    const payee_id = bidRes[0].tradesperson_id;
    const payer_id = (req as any).user.user_id;

    const txId = uuidv4();
    await query(
      `INSERT INTO transactions (transaction_id, job_id, payer_id, payee_id, amount_lrd, transaction_type, payment_method, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [txId, job_id, payer_id, payee_id, amount_lrd, transaction_type || 'deposit', payment_method || 'cash', 'pending', notes]
    );

    // Create notification for payee
    const jobRes = await query("SELECT title FROM jobs WHERE job_id = $1", [job_id]);
    const jobTitle = jobRes[0]?.title || 'Unknown Job';
    await query(
      "INSERT INTO notifications (notification_id, user_id, type, title, message, link_url) VALUES ($1, $2, $3, $4, $5, $6)",
      [uuidv4(), payee_id, 'payment_received', 'Payment Recorded', `Payment recorded by employer for job: ${jobTitle}. Amount: L$${amount_lrd}`, `/jobs/${job_id}`]
    );

    await query("UPDATE jobs SET status = 'payment_pending', updated_at = CURRENT_TIMESTAMP WHERE job_id = $1", [job_id]);

    res.status(201).json({ message: 'Transaction created', transaction_id: txId });
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET my transactions
router.get('/my-transactions', requireAuth, async (req, res) => {
  try {
    const tx = await query(
      `SELECT t.*, j.title as job_title, 
        p1.username as payer_username, p2.username as payee_username
       FROM transactions t
       JOIN jobs j ON t.job_id = j.job_id
       LEFT JOIN users p1 ON t.payer_id = p1.user_id
       LEFT JOIN users p2 ON t.payee_id = p2.user_id
       WHERE t.payer_id = $1 OR t.payee_id = $1
       ORDER BY t.created_at DESC`,
      [(req as any).user.user_id]
    );
    res.json(tx);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT confirm transaction (by payee)
router.put('/:id/confirm', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify payee
    const txRes = await query("SELECT * FROM transactions WHERE transaction_id = $1 AND payee_id = $2", [id, (req as any).user.user_id]);
    if (!txRes.length) return res.status(403).json({ error: 'Not authorized or transaction not found' });
    
    await query("UPDATE transactions SET status = 'confirmed' WHERE transaction_id = $1", [id]);

    const tx = txRes[0];
    const jobRes = await query("SELECT title FROM jobs WHERE job_id = $1", [tx.job_id]);
    const title = jobRes[0]?.title || '';

    await query(
      "INSERT INTO notifications (notification_id, user_id, type, title, message, link_url) VALUES ($1, $2, $3, $4, $5, $6)",
      [uuidv4(), tx.payer_id, 'payment_confirmed', 'Payment Confirmed', `Payment confirmed by tradesperson for job: ${title}`, `/jobs/${tx.job_id}`]
    );

    await query("UPDATE jobs SET status = 'payment_confirmed', updated_at = CURRENT_TIMESTAMP WHERE job_id = $1", [tx.job_id]);

    res.json({ message: 'Transaction confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT complete transaction (by admin)
router.put('/:id/complete', requireAuth, async (req, res) => {
  try {
    if ((req as any).user.user_type !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    await query(
      "UPDATE transactions SET status = 'completed', completed_at = CURRENT_TIMESTAMP, verified_by = $2 WHERE transaction_id = $1",
      [req.params.id, (req as any).user.user_id]
    );
    res.json({ message: 'Transaction completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
