import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { query } from '../db.js';
import { requireAuth } from './auth.js';
import { recalculateUserTrustScore } from './reviews.js';

const router = Router();
router.use(requireAuth);

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // increased to 10MB
  fileFilter: (req, file, cb) => {
    const validMimes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: Images, PDF, Word, Text.'));
    }
  }
});

router.post('/profile-photo', upload.single('photo'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Mock for missing env vars
      return res.status(500).json({ error: 'Cloudinary configuration missing. Please add credentials to settings.' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
       width: 400, height: 400, crop: 'fill', gravity: 'face'
    });

    await query("UPDATE user_profiles SET profile_photo_url = $1 WHERE user_id = $2", [result.secure_url, req.user.user_id]);
    await recalculateUserTrustScore(req.user.user_id); // update profile completeness score

    res.json({ url: result.secure_url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.post('/portfolio', upload.array('photos', 5), async (req: any, res) => {
  try {
    if (req.user.user_type !== 'tradesperson' && req.user.user_type !== 'agency') {
       return res.status(403).json({ error: 'Only tradespeople can upload portfolio photos' });
    }
    
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No photos uploaded' });
    if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(500).json({ error: 'Cloudinary missing' });

    const currentPhotos = await query("SELECT portfolio_photos FROM tradespeople WHERE tradesperson_id = $1", [req.user.user_id]);
    let existing = currentPhotos.length ? (typeof currentPhotos[0].portfolio_photos === 'string' ? JSON.parse(currentPhotos[0].portfolio_photos) : currentPhotos[0].portfolio_photos) : [];
    
    if (!Array.isArray(existing)) existing = [];
    if (existing.length + req.files.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 portfolio photos allowed' });
    }

    const uploadPromises = (req.files as any[]).map(file => {
      const dataURI = `data:${file.mimetype};base64,${Buffer.from(file.buffer).toString('base64')}`;
      const isImage = file.mimetype.startsWith('image/');
      
      const options: any = {
        folder: 'vouch/portfolio',
        resource_type: isImage ? 'image' : 'raw'
      };
      
      if (isImage) {
        options.width = 1920; 
        options.quality = 'auto'; 
      }

      return cloudinary.uploader.upload(dataURI, options);
    });

    const results = await Promise.all(uploadPromises);
    const newPhotos = results.map((r, idx) => ({ 
      public_id: r.public_id, 
      url: r.secure_url, 
      caption: '',
      file_type: (req.files as any[])[idx].mimetype.startsWith('image/') ? 'image' : 'document'
    }));
    
    const updatedPhotos = [...existing, ...newPhotos];
    await query("UPDATE tradespeople SET portfolio_photos=$1 WHERE tradesperson_id=$2", [JSON.stringify(updatedPhotos), req.user.user_id]);
    await recalculateUserTrustScore(req.user.user_id);
    
    res.json(updatedPhotos);
  } catch (err: any) { res.status(500).json({ error: 'Upload failed' }); }
});

router.delete('/portfolio/:publicId', async (req: any, res) => {
   try {
     const public_id = req.params.publicId;
     await cloudinary.uploader.destroy(public_id);

     const currentPhotos = await query("SELECT portfolio_photos FROM tradespeople WHERE tradesperson_id = $1", [req.user.user_id]);
     if (currentPhotos.length > 0) {
        let existing = typeof currentPhotos[0].portfolio_photos === 'string' ? JSON.parse(currentPhotos[0].portfolio_photos) : currentPhotos[0].portfolio_photos;
        if (!Array.isArray(existing)) existing = [];
        const filtered = existing.filter((p: any) => p.public_id !== public_id);
        await query("UPDATE tradespeople SET portfolio_photos=$1 WHERE tradesperson_id=$2", [JSON.stringify(filtered), req.user.user_id]);
     }
     
     res.json({ message: 'Deleted' });
   } catch(e) { res.status(500).json({ error: 'Delete failed' }); }
});

router.post('/message-attachment', upload.single('image'), async (req: any, res) => {
   try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(500).json({ error: 'Cloudinary missing' });
      
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const isImage = req.file.mimetype.startsWith('image/');
      const uploadOptions: any = {
         folder: 'vouch/messages',
         resource_type: isImage ? 'image' : 'raw'
      };

      if (isImage) {
         uploadOptions.width = 1200;
         uploadOptions.quality = 'auto';
         uploadOptions.crop = 'limit';
      }

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
      res.json({ secure_url: result.secure_url });
   } catch(err: any) {
      res.status(500).json({ error: err.message || 'Upload failed' });
   }
});

export default router;
