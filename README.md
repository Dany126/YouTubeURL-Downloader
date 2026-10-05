# LyricSlide

LyricSlide turns authorized hymn/song audio into a clean, Arabic-first lyric presentation for a screen or projector. It combines an Express API, isolated media and Gemini services, and a lightweight HTML/CSS/JavaScript presentation renderer.

## Features

- YouTube URL validation for standard, short, Shorts, embed, and live links.
- Audio transcription and slide structuring through Google's official Gemini GenAI JavaScript SDK.
- Arabic RTL, English, and mixed-script slide direction detection.
- Blue gradient and glass presentation theme, responsive controls, fullscreen, keyboard and swipe navigation.
- Local sample presentation mode that does not call Gemini.
- Temporary audio cleanup, request limits, rate limiting, centralized errors, and server-only API credentials.

## Requirements

- Node.js 20 or newer and npm.
- `yt-dlp` available on the backend host's PATH.
- FFmpeg available on PATH; yt-dlp uses it to convert audio to MP3.
- A Google Gemini API key for actual generation. The sample presentation works without one.

## Install

```sh
npm install
copy .env.example .env
```

On PowerShell, `Copy-Item .env.example .env` also works. Set `GEMINI_API_KEY` in `.env`. The secret is read only by the backend and is never sent to the browser.

Install yt-dlp and FFmpeg using the package manager for your operating system, then confirm `yt-dlp --version` and `ffmpeg -version` work in the same shell used to run the backend.

## Run

In one terminal, start the API:

```sh
npm run dev
```

In another terminal, serve the frontend:

```sh
npm run frontend
```

Open <http://localhost:5501>. The API listens on <http://localhost:3000>. To run the backend without watch mode, use `npm start`.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | API port |
| `GEMINI_API_KEY` | — | Server-only Gemini API key |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Gemini model ID |
| `CORS_ORIGIN` | `http://localhost:5501` | Comma-separated permitted browser origins |
| `MEDIA_MAX_BYTES` | `18000000` | Maximum extracted audio size |
| `MEDIA_TIMEOUT_MS` | `180000` | yt-dlp processing timeout |

## API

`POST /api/generate`

Request JSON:

```json
{ "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID" }
```

Successful response:

```json
{
  "success": true,
  "presentation": {
    "title": "Song title",
    "artist": null,
    "language": "ar",
    "slides": [
      { "id": 1, "type": "title", "section": null, "text": "Song title" },
      { "id": 2, "type": "lyrics", "section": "verse", "text": "Lyrics…" }
    ]
  }
}
```

Errors use `{ "success": false, "error": { "code": "…", "message": "…" } }`. `GET /api/health` is a simple liveness check. The API allows 10 requests per IP per 15 minutes.

## Try without Gemini

On the landing page, choose **Try sample slides** to load `frontend/sample-presentation.json`. This static fixture is separate from production generation.

## Architecture

```text
backend/src/controllers/  request orchestration
backend/src/routes/       API routes
backend/src/services/     media extraction, Gemini, presentation validation
backend/src/middleware/   error mapping
backend/src/utils/        URL normalization, schema validation, temp cleanup
frontend/                 static page, styles, API client and independent renderer
generated/                reserved for generated artifacts; no media is retained here
```

The renderer accepts presentation JSON only. It does not know whether lyrics came from Gemini, a fixture, or another future source. Temporary audio is placed in a unique OS temporary directory and removed in a `finally` cleanup path.

## Copyright and authorization

Use this application only for content you own or are authorized to download and process, and only where your use complies with applicable law, platform terms, and any licenses. You are responsible for having those rights. LyricSlide does not authenticate to YouTube, use account cookies, bypass DRM, defeat access controls, or circumvent paywalls. If a video is restricted or unavailable, the application reports a processing failure. Audio is sent to Google Gemini for analysis; review Google's applicable terms and data policies before processing sensitive content.

## Troubleshooting

- **Could not process this video:** verify the URL, availability, permissions, and yt-dlp version.
- **Install FFmpeg:** install FFmpeg and ensure `ffmpeg` is on the backend PATH.
- **Gemini unavailable:** check `GEMINI_API_KEY`, quota, network access, and the configured model.
- **Could not reach LyricSlide:** start the backend and verify `CORS_ORIGIN` matches the frontend origin.
- **Font unavailable:** Cairo and the display fonts load from Google Fonts; system sans-serif and Arabic fallbacks remain configured.

## Limitations

- The server currently processes videos up to 15 minutes and audio up to the configured size limit.
- Request-stage UI is indicative; backend progress events are not streamed.
- Transcript accuracy depends on audio quality, language, and Gemini model performance. Review lyrics before public use.
- Fullscreen support depends on browser permission and embedding context.
- yt-dlp and FFmpeg are external system prerequisites and are not installed by `npm install`.
