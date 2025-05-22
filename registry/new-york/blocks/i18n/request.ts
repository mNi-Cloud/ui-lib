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

  try {
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
  } catch (err) {
    console.error(`Failed to read directory: ${dir}`, err);
    // Try alternative paths if the main one fails
  }

  return merged;
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  
  // Try multiple possible paths for messages directory
  const possiblePaths = [
    path.resolve(process.cwd(), 'messages'),
    '/app/messages',
    path.resolve(process.cwd(), '../messages')
  ];
  
  let messages = {};
  
  // Try each path until we find one that works
  for (const messagesDir of possiblePaths) {
    try {
      const exists = await fs.access(messagesDir).then(() => true).catch(() => false);
      if (exists) {
        messages = await loadAllMessages(messagesDir, locale);
        console.log(`Successfully loaded messages from: ${messagesDir}`);
        break;
      }
    } catch (err) {
      console.error(`Failed to access: ${messagesDir}`, err);
    }
  }

  return { locale, messages };
});
