import { AppError } from '../middleware/error.middleware.js';
import { normalizeYouTubeUrl } from '../utils/youtube.utils.js';
import { getAuthorizedAudio } from '../services/media.service.js';
import { transcribeAudio } from '../services/gemini.service.js';
import { buildPresentation } from '../services/presentation.service.js';

export async function generate(req, res) {
  const url = normalizeYouTubeUrl(req.body?.youtubeUrl);
  if (!url) throw new AppError(400, 'INVALID_URL', 'Enter a valid YouTube video URL.');
  if (!process.env.GEMINI_API_KEY) throw new AppError(503, 'GEMINI_API_ERROR', 'Gemini is not configured. Add GEMINI_API_KEY to the server environment.');
  const audio = await getAuthorizedAudio(url);
  const transcript = await transcribeAudio(audio);
  const presentation = buildPresentation(transcript);
  res.json({ success: true, presentation });
}
