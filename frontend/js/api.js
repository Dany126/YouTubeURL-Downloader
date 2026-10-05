const API_BASE = window.LYRICSLIDE_API || 'http://localhost:3000';
export async function generatePresentation(youtubeUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 330_000);
  try {
    const response = await fetch(`${API_BASE}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ youtubeUrl }), signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      const error = new Error(payload?.error?.message || (response.status === 429 ? 'Too many requests. Please wait and try again.' : 'The server could not create your presentation.'));
      error.code = payload?.error?.code;
      throw error;
    }
    return payload.presentation;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('This is taking longer than expected. Please try again.');
    if (error instanceof TypeError) throw new Error('Could not reach LyricSlide. Check that the backend is running.');
    throw error;
  } finally { clearTimeout(timeout); }
}
