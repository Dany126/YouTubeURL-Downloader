import { Router } from 'express';
import { generate } from '../controllers/generation.controller.js';
const router = Router();
router.post('/generate', generate);
export default router;
