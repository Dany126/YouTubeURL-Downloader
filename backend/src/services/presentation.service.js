import { validatePresentation } from '../utils/validation.utils.js';
import { AppError } from '../middleware/error.middleware.js';

function splitReadable(text) {
  const blocks = [];
  let lines = [];
  let line = '';
  const pushLine = () => { if (line) lines.push(line); line = ''; };
  const pushBlock = () => { pushLine(); if (lines.length) blocks.push(lines.join('\n')); lines = []; };
  for (const word of text.trim().split(/\s+/)) {
    if (word.length > 90) {
      pushLine();
      for (let offset = 0; offset < word.length; offset += 90) {
        const piece = word.slice(offset, offset + 90);
        if (piece.length === 90) { pushBlock(); blocks.push(piece); }
        else line = piece;
      }
      continue;
    }
    if (line && `${line} ${word}`.length > 72) pushLine();
    line = line ? `${line} ${word}` : word;
    if (lines.length === 3) pushBlock();
  }
  pushBlock();
  return blocks;
}

export function buildPresentation(raw) {
  const presentation = validatePresentation(raw);
  const slides = presentation.slides.flatMap((slide) => slide.type === 'lyrics'
    ? splitReadable(slide.text).map((text) => ({ ...slide, text }))
    : [slide]);
  if (slides.length > 80) throw new AppError(502, 'INVALID_GEMINI_RESPONSE', 'The analysis service returned too many lyric slides.');
  return { ...presentation, slides: slides.map((slide, index) => ({ ...slide, id: index + 1 })) };
}
