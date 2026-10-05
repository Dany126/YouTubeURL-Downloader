import 'dotenv/config';
import app from './app.js';
import { checkMediaDependencies } from './services/media.service.js';
const port = Number(process.env.PORT || 3000);
await checkMediaDependencies();
const server = app.listen(port, () => console.log(`LyricSlide API listening on http://localhost:${port}`));
server.requestTimeout = 330_000;
server.headersTimeout = 335_000;
