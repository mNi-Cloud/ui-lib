import type { SupportedLanguage } from '../../code-editor';

// 言語プラグインの型定義
export interface LanguagePlugin {
  language: SupportedLanguage;
  load: () => Promise<void>;
  configure?: (monaco: any) => void;
}

// 使用可能な言語プラグインを保持するマップ
const plugins = new Map<SupportedLanguage, LanguagePlugin>();

// 言語プラグインを登録する関数
export function registerLanguagePlugin(plugin: LanguagePlugin): void {
  plugins.set(plugin.language, plugin);
}

// 特定の言語のプラグインを取得する関数
export function getLanguagePlugin(language: SupportedLanguage): LanguagePlugin | undefined {
  return plugins.get(language);
}

// すべての登録済み言語プラグインを取得する関数
export function getAllLanguagePlugins(): LanguagePlugin[] {
  return Array.from(plugins.values());
}

// 使用可能な言語のリストを取得する関数
export function getAvailableLanguages(): SupportedLanguage[] {
  return Array.from(plugins.keys());
}

// 言語プラグインを動的にインポートする関数
export async function importLanguagePlugin(language: SupportedLanguage): Promise<LanguagePlugin | undefined> {
  try {
    // すでに登録されているかチェック
    if (plugins.has(language)) {
      return plugins.get(language);
    }

    // 言語プラグインの動的インポート
    const module = await import(`./${language}`).catch(() => null);
    
    if (module && module.default) {
      // プラグインを登録
      registerLanguagePlugin(module.default);
      return module.default;
    }
    
    return undefined;
  } catch (error) {
    console.error(`言語プラグイン '${language}' のインポート中にエラーが発生しました:`, error);
    return undefined;
  }
} 