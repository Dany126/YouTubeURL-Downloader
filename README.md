# LyricSlide

LyricSlide turns an authorized YouTube hymn/song URL into a timestamped, standalone HTML lyrics presentation. The backend validates the URL, extracts temporary audio, asks Gemini to transcribe and structure lyrics, validates the response, and saves an HTML file with its CSS, JavaScript, and lyric data embedded. Downloaded audio is always removed. Once downloaded, the HTML can be opened directly without the backend.

## Features

- Arabic-first RTL and English LTR presentation documents with mixed-script text direction.
- Blue gradient, glass cards, gold accents, large lyric text, and responsive projector-friendly layout.
- Embedded slide navigation, fullscreen, keyboard shortcuts, touch/swipe controls, and auto-hiding controls.
- Server-side Gemini calls and structured-response validation.
- Safe timestamped output files at `generated/lyricslide-YYYYMMDD-HHMMSS.html`.
- Download endpoint and direct generated-file URL.
- Input URL validation, request limits, rate limiting, temporary-media cleanup, filename validation, and path traversal protection.
- Startup logs report whether yt-dlp and FFmpeg are detected.

## Requirements

- Node.js 20 or newer and npm.
- yt-dlp and FFmpeg on the backend process PATH.
- A Gemini API key for real transcription.

### Windows installation

Open PowerShell and run:

```powershell
winget install --id yt-dlp.yt-dlp --source winget --accept-source-agreements --accept-package-agreements
winget install --id Gyan.FFmpeg.Shared --source winget --accept-source-agreements --accept-package-agreements
```

Close and reopen PowerShell after installation so it reads the updated PATH, then verify:

```powershell
yt-dlp --version
ffmpeg -version
```

The yt-dlp Winget package may install FFmpeg as a dependency; the separate FFmpeg package provides a general system installation. If Winget is unavailable, install both tools using another trusted package manager and ensure their executables are on PATH.

## Install the project

From the repository root (`D:\youtube_downloader\YouTubeURL-Downloader`):

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set `GEMINI_API_KEY` to your server-side Gemini key. Never place the key in frontend code. Existing `.env` values are local and ignored by Git.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Backend API port |
| `GEMINI_API_KEY` | — | Server-side Gemini API key |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Gemini model identifier |
| `CORS_ORIGIN` | `http://localhost:5501` | Comma-separated allowed frontend origins |
| `MEDIA_MAX_BYTES` | `18000000` | Maximum extracted audio size |
| `MEDIA_TIMEOUT_MS` | `180000` | yt-dlp timeout |
| `YTDLP_PATH` | `yt-dlp` | Optional yt-dlp executable path |
| `FFMPEG_PATH` | `ffmpeg` | Optional FFmpeg executable path |

## Run locally

Open two PowerShell windows in the project directory. Run the backend in the first:

```powershell
npm run dev
```

It listens on <http://localhost:3000>. Startup reports `yt-dlp detected` / `yt-dlp NOT FOUND` and `FFmpeg detected` / `FFmpeg NOT FOUND`.

Run the frontend in the second:

```powershell
npm run frontend
```

It serves on <http://localhost:5501>. If LyricSlide is already running there, the command reports the existing URL rather than starting a duplicate server. Open the page, paste a YouTube link for content you are authorized to process, and click **Generate Lyrics Presentation**. When ready, choose **Open Presentation** or **Download HTML**.

The API can be checked with:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

## API

### Generate an HTML presentation

`POST /api/generate`

Request:

```json
{ "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID" }
```

Response:

```json
{
  "success": true,
  "presentation": {
    "title": "Song title",
    "artist": null,
    "language": "ar",
    "slideCount": 9
  },
  "file": {
    "name": "lyricslide-20261005-193000.html",
    "url": "/generated/lyricslide-20261005-193000.html"
  }
}
```

Errors return `{ "success": false, "error": { "code": "...", "message": "..." } }`.

### Open and download

- `GET /generated/<filename>` serves the generated HTML for preview in a browser.
- `GET /api/download/<filename>` downloads it as an HTML file.

The download route only accepts timestamped LyricSlide filenames. The saved HTML embeds the presentation data, CSS, and JavaScript; it makes no API requests. Cairo is an optional external font, with local Arabic/system font fallbacks. Download it before stopping the backend, then open the file directly to present offline.

## Architecture

```text
backend/src/controllers/  API orchestration and file download
backend/src/routes/       generation and download routes
backend/src/services/     media extraction, Gemini, presentation validation, HTML generation
backend/src/utils/        YouTube URL, presentation schema, output filename, and cleanup helpers
backend/src/middleware/   centralized safe API errors
frontend/                 small static input/result page and API client
generated/                saved standalone HTML files (ignored by Git)
```

`backend/src/services/html-generator.service.js` takes validated presentation JSON and returns a complete HTML document. Model-supplied strings are JSON/HTML escaped before embedding and rendered using DOM `textContent`, never interpreted as HTML. The renderer is independent of how the lyrics were obtained.

## Development tests

Run:

```powershell
npm test
```

The local fixture at `frontend/sample-presentation.json` is used only by tests, not by the production generation endpoint. Tests check Arabic and English document direction, standalone inline JavaScript, escaping, safe filenames, HTML file saving, and presentation validation. A real transcription additionally requires an authorized, accessible video, yt-dlp, FFmpeg, network access, and a valid Gemini API key.

## Media and copyright

Use LyricSlide only for content you own or are authorized to download and process, and only where that processing complies with applicable law, platform terms, and licenses. You are responsible for obtaining permission. The media service does not use account cookies, bypass DRM, defeat access controls, or circumvent paywalls. Restricted and unavailable media fails with an error. Temporary audio is stored under a unique operating-system temporary directory and deleted after processing. Audio is sent to Google Gemini for analysis; review Google's terms and data policies before submitting sensitive content.

## Troubleshooting

- **`yt-dlp NOT FOUND` / `YTDLP_NOT_FOUND`:** install yt-dlp, reopen the terminal, and restart the backend. Set `YTDLP_PATH` if it is installed outside PATH.
- **`FFmpeg NOT FOUND` / `FFMPEG_NOT_FOUND`:** install FFmpeg, reopen the terminal, and restart the backend. Set `FFMPEG_PATH` if necessary.
- **Media processing failed:** the backend logs the technical yt-dlp error. Confirm the URL is valid, the video is available, and your use is authorized. Private or restricted videos are not bypassed.
- **Gemini error:** check the `.env` key, configured model, network access, and quota.
- **Frontend cannot reach the API:** confirm both servers are running and `CORS_ORIGIN` exactly matches the frontend URL, including its port.
- **No lyrics detected:** try a clearer recording. Lyric accuracy depends on the audio and model; review the saved HTML before presenting.

## Limitations

- Videos are limited to 15 minutes and extracted audio to `MEDIA_MAX_BYTES`.
- Generation progress is shown as an overall loading state; the API does not stream stage-by-stage events.
- Cairo downloads from Google Fonts when online. The presentation remains usable offline with fallback fonts.
- Browser fullscreen support varies by browser and embedding context.
