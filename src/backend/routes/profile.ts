import { Router } from 'express';
import { query, isPg } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();

// Get User Profile
router.get('/profile', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.user_id;
    const userType = req.user.user_type;

    const baseProfileQuery = await query(`
      SELECT up.*, u.username, u.unique_login_id, u.user_type
      FROM user_profiles up
      JOIN users u ON up.user_id = u.user_id
      WHERE up.user_id = $1
    `, [userId]);

    const profileData = baseProfileQuery[0];

    if (!profileData) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (userType === 'tradesperson' || userType === 'agency') {
      const tradeDataQuery = await query(`SELECT * FROM tradespeople WHERE tradesperson_id = $1`, [userId]);
      const tradeData = tradeDataQuery[0] || {};
      
      // Parse JSON from SQLite if necessary
      if (!isPg && tradeData) {
        if (typeof tradeData.trades === 'string') tradeData.trades = JSON.parse(tradeData.trades);
        if (typeof tradeData.service_areas === 'string') tradeData.service_areas = JSON.parse(tradeData.service_areas);
        if (typeof tradeData.portfolio_photos === 'string') tradeData.portfolio_photos = JSON.parse(tradeData.portfolio_photos);
      }
      
      return res.json({ ...profileData, tradesperson: tradeData });
    }

    if (userType === 'employer') {
      const empDataQuery = await query(`SELECT * FROM employers WHERE employer_id = $1`, [userId]);
      return res.json({ ...profileData, employer: empDataQuery[0] || {} });
    }

    return res.json(profileData);

  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update common profile fields
router.put('/profile', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name, county, city, phone_number, email, bio } = req.body;

    await query(`
      UPDATE user_profiles
      SET first_name = $1, last_name = $2, county = $3, city = $4, phone_number = $5, email = $6, bio = $7
      WHERE user_id = $8
    `, [first_name, last_name, county, city, phone_number, email, bio, userId]);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tradesperson specific fields
router.put('/profile/tradesperson', requireAuth, async (req: any, res) => {
  try {
    if (req.user.user_type !== 'tradesperson' && req.user.user_type !== 'agency') {
      return res.status(403).json({ error: 'Only tradespeople or agencies can update these fields' });
    }

    const userId = req.user.user_id;
    const { trades, years_experience, service_areas, company_name } = req.body;

    const tradesJson = isPg ? JSON.stringify(trades || []) : JSON.stringify(trades || []);
    const serviceAreasJson = isPg ? JSON.stringify(service_areas || []) : JSON.stringify(service_areas || []);

    await query(`
      UPDATE tradespeople
      SET trades = $1, years_experience = $2, service_areas = $3, company_name = $4, updated_at = CURRENT_TIMESTAMP
      WHERE tradesperson_id = $5
    `, [tradesJson, years_experience || 0, serviceAreasJson, company_name || null, userId]);

    res.json({ message: 'Professional details updated successfully' });
  } catch (error) {
    console.error('Update tradesperson profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Public User Profile
router.get('/:id/public', requireAuth, async (req: any, res) => {
  try {
    const userId = req.params.id;
    
    // Add early return for invalid UUIDs (e.g. 'undefined' from frontend bugs)
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const baseProfileQuery = await query(`
      SELECT 
       up.*, u.username, u.unique_login_id, u.user_type, u.created_at as joined_at,
       u.overall_rating_avg, u.quality_rating_avg, u.professionalism_rating_avg,
       u.timeliness_rating_avg, u.value_rating_avg, u.communication_rating_avg,
       u.total_reviews_count, u.trust_score
      FROM user_profiles up
      JOIN users u ON up.user_id = u.user_id
      WHERE up.user_id = $1
    `, [userId]);

    const profileData = baseProfileQuery[0];
    if (!profileData) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (profileData.user_type === 'tradesperson' || profileData.user_type === 'agency') {
      const tradeDataQuery = await query(`SELECT * FROM tradespeople WHERE tradesperson_id = $1`, [userId]);
      const tradeData = tradeDataQuery[0] || {};
      
      if (!isPg && tradeData) {
        if (typeof tradeData.trades === 'string') tradeData.trades = JSON.parse(tradeData.trades);
        if (typeof tradeData.service_areas === 'string') tradeData.service_areas = JSON.parse(tradeData.service_areas);
        if (typeof tradeData.portfolio_photos === 'string') tradeData.portfolio_photos = JSON.parse(tradeData.portfolio_photos);
      }
      
      return res.json({ ...profileData, tradesperson: tradeData });
    }

    if (profileData.user_type === 'employer') {
      const empDataQuery = await query(`SELECT * FROM employers WHERE employer_id = $1`, [userId]);
      return res.json({ ...profileData, employer: empDataQuery[0] || {} });
    }

    return res.json(profileData);

  } catch (error) {
    console.error('Fetch public profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
