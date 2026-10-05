import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const GENERATED_DIRECTORY = fileURLToPath(new URL('../../../generated/', import.meta.url));
const GENERATED_FILENAME = /^lyricslide-\d{8}-\d{6}(?:-\d{1,3})?\.html$/;

export function generatedFilePath(filename) {
  if (typeof filename !== 'string' || !GENERATED_FILENAME.test(filename)) return null;
  return join(GENERATED_DIRECTORY, filename);
}

export { GENERATED_DIRECTORY };
