import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, isPg } from '../db.js';
import { requireAuth } from './auth.js';
import { createNotification } from './jobs.js';

const router = Router();

// GET /api/reviews/featured (Public)
router.get('/featured', async (req, res) => {
   try {
     const reviews = await query(`
       SELECT r.*, 
         u1.username as reviewer_username,
         u2.username as reviewee_username,
         j.title as job_title
       FROM reviews r 
       JOIN users u1 ON r.reviewer_id = u1.user_id 
       JOIN users u2 ON r.reviewee_id = u2.user_id
       JOIN jobs j ON r.job_id = j.job_id
       WHERE r.is_featured = true AND r.is_verified = true 
       ORDER BY r.created_at DESC
     `);
     res.json(reviews);
   } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

router.use(requireAuth);

// Recalculation logic helper module
export const recalculateUserTrustScore = async (userId: string) => {
  // Trust score logic:
  // Note: normally this would be an async background job, calling inline here.
  try {
     const stats = await query(`
        SELECT 
          COALESCE(AVG(overall_rating), 0) as ovg,
          COALESCE(AVG(quality_rating), 0) as qual,
          COALESCE(AVG(professionalism_rating), 0) as prof,
          COALESCE(AVG(timeliness_rating), 0) as time,
          COALESCE(AVG(value_rating), 0) as val,
          COALESCE(AVG(communication_rating), 0) as comm,
          COUNT(*) as cnt
        FROM reviews WHERE reviewee_id = $1 AND is_verified = true
     `, [userId]);

     const s = stats[0];
     
     // Update user averages
     await query(`
        UPDATE users SET 
          overall_rating_avg = $1, quality_rating_avg = $2, professionalism_rating_avg = $3,
          timeliness_rating_avg = $4, value_rating_avg = $5, communication_rating_avg = $6,
          total_reviews_count = $7
        WHERE user_id = $8
     `, [s.ovg, s.qual, s.prof, s.time, s.val, s.comm, s.cnt, userId]);

     // Calculate trust score components
     const ratingWeight = (parseFloat(s.ovg) / 5) * 100 * 0.30;
     
     // Completion Rate
     const compStats = await query(`
       SELECT 
         COUNT(CASE WHEN status='completed' THEN 1 END) as comp,
         COUNT(*) as total
       FROM jobs 
       WHERE (employer_id = $1) 
          OR (job_id IN (SELECT job_id FROM bids WHERE tradesperson_id = $1 AND status='accepted'))
     `, [userId]);
     let completionWeight = 0;
     if (compStats[0].total > 0) {
       completionWeight = (compStats[0].comp / compStats[0].total) * 100 * 0.25;
     }

     // Profile Completion
     const profStats = await query("SELECT * FROM user_profiles WHERE user_id = $1", [userId]);
     let profileWeight = 0;
     if (profStats.length > 0) {
       const p = profStats[0];
       const fields = [p.first_name, p.last_name, p.county, p.city, p.phone_number, p.email, p.bio, p.profile_photo_url];
       const filled = fields.filter(f => !!f).length;
       profileWeight = (filled / fields.length) * 100 * 0.20;
     }

     // Account Age Weight
     const user = await query("SELECT created_at FROM users WHERE user_id = $1", [userId]);
     const ageMs = Date.now() - new Date(user[0].created_at).getTime();
     const ageDays = ageMs / (1000 * 60 * 60 * 24);
     const ageWeight = (Math.min(ageDays, 365) / 365) * 100 * 0.15;

     // Number of Reviews Weight
     const count = parseInt(s.cnt);
     let revWeightParam = 0;
     if (count > 0 && count <= 5) revWeightParam = (count * 20);
     else if (count > 5 && count <= 10) revWeightParam = 50 + ((count-5)*10);
     else if (count > 10 && count <= 20) revWeightParam = 100 + ((count-10)*5);
     else if (count > 20) revWeightParam = 150;
     const revWeight = Math.min(100, revWeightParam) * 0.10;

     // Final score
     const trustScore = Math.min(100, Math.round(ratingWeight + completionWeight + profileWeight + ageWeight + revWeight));

     await query("UPDATE users SET trust_score = $1 WHERE user_id = $2", [trustScore, userId]);
  } catch(e) {
    console.error("Recalc err", e);
  }
};


// POST /api/reviews
router.post('/', async (req: any, res) => {
  try {
    const { job_id, overall_rating, quality_rating, professionalism_rating, timeliness_rating, value_rating, communication_rating, testimonial_text } = req.body;
    const reviewer_id = req.user.user_id;
    const reviewer_type = req.user.user_type;

    // Validate inputs
    const ratings = [overall_rating, quality_rating, professionalism_rating, timeliness_rating, value_rating, communication_rating];
    if (ratings.some(r => typeof r !== 'number' || r < 1 || r > 5)) {
      return res.status(400).json({ error: 'All ratings must be between 1 and 5' });
    }
    if (testimonial_text && testimonial_text.length > 1000) {
      return res.status(400).json({ error: 'Testimonial too long' });
    }

    const jobInfo = await query(`
      SELECT j.*, 
        (SELECT tradesperson_id FROM bids WHERE job_id = j.job_id AND status = 'accepted' LIMIT 1) as tp_id
      FROM jobs j WHERE job_id = $1
    `, [job_id]);

    if (!jobInfo.length) return res.status(404).json({ error: 'Job not found' });
    const job = jobInfo[0];

    if (job.status !== 'completed') return res.status(400).json({ error: 'Job must be completed to review' });

    let reviewee_id = null;
    if (job.employer_id === reviewer_id) {
       reviewee_id = job.tp_id;
    } else if (job.tp_id === reviewer_id) {
       reviewee_id = job.employer_id;
    } else {
       return res.status(403).json({ error: 'You are not a participant in this job' });
    }

    if (!reviewee_id) return res.status(400).json({ error: 'No valid reviewee found' });

    // Check duplicate
    const existing = await query("SELECT 1 FROM reviews WHERE job_id=$1 AND reviewer_id=$2", [job_id, reviewer_id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a review for this job' });
    }

    const id = uuidv4();
    const isVerifiedVal = isPg ? 'true' : '1';
    await query(`
      INSERT INTO reviews (review_id, job_id, reviewer_id, reviewee_id, reviewer_type, overall_rating, quality_rating, professionalism_rating, timeliness_rating, value_rating, communication_rating, testimonial_text, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, ${isVerifiedVal})
    `, [id, job_id, reviewer_id, reviewee_id, reviewer_type, overall_rating, quality_rating, professionalism_rating, timeliness_rating, value_rating, communication_rating, testimonial_text || null]);

    // Send notification
    await createNotification(
       reviewee_id,
       'new_review',
       `New Review Received`,
       `You received a new review for job "${job.title}". Check your profile to see it!`,
       `/jobs/${job_id}`
    );

    // Recalculate trust score immediately since it's now automatic
    await recalculateUserTrustScore(reviewee_id);

    res.json({ message: 'Review submitted and published!' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reviews/user/:id
router.get('/user/:id', async (req, res) => {
   try {
     const userId = req.params.id;
     if (!userId || userId === 'undefined' || userId === 'null') {
        return res.status(400).json({ error: 'Invalid user ID format' });
     }
     const reviews = await query(`
       SELECT r.*, u.username as reviewer_username 
       FROM reviews r 
       JOIN users u ON r.reviewer_id = u.user_id 
       WHERE r.reviewee_id = $1 AND r.is_verified = true 
       ORDER BY r.created_at DESC
     `, [userId]);
     res.json(reviews);
   } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

export default router;
