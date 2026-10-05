import 'dotenv/config';
import app from './app.js';
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`LyricSlide API listening on http://localhost:${port}`));
server.requestTimeout = 210_000;
server.headersTimeout = 215_000;
