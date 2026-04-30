import { Router } from 'express';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import jobsRoutes from './routes/jobs.js';
import bidsRoutes from './routes/bids.js';
import messagesRoutes from './routes/messages.js';
import reviewRoutes from './routes/reviews.js';
import uploadRoutes from './routes/upload.js';
import statsRoutes from './routes/stats.js';
import transactionsRoutes from './routes/transactions.js';
import disputesRoutes from './routes/disputes.js';
import notificationsRoutes from './routes/notifications.js';
import verificationRoutes from './routes/verification.js';
import settingsRoutes from './routes/settings.js';
import { feedbackRoutes, adminFeedbackRoutes } from './routes/feedback.js';
import favoritesRoutes from './routes/favorites.js';
import helpRoutes from './routes/help.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', profileRoutes); // Common profile
router.use('/tradespeople', profileRoutes); // Tradesperson specific
router.use('/admin', adminRoutes);
router.use('/jobs', jobsRoutes);
router.use('/bids', bidsRoutes);
router.use('/conversations', messagesRoutes);
router.use('/reviews', reviewRoutes);
router.use('/upload', uploadRoutes);
router.use('/analytics', statsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/disputes', disputesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/verification', verificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin/feedback', adminFeedbackRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/help', helpRoutes);

// Healthcheck
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vouch API' });
});

export default router;
