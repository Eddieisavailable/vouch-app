import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const validMimes = [
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX.'));
    }
  }
});

const DOC_TYPES = ['national_id', 'trade_certificate', 'police_clearance', 'business_registration'];

router.post('/upload', upload.single('document'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });
    const { document_type, expiration_date } = req.body;
    
    if (!document_type || !DOC_TYPES.includes(document_type)) {
      return res.status(400).json({ error: 'Invalid or missing document type.' });
    }

    const limitsRes = await query("SELECT COUNT(*) as count FROM verification_documents WHERE user_id = $1 AND document_type = $2", [req.user.user_id, document_type]);
    if (parseInt(limitsRes[0]?.count || '0') >= 2) {
      return res.status(400).json({ error: `Upload limit exceeded. You can only maintain 2 submissions for ${document_type}.` });
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const isDoc = req.file.mimetype.includes('word') || req.file.mimetype.includes('officedocument');
    const fileType = (isPdf || isDoc) ? 'document' : 'image';
    let secureUrl = '';

    if (fileType === 'document') {
       // Cloudinary needs to know it's not an image for raw files like PDF/Doc
       const b64 = Buffer.from(req.file.buffer).toString('base64');
       const dataURI = `data:${req.file.mimetype};base64,${b64}`;
       const result = await cloudinary.uploader.upload(dataURI, { 
         resource_type: 'raw', 
         folder: 'vouch/verifications',
         public_id: `${req.user.user_id}_${document_type}_${Date.now()}` // better naming
       });
       secureUrl = result.secure_url;
    } else {
       const b64 = Buffer.from(req.file.buffer).toString('base64');
       const dataURI = `data:${req.file.mimetype};base64,${b64}`;
       const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'vouch/verifications',
          width: 1200, crop: 'limit', quality: 'auto',
          public_id: `${req.user.user_id}_${document_type}_${Date.now()}`
       });
       secureUrl = result.secure_url;
    }

    const docId = uuidv4();
    await query(
      `INSERT INTO verification_documents (document_id, user_id, document_type, file_url, file_type, verification_status, submitted_at, expiration_date)
       VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP, $6)`,
      [docId, req.user.user_id, document_type, secureUrl, fileType, expiration_date || null]
    );

    // Notify Admins
    // We get admin users:
    const admins = await query("SELECT user_id FROM users WHERE user_type = 'admin'");
    for (const admin of admins) {
       await query(
         "INSERT INTO notifications (notification_id, user_id, type, title, message, link_url, is_read) VALUES ($1, $2, $3, $4, $5, $6, false)",
         [uuidv4(), admin.user_id, 'verification_submitted', 'New Document Uploaded', `User ${req.user.username || 'someone'} uploaded a new ${document_type}.`, '/admin']
       );
    }

    res.status(201).json({ message: 'Document uploaded successfully', document_id: docId });

  } catch (err: any) {
    console.error(err);
    
    // Log verification error for admin review
    const errorId = uuidv4();
    try {
      await query(`
        INSERT INTO verification_errors (error_id, user_id, document_type, error_message, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `, [errorId, req.user.user_id, req.body.document_type || 'unknown', err.message || 'Unknown upload error', req.headers['user-agent']]);

      // Notify Admins
      const admins = await query("SELECT user_id FROM users WHERE user_type = 'admin'");
      for (const admin of admins) {
        await query(
          "INSERT INTO notifications (notification_id, user_id, type, title, message, link_url, is_read) VALUES ($1, $2, $3, $4, $5, $6, false)",
          [uuidv4(), admin.user_id, 'verification_error', 'Verification Upload Error', `User ${req.user.username} encountered an error while uploading ${req.body.document_type || 'a document'}.`, '/admin/verification-queue']
        );
      }
    } catch (dbErr) {
      console.error('Failed to log verification error or notify admins:', dbErr);
    }

    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.get('/', async (req: any, res) => {
   try {
      const docs = await query("SELECT * FROM verification_documents WHERE user_id = $1 ORDER BY submitted_at DESC", [req.user.user_id]);
      res.json(docs);
   } catch(e) {
      res.status(500).json({ error: 'Server error' });
   }
});

// Optionally delete if rejected to clean up space
router.delete('/:id', async (req: any, res) => {
   try {
      const docs = await query("SELECT file_url, verification_status FROM verification_documents WHERE document_id = $1 AND user_id = $2", [req.params.id, req.user.user_id]);
      if (!docs.length) return res.status(404).json({error:'Not found'});
      if (docs[0].verification_status === 'approved') return res.status(400).json({error:'Cannot delete approved documents'});
      
      await query("DELETE FROM verification_documents WHERE document_id = $1", [req.params.id]);
      res.json({message: 'Deleted'});
   } catch(e) {
      res.status(500).json({ error: 'Server error' });
   }
});

export default router;
