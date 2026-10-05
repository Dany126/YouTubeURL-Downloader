import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeYouTubeUrl } from '../src/utils/youtube.utils.js';
import { buildPresentation } from '../src/services/presentation.service.js';
import { validatePresentation } from '../src/utils/validation.utils.js';

test('normalizes supported YouTube URL variants', () => {
  const expected = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  for (const input of [expected, 'https://youtu.be/dQw4w9WgXcQ?t=4', 'https://youtube.com/shorts/dQw4w9WgXcQ']) {
    assert.equal(normalizeYouTubeUrl(input), expected);
  }
});

test('rejects arbitrary hosts and malformed video IDs', () => {
  assert.equal(normalizeYouTubeUrl('https://example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(normalizeYouTubeUrl('https://youtube.com/watch?v=short'), null);
  assert.equal(normalizeYouTubeUrl('https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(normalizeYouTubeUrl('javascript:alert(1)'), null);
});

test('validates presentation data and creates IDs', () => {
  const presentation = validatePresentation({ title: 'ترنيمة', artist: null, language: 'ar', slides: [
    { type: 'title', text: 'ترنيمة' }, { type: 'lyrics', section: 'verse', text: 'كلمات جميلة' }
  ] });
  assert.deepEqual(presentation.slides.map((slide) => slide.id), [1, 2]);
});

test('splits long lyrics into readable multi-line slides', () => {
  const words = Array.from({ length: 45 }, (_, index) => `word${index}`);
  const presentation = buildPresentation({ title: 'Song', artist: null, language: 'en', slides: [
    { type: 'title', text: 'Song' }, { type: 'lyrics', section: 'verse', text: words.join(' ') }
  ] });
  assert.ok(presentation.slides.length > 2);
  assert.ok(presentation.slides.slice(1).every((slide) => slide.text.split('\n').length <= 4));
});

test('rejects malformed Gemini presentations', () => {
  assert.throws(() => validatePresentation({ title: 'Song', artist: null, language: 'en', slides: [{ type: 'unknown', text: 'bad' }] }), { code: 'INVALID_GEMINI_RESPONSE' });
});
