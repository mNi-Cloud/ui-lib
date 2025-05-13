import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from './locale';
import { promises as fs } from 'fs';
import path from 'path';
import deepmerge from 'deepmerge';

async function loadAllMessages(
  dir: string,
  locale: string
): Promise<Record<string, any>> {
  let merged: Record<string, any> = {};

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const nested = await loadAllMessages(fullPath, locale);
      merged = deepmerge(merged, nested);
    } else if (entry.isFile() && entry.name === `${locale}.json`) {
      try {
        const raw = await fs.readFile(fullPath, 'utf-8');
        const json = JSON.parse(raw);
        merged = deepmerge(merged, json);
      } catch (err) {
        console.error(`Failed to load or parse: ${fullPath}`, err);
      }
    }
  }

  return merged;
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const messagesDir = path.resolve(process.cwd(), 'messages');
  const messages = await loadAllMessages(messagesDir, locale);

  return { locale, messages };
});
