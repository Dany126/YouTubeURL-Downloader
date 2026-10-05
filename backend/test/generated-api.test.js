import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildPresentation } from '../src/services/presentation.service.js';
import { savePresentationHtml } from '../src/services/html-generator.service.js';
import { generatedFilePath } from '../src/utils/generated-file.utils.js';
import { removeTemporaryFile } from '../src/utils/cleanup.utils.js';

test('generated HTML is served as a page and downloaded safely', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const fixture = JSON.parse(await readFile(join(root, 'frontend', 'sample-presentation.json'), 'utf8'));
  const presentation = buildPresentation(fixture);
  const file = await savePresentationHtml(presentation);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    const page = await fetch(`${origin}${file.url}`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    assert.match(await page.text(), /أوبن بوك/);

    const download = await fetch(`${origin}/api/download/${encodeURIComponent(file.name)}`);
    assert.equal(download.status, 200);
    assert.match(download.headers.get('content-disposition'), /attachment; filename=/);
    assert.match(await download.text(), /presentation-data/);

    const invalid = await fetch(`${origin}/api/download/not-a-lyricslide.html`);
    assert.equal(invalid.status, 400);
    const invalidUrl = await fetch(`${origin}/api/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ youtubeUrl: 'https://example.com/clip' }) });
    assert.equal(invalidUrl.status, 400);
    assert.equal((await invalidUrl.json()).error.code, 'INVALID_URL');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await removeTemporaryFile(generatedFilePath(file.name));
  }
});
