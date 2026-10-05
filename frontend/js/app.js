import { generatePresentation } from './api.js';
import { renderPresentation, initPresentationControls } from './presentation.js';

const form = document.getElementById('generate-form');
const input = document.getElementById('youtube-url');
const button = document.getElementById('generate-button');
const status = document.getElementById('status-panel');
const errorMessage = document.getElementById('error-message');
const resultCard = document.getElementById('result-card');
const stages = [...document.querySelectorAll('#stages li')];
let readyPresentation = null;

function showStage(name) {
  const order = ['validate', 'media', 'analyze', 'ready'];
  const index = order.indexOf(name);
  stages.forEach((stage, i) => { stage.classList.toggle('active', i === index); stage.classList.toggle('done', i < index); });
}
function friendlyError(error) {
  const messages = { INVALID_URL: 'That link doesn’t look like a supported YouTube video.', MEDIA_PROCESSING_FAILED: 'We couldn’t prepare audio from that video. Check that it is available and that you are allowed to process it.', GEMINI_API_ERROR: 'Lyrics analysis is unavailable right now. Please check the server setup.', GEMINI_TIMEOUT: 'Lyrics analysis took too long. Please try again.', INVALID_GEMINI_RESPONSE: 'We couldn’t turn that audio into a presentation. Try another recording.', NO_LYRICS_FOUND: 'We couldn’t hear clear lyrics in that video.', RATE_LIMITED: 'Too many requests. Please wait a little before trying again.' };
  return messages[error.code] || error.message || 'Something went wrong. Please try again.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); errorMessage.textContent = ''; status.classList.remove('has-error'); resultCard.hidden = true; status.hidden = false;
  button.disabled = true; button.querySelector('span:first-child').textContent = 'Working…';
  showStage('validate'); document.getElementById('status-title').textContent = 'Checking your link';
  try {
    if (!input.value.trim()) throw new Error('Paste a YouTube link to get started.');
    showStage('media'); document.getElementById('status-title').textContent = 'Preparing audio';
    const resultPromise = generatePresentation(input.value.trim());
    showStage('analyze'); document.getElementById('status-title').textContent = 'Listening for the lyrics';
    readyPresentation = await resultPromise;
    showStage('ready'); document.getElementById('status-title').textContent = 'Your slides are ready';
    status.hidden = true; resultCard.hidden = false;
    document.getElementById('result-title').textContent = readyPresentation.title;
    const artist = readyPresentation.artist ? ` · ${readyPresentation.artist}` : '';
    document.getElementById('result-meta').textContent = `${readyPresentation.language.toUpperCase()}${artist} · ${readyPresentation.slides.length} slides`;
    const firstLyrics = readyPresentation.slides.find((slide) => slide.type === 'lyrics');
    const preview = document.getElementById('preview'); preview.textContent = firstLyrics?.text || readyPresentation.title; preview.dir = /[\u0600-\u06FF]/.test(preview.textContent) ? 'rtl' : 'ltr';
  } catch (error) { status.hidden = false; status.classList.add('has-error'); errorMessage.textContent = friendlyError(error); document.getElementById('status-title').textContent = 'We couldn’t finish that'; }
  finally { button.disabled = false; button.querySelector('span:first-child').textContent = 'Make my slides'; }
});

document.getElementById('start-presentation').addEventListener('click', () => { if (readyPresentation) renderPresentation(readyPresentation); });
document.getElementById('try-sample').addEventListener('click', async () => {
  const response = await fetch('./sample-presentation.json');
  readyPresentation = await response.json();
  document.getElementById('result-title').textContent = readyPresentation.title;
  document.getElementById('result-meta').textContent = `${readyPresentation.language.toUpperCase()} · ${readyPresentation.slides.length} sample slides`;
  const sample = readyPresentation.slides.find((slide) => slide.type === 'lyrics');
  document.getElementById('preview').textContent = sample.text;
  document.getElementById('preview').dir = 'rtl';
  status.hidden = true; resultCard.hidden = false;
});
initPresentationControls();
