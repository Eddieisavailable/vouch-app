import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/favorites/jobs -> List user's favorite jobs
router.get('/jobs', async (req: any, res) => {
  try {
    const userId = req.user.user_id;
    const favoriteJobs = await query(`
      SELECT fj.favorite_id, fj.created_at as saved_at, j.*, tc.name as category_name, tc.icon_class, u.username
      FROM favorite_jobs fj
      JOIN jobs j ON fj.job_id = j.job_id
      JOIN trade_categories tc ON j.trade_category_id = tc.category_id
      JOIN users u ON j.employer_id = u.user_id
      WHERE fj.user_id = $1
      ORDER BY fj.created_at DESC
    `, [userId]);
    res.json(favoriteJobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorite jobs' });
  }
});

// POST /api/favorites/jobs -> Add a job to favorites
router.post('/jobs', async (req: any, res) => {
  try {
    const { job_id } = req.body;
    const userId = req.user.user_id;

    if (!job_id) return res.status(400).json({ error: 'Job ID required' });

    const existing = await query("SELECT favorite_id FROM favorite_jobs WHERE user_id = $1 AND job_id = $2", [userId, job_id]);
    if (existing.length > 0) return res.status(400).json({ error: 'Job already in favorites' });

    const favorite_id = uuidv4();
    await query(`
      INSERT INTO favorite_jobs (favorite_id, user_id, job_id)
      VALUES ($1, $2, $3)
    `, [favorite_id, userId, job_id]);

    res.status(201).json({ favorite_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add favorite job' });
  }
});

// DELETE /api/favorites/jobs/:id -> Remove a job from favorites
router.delete('/jobs/:id', async (req: any, res) => {
  try {
    const favorite_id = req.params.id;
    const userId = req.user.user_id;

    await query("DELETE FROM favorite_jobs WHERE favorite_id = $1 AND user_id = $2", [favorite_id, userId]);
    res.json({ message: 'Removed job from favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove favorite job' });
  }
});

// GET /api/favorites -> List user's favorites
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.user_id;
    const favorites = await query(`
      SELECT f.*, u.username, u.overall_rating_avg, u.trust_score, up.profile_photo_url, t.trades, tc.name as trade_category_name
      FROM favorites f
      JOIN users u ON f.favorited_user_id = u.user_id
      JOIN user_profiles up ON u.user_id = up.user_id
      LEFT JOIN tradespeople t ON u.user_id = t.tradesperson_id
      LEFT JOIN trade_categories tc ON t.trade_category_id = tc.category_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    // Parse JSON for SQLite fallback if needed (though usually handled in base query results or db.ts)
    res.json(favorites.map((fav: any) => ({
       ...fav,
       trades: typeof fav.trades === 'string' ? JSON.parse(fav.trades) : (fav.trades || [])
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites -> Add to favorites
router.post('/', async (req: any, res) => {
  try {
    const { favorited_user_id, notes } = req.body;
    const userId = req.user.user_id;

    if (userId === favorited_user_id) return res.status(400).json({ error: 'Cannot favorite yourself' });

    // Check if favorited user is a tradesperson
    const userCheck = await query("SELECT user_type FROM users WHERE user_id = $1", [favorited_user_id]);
    if (!userCheck[0] || (userCheck[0].user_type !== 'tradesperson' && userCheck[0].user_type !== 'agency')) {
       return res.status(400).json({ error: 'Only tradespeople can be favorited' });
    }

    const existing = await query("SELECT favorite_id FROM favorites WHERE user_id = $1 AND favorited_user_id = $2", [userId, favorited_user_id]);
    if (existing.length > 0) return res.status(400).json({ error: 'Already in favorites' });

    const favorite_id = uuidv4();
    await query(`
      INSERT INTO favorites (favorite_id, user_id, favorited_user_id, notes)
      VALUES ($1, $2, $3, $4)
    `, [favorite_id, userId, favorited_user_id, notes]);

    res.status(201).json({ favorite_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/favorites/:id -> Remove from favorites
router.delete('/:id', async (req: any, res) => {
  try {
    const favorite_id = req.params.id;
    const userId = req.user.user_id;

    await query("DELETE FROM favorites WHERE favorite_id = $1 AND user_id = $2", [favorite_id, userId]);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// PUT /api/favorites/:id/notes -> Update notes
router.put('/:id/notes', async (req: any, res) => {
   try {
      const { notes } = req.body;
      const favorite_id = req.params.id;
      const userId = req.user.user_id;

      await query("UPDATE favorites SET notes = $1 WHERE favorite_id = $2 AND user_id = $3", [notes, favorite_id, userId]);
      res.json({ success: true });
   } catch(e) {
      res.status(500).json({ error: 'Failed to update notes' });
   }
});

export default router;
