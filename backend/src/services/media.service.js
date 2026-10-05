import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { removeTemporaryFile } from '../utils/cleanup.utils.js';
import { AppError } from '../middleware/error.middleware.js';

const execFileAsync = promisify(execFile);
const MAX_BYTES = Number(process.env.MEDIA_MAX_BYTES || 18_000_000);
const TIMEOUT = Number(process.env.MEDIA_TIMEOUT_MS || 180_000);

// Uses the user's installed yt-dlp only for media they have permission to process.
// No cookies, credentials, DRM workarounds, or access-control bypasses are used.
export async function getAuthorizedAudio(youtubeUrl) {
  const directory = await mkdtemp(join(tmpdir(), 'lyricslide-'));
  const output = join(directory, `${randomUUID()}.%(ext)s`);
  try {
    try {
      await execFileAsync('yt-dlp', [
        '--no-playlist', '--no-part', '--extract-audio', '--audio-format', 'mp3',
        '--audio-quality', '5', '--max-filesize', String(MAX_BYTES),
        '--match-filter', 'duration < 900', '--output', output, youtubeUrl
      ], { timeout: TIMEOUT, windowsHide: true, maxBuffer: 1024 * 1024 });
    } catch (error) {
      const detail = `${error.stderr || ''} ${error.message || ''}`.toLowerCase();
      if (error.code === 'ETIMEDOUT' || error.killed) throw new AppError(504, 'MEDIA_PROCESSING_FAILED', 'Media processing timed out.');
      throw new AppError(422, 'MEDIA_PROCESSING_FAILED', detail.includes('ffmpeg') ? 'Install FFmpeg to enable audio conversion.' : 'Could not process this video. Confirm it is available and that you are authorized to process it.');
    }
    const files = await readdir(directory);
    const media = files.find((file) => /\.(mp3|m4a|wav|webm|opus)$/i.test(file));
    if (!media) throw new AppError(422, 'MEDIA_PROCESSING_FAILED', 'No supported audio could be extracted from this video.');
    const filePath = join(directory, media);
    const buffer = await readFile(filePath);
    if (!buffer.length || buffer.length > MAX_BYTES) throw new AppError(413, 'MEDIA_PROCESSING_FAILED', 'The audio is empty or too large to analyze.');
    return { data: buffer.toString('base64'), mimeType: media.endsWith('.mp3') ? 'audio/mpeg' : media.endsWith('.wav') ? 'audio/wav' : 'audio/mp4' };
  } finally {
    await removeTemporaryFile(directory);
  }
}
