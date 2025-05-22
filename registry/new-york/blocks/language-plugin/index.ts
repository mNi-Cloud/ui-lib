import type { SupportedLanguage } from '@/registry/new-york/blocks/code-editor/code-editor';
import type { Monaco } from '@monaco-editor/react';

export interface LanguagePlugin {
  language: SupportedLanguage;
  load: () => Promise<void>;
  configure?: (monaco: Monaco) => void;
}

const plugins = new Map<SupportedLanguage, LanguagePlugin>();

export function registerLanguagePlugin(plugin: LanguagePlugin): void {
  plugins.set(plugin.language, plugin);
}

export function getLanguagePlugin(language: SupportedLanguage): LanguagePlugin | undefined {
  return plugins.get(language);
}

export function getAllLanguagePlugins(): LanguagePlugin[] {
  return Array.from(plugins.values());
}

export function getAvailableLanguages(): SupportedLanguage[] {
  return Array.from(plugins.keys());
}

export async function importLanguagePlugin(language: SupportedLanguage): Promise<LanguagePlugin | undefined> {
  try {
    if (plugins.has(language)) {
      return plugins.get(language);
    }

    let moduleImport: { default?: LanguagePlugin } | null = null;
    try {
      moduleImport = await import(`./${language}`);
    } catch {
      moduleImport = null;
    }
    
    if (moduleImport && moduleImport.default) {
      registerLanguagePlugin(moduleImport.default);
      return moduleImport.default;
    }
    
    return undefined;
  } catch (error) {
    console.error(`Error importing language plugin '${language}':`, error);
    return undefined;
  }
}
