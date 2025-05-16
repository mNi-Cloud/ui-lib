import type { SupportedLanguage } from '@/registry/new-york/blocks/code-editor/code-editor';

export interface LanguagePlugin {
  language: SupportedLanguage;
  load: () => Promise<void>;
  configure?: (monaco: any) => void;
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

    const module = await import(`./${language}`).catch(() => null);
    
    if (module && module.default) {
      registerLanguagePlugin(module.default);
      return module.default;
    }
    
    return undefined;
  } catch (error) {
    console.error(`Error importing language plugin '${language}':`, error);
    return undefined;
  }
}
