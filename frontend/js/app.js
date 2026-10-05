import { apiUrl, generatePresentation } from './api.js';

const form = document.getElementById('generate-form');
const input = document.getElementById('youtube-url');
const button = document.getElementById('generate-button');
const status = document.getElementById('status-panel');
const errorMessage = document.getElementById('error-message');
const resultCard = document.getElementById('result-card');
function friendlyError(error) {
  const messages = { INVALID_URL: 'That link doesn’t look like a supported YouTube video.', YTDLP_NOT_FOUND: 'yt-dlp is missing. Install it and restart the backend.', FFMPEG_NOT_FOUND: 'FFmpeg is missing. Install it and restart the backend.', MEDIA_PROCESSING_FAILED: 'We couldn’t prepare audio from that video. Check that it is available and that you are allowed to process it.', GEMINI_API_ERROR: 'Lyrics analysis is unavailable right now. Please check the server setup.', GEMINI_TIMEOUT: 'Lyrics analysis took too long. Please try again.', INVALID_GEMINI_RESPONSE: 'We couldn’t turn that audio into a presentation. Try another recording.', NO_LYRICS_FOUND: 'No lyrics could be detected in this video.', RATE_LIMITED: 'Too many requests. Please wait a little before trying again.' };
  return messages[error.code] || error.message || 'Something went wrong. Please try again.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); errorMessage.textContent = ''; status.classList.remove('has-error'); resultCard.hidden = true; status.hidden = false;
  button.disabled = true; button.querySelector('span:first-child').textContent = 'Working…';
  document.getElementById('status-title').textContent = 'Validating your link';
  try {
    if (!input.value.trim()) throw new Error('Paste a YouTube link to get started.');
    document.getElementById('status-title').textContent = 'Preparing audio, extracting lyrics, and generating HTML…';
    const result = await generatePresentation(input.value.trim());
    status.hidden = true; resultCard.hidden = false;
    document.getElementById('result-title').textContent = result.presentation.title;
    const artist = result.presentation.artist ? ` · ${result.presentation.artist}` : '';
    document.getElementById('result-meta').textContent = `${result.presentation.language.toUpperCase()}${artist} · ${result.presentation.slideCount} slides`;
    document.getElementById('open-presentation').href = apiUrl(result.file.url);
    document.getElementById('download-html').href = apiUrl(`/api/download/${encodeURIComponent(result.file.name)}`);
  } catch (error) { status.hidden = false; status.classList.add('has-error'); errorMessage.textContent = friendlyError(error); document.getElementById('status-title').textContent = 'We couldn’t finish that'; }
  finally { button.disabled = false; button.querySelector('span:first-child').textContent = 'Generate Lyrics Presentation'; }
});
