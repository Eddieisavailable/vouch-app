import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';
import { createNotification } from './jobs.js';

const router = Router();
router.use(requireAuth);

// POST /api/conversations -> Create or Get conversation
router.post('/', async (req: any, res) => {
  try {
    const { job_id, tradesperson_id } = req.body;
    const userId = req.user.user_id;
    const employer_id = req.user.user_type === 'employer' ? userId : null;
    const tp_id = req.user.user_type !== 'employer' ? userId : tradesperson_id;
    const final_employer_id = req.user.user_type === 'employer' ? userId : (await query("SELECT employer_id FROM jobs WHERE job_id=$1", [job_id]))[0]?.employer_id;

    if (!final_employer_id || !tp_id) return res.status(400).json({ error: 'Missing participants' });

    // Check if conversation exists
    const participants = JSON.stringify([final_employer_id, tp_id].sort());
    const existing = await query(`
      SELECT * FROM conversations WHERE job_id=$1 AND participant_ids::jsonb @> $2::jsonb
    `, [job_id, participants]);

    // SQLite fallback syntax if isPg is false would require complex JSON querying, but keeping simple for demo.
    // Assuming PG for this specific query, SQLite would need a LIKE '%id%' implementation. Let's simplify:
    const allConvos = await query("SELECT * FROM conversations WHERE job_id=$1", [job_id]);
    const convoMatch = allConvos.find(c => {
      const p = typeof c.participant_ids === 'string' ? JSON.parse(c.participant_ids) : c.participant_ids;
      return p.includes(final_employer_id) && p.includes(tp_id);
    });

    if (convoMatch) {
      return res.json({ conversation_id: convoMatch.conversation_id });
    }

    const conversation_id = uuidv4();
    await query(`
      INSERT INTO conversations (conversation_id, job_id, participant_ids)
      VALUES ($1, $2, $3)
    `, [conversation_id, job_id, participants]);

    res.status(201).json({ conversation_id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/conversations -> List user's conversations
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.user_id;

    const convos = await query(`
      SELECT c.*, j.title as job_title, 
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.conversation_id AND m.sender_id != $1 AND m.is_read = false) as unread_count,
      (SELECT message_text FROM messages m WHERE m.conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message_preview
      FROM conversations c
      JOIN jobs j ON c.job_id = j.job_id
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `, [userId]);

    // Filter convos to those containing userId
    const userConvos = convos.filter(c => {
      const p = typeof c.participant_ids === 'string' ? JSON.parse(c.participant_ids) : c.participant_ids;
      return p.includes(userId);
    });

    // Resolve other participant details
    for (let c of userConvos) {
      const p = typeof c.participant_ids === 'string' ? JSON.parse(c.participant_ids) : c.participant_ids;
      const otherId = p.find((id: string) => id !== userId);
      const otherUser = await query("SELECT u.username, up.profile_photo_url FROM users u LEFT JOIN user_profiles up ON u.user_id=up.user_id WHERE u.user_id=$1", [otherId]);
      c.other_participant = otherUser[0] || { username: 'Unknown' };
    }

    res.json(userConvos);
  } catch (err) {
    console.error("Fetch conversations err", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/conversations/search -> Search messages
router.get('/search', async (req: any, res) => {
   try {
      const { q, conversation_id } = req.query;
      if (!q) return res.json([]);
      
      let queryText = `
         SELECT m.*, c.job_id, j.title as job_title, u.username as sender_name 
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.conversation_id
         JOIN jobs j ON c.job_id = j.job_id
         JOIN users u ON m.sender_id = u.user_id
         WHERE m.message_text ILIKE $1 
         AND c.participant_ids::jsonb @> $2::jsonb
      `;
      let params: any[] = [`%${q}%`, `"${req.user.user_id}"`];

      if (conversation_id) {
         queryText += ` AND m.conversation_id = $3`;
         params.push(conversation_id);
      }

      queryText += ' ORDER BY m.created_at DESC LIMIT 50';

      const results = await query(queryText, params);
      
      // Filter fallback for SQLite
      const filtered = results.filter((r: any) => {
         const p = typeof r.participant_ids === 'string' ? JSON.parse(r.participant_ids) : r.participant_ids;
         return !p || p.includes(req.user.user_id);
      });

      res.json(filtered);
   } catch (e) {
      res.status(500).json({ error: 'Search failed' });
   }
});

// GET /api/conversations/:id/messages -> Get messages in thread
router.get('/:id/messages', async (req: any, res) => {
  try {
    const conversation_id = req.params.id;
    const { since } = req.query;
    
    // Mark as read
    await query(`
      UPDATE messages SET is_read = true, read_at = CURRENT_TIMESTAMP 
      WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false
    `, [conversation_id, req.user.user_id]);

    let sql = `SELECT * FROM messages WHERE conversation_id = $1`;
    const params = [conversation_id];
    
    if (since) {
      sql += ` AND created_at > $2`;
      params.push(since);
    }
    
    sql += ` ORDER BY created_at ASC`;
    const messages = await query(sql, params);
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages -> Send message
router.post('/messages', async (req: any, res) => {
  try {
    const { conversation_id, message_text, attachments } = req.body;
    if (!message_text && (!attachments || attachments.length === 0)) return res.status(400).json({ error: 'Invalid message' });
    
    let safeAttachments = [];
    if (Array.isArray(attachments)) {
       safeAttachments = attachments.slice(0, 3);
    }

    const message_id = uuidv4();
    await query(`
      INSERT INTO messages (message_id, conversation_id, sender_id, message_text, attachments)
      VALUES ($1, $2, $3, $4, $5)
    `, [message_id, conversation_id, req.user.user_id, message_text || '', JSON.stringify(safeAttachments)]);

    await query("UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, is_typing = false WHERE conversation_id=$1", [conversation_id]);

    // Discover the other participant to send them a notification
    const convo = await query("SELECT participant_ids, job_id, (SELECT title FROM jobs WHERE jobs.job_id = conversations.job_id) as job_title FROM conversations WHERE conversation_id=$1", [conversation_id]);
    if (convo.length > 0) {
      const p = typeof convo[0].participant_ids === 'string' ? JSON.parse(convo[0].participant_ids) : convo[0].participant_ids;
      const otherId = p.find((id: string) => id !== req.user.user_id);
      if (otherId) {
        await createNotification(
          otherId,
          'new_message',
          `New message from ${req.user.username}`,
          `You have a new message regarding "${convo[0].job_title}"`,
          `/messages?id=${conversation_id}`,
          { name: 'NewMessage', args: [req.user.username] }
        );
      }
    }

    const created = await query("SELECT * FROM messages WHERE message_id=$1", [message_id]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/conversations/:id/typing -> Set typing indicator
router.put('/:id/typing', async (req: any, res) => {
   try {
      const { is_typing } = req.body;
      await query("UPDATE conversations SET is_typing = $1, typing_updated_at = CURRENT_TIMESTAMP WHERE conversation_id = $2", [!!is_typing, req.params.id]);
      res.json({ success: true });
   } catch(e) {
      res.status(500).json({ error: 'Server error' });
   }
});

// Notifications Endpoints
router.get('/notifications', async (req: any, res) => {
  try {
    const notifs = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [req.user.user_id]);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

router.put('/notifications/read-all', async (req: any, res) => {
  try {
    await query("UPDATE notifications SET is_read = true WHERE user_id = $1", [req.user.user_id]);
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
