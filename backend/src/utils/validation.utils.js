import { AppError } from '../middleware/error.middleware.js';

const SECTIONS = new Set(['verse', 'chorus', 'bridge', 'intro', 'outro', null]);
export function validatePresentation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError(502, 'INVALID_GEMINI_RESPONSE', 'The analysis service returned an invalid presentation.');
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const language = typeof value.language === 'string' ? value.language.trim().slice(0, 24) : '';
  const artist = value.artist == null ? null : (typeof value.artist === 'string' ? value.artist.trim().slice(0, 160) || null : undefined);
  if (!title || !language || artist === undefined || !Array.isArray(value.slides) || value.slides.length < 1 || value.slides.length > 80) {
    throw new AppError(502, 'INVALID_GEMINI_RESPONSE', 'The analysis service returned an incomplete presentation.');
  }
  const slides = value.slides.map((slide, index) => {
    if (!slide || !['title', 'lyrics'].includes(slide.type) || typeof slide.text !== 'string' || !slide.text.trim() || slide.text.length > 1600 || !(slide.section == null || SECTIONS.has(slide.section))) {
      throw new AppError(502, 'INVALID_GEMINI_RESPONSE', 'The analysis service returned malformed slide content.');
    }
    return { id: index + 1, type: slide.type, section: slide.section ?? null, text: slide.text.trim() };
  });
  if (!slides.some((slide) => slide.type === 'lyrics')) throw new AppError(422, 'NO_LYRICS_FOUND', 'No usable lyrics were detected in this media.');
  if (slides[0].type !== 'title') slides.unshift({ id: 1, type: 'title', section: null, text: title });
  return { title, artist, language, slides: slides.map((slide, index) => ({ ...slide, id: index + 1 })) };
}
