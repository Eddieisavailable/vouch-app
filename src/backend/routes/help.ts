import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';

const router = Router();

// GET /api/help -> List all articles
router.get('/', async (req, res) => {
   try {
      const articles = await query(`
         SELECT article_id, slug, title, category, views_count, updated_at 
         FROM help_articles 
         ORDER BY category, title
      `);
      res.json(articles);
   } catch(e) {
      res.status(500).json({ error: 'Failed to fetch articles' });
   }
});

// GET /api/help/:slug -> Get full article
router.get('/:slug', async (req, res) => {
   try {
      const { slug } = req.params;
      const article = await query("SELECT * FROM help_articles WHERE slug = $1", [slug]);
      
      if (!article[0]) return res.status(404).json({ error: 'Article not found' });

      // Increment views
      await query("UPDATE help_articles SET views_count = views_count + 1 WHERE slug = $1", [slug]);
      
      res.json(article[0]);
   } catch(e) {
      res.status(500).json({ error: 'Internal error' });
   }
});

export default router;
