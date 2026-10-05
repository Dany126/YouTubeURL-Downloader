import { AppError } from '../middleware/error.middleware.js';
import { normalizeYouTubeUrl } from '../utils/youtube.utils.js';
import { getAuthorizedAudio } from '../services/media.service.js';
import { transcribeAudio } from '../services/gemini.service.js';
import { buildPresentation } from '../services/presentation.service.js';
import { savePresentationHtml } from '../services/html-generator.service.js';
import { generatedFilePath } from '../utils/generated-file.utils.js';
import { access } from 'node:fs/promises';

export async function generate(req, res) {
  const url = normalizeYouTubeUrl(req.body?.youtubeUrl);
  if (!url) throw new AppError(400, 'INVALID_URL', 'Enter a valid YouTube video URL.');
  if (!process.env.GEMINI_API_KEY) throw new AppError(503, 'GEMINI_API_ERROR', 'Gemini is not configured. Add GEMINI_API_KEY to the server environment.');
  const audio = await getAuthorizedAudio(url);
  const transcript = await transcribeAudio(audio);
  const presentation = buildPresentation(transcript);
  const file = await savePresentationHtml(presentation);
  res.json({
    success: true,
    presentation: { title: presentation.title, artist: presentation.artist, language: presentation.language, slideCount: presentation.slides.length },
    file: { name: file.name, url: file.url }
  });
}

export async function downloadGenerated(req, res, next) {
  const filePath = generatedFilePath(req.params.filename);
  if (!filePath) throw new AppError(400, 'INVALID_FILENAME', 'Invalid presentation filename.');
  try {
    await access(filePath);
  } catch {
    throw new AppError(404, 'FILE_NOT_FOUND', 'That generated presentation was not found.');
  }
  res.download(filePath, req.params.filename, (error) => {
    if (error && !res.headersSent) next(error);
  });
}
