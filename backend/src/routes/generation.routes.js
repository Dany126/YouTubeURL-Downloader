import { Router } from 'express';
import { downloadGenerated, generate } from '../controllers/generation.controller.js';
const router = Router();
router.post('/generate', generate);
router.get('/download/:filename', downloadGenerated);
export default router;
