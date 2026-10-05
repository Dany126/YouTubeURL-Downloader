import { rm } from 'node:fs/promises';
export async function removeTemporaryFile(filePath) {
  if (!filePath) return;
  await rm(filePath, { recursive: true, force: true }).catch(() => {});
}
