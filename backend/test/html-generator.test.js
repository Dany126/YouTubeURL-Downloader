import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildPresentation } from '../src/services/presentation.service.js';
import { generatePresentationHtml, savePresentationHtml } from '../src/services/html-generator.service.js';
import { generatedFilePath } from '../src/utils/generated-file.utils.js';
import { removeTemporaryFile } from '../src/utils/cleanup.utils.js';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

async function samplePresentation() {
  const fixturePath = join(repoRoot, 'frontend', 'sample-presentation.json');
  return buildPresentation(JSON.parse(await readFile(fixturePath, 'utf8')));
}

test('generates complete standalone Arabic and English documents from presentation data', async () => {
  const arabic = await samplePresentation();
  const html = generatePresentationHtml(arabic);
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /--background-start:#1e3c72/);
  assert.match(html, /requestFullscreen/);
  assert.match(html, /function handleSwipe/);
  assert.match(html, /function handleKeyboard/);
  assert.match(html, /event\.key==='ArrowRight'\)\{event\.preventDefault\(\);previousSlide\(\)/);
  assert.match(html, /event\.key==='ArrowLeft'\|\|event\.key===' '\)\{event\.preventDefault\(\);nextSlide\(\)/);
  assert.match(html, /event\.key==='Home'/);
  assert.match(html, /event\.key==='End'/);
  assert.match(html, /setTimeout\(hideControls,3000\)/);
  assert.doesNotMatch(html, /<script\s+src=/i);
  assert.doesNotMatch(html, /type="module"/i);
  const inlineScript = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0]?.[1];
  assert.ok(inlineScript, 'presentation engine is embedded inline');
  assert.doesNotThrow(() => new Script(inlineScript));

  const english = { title: 'A Song', artist: 'Singer', language: 'en', slides: [
    { id: 1, type: 'title', section: null, text: 'A Song' },
    { id: 2, type: 'lyrics', section: 'verse', text: 'Sing together' }
  ] };
  assert.match(generatePresentationHtml(english), /<html lang="en" dir="ltr">/);
});

test('escapes model text in the embedded data and restores it as text content', async () => {
  const dangerous = `Peace & <script>alert("x")</script> it's\nwell`;
  const presentation = { title: 'Test <Hymn>', artist: `O'Neil & Co.`, language: 'en', slides: [
    { id: 1, type: 'title', section: null, text: 'Test <Hymn>' },
    { id: 2, type: 'lyrics', section: 'verse', text: dangerous }
  ] };
  const html = generatePresentationHtml(presentation);
  const serialized = html.match(/<script type="application\/json" id="presentation-data">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(serialized);
  const restored = JSON.parse(serialized);
  assert.equal(restored.slides[1].text, dangerous);
  assert.equal(restored.artist, `O'Neil & Co.`);
  assert.ok(serialized.includes('\\u003c') && serialized.includes('\\u0026') && serialized.includes('\\u0022') && serialized.includes('\\u0027'));
  assert.doesNotMatch(html, /<script>alert\("x"\)<\/script>/);
});

test('saves generated HTML under a safe timestamped name and rejects traversal filenames', async () => {
  const presentation = await samplePresentation();
  const file = await savePresentationHtml(presentation);
  try {
    assert.match(file.name, /^lyricslide-\d{8}-\d{6}(?:-\d{1,3})?\.html$/);
    assert.equal(file.url, `/generated/${file.name}`);
    assert.ok(generatedFilePath(file.name));
    assert.equal(generatedFilePath('../README.md'), null);
    assert.equal(generatedFilePath('C:\\outside.html'), null);
    await access(generatedFilePath(file.name));
    assert.equal(await readFile(generatedFilePath(file.name), 'utf8'), file.html);
    assert.match(file.html, /<html lang="ar" dir="rtl">/);
  } finally {
    await removeTemporaryFile(generatedFilePath(file.name));
  }
});
