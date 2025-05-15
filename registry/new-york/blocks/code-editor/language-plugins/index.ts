// 型をエクスポート
export type { SupportedLanguage } from './types';

// コア機能をエクスポート
export {
  registerLanguagePlugin,
  getLanguagePlugin,
  getValidator,
  applyMarkersToModel,
  initializeLanguagePlugins
} from './core';

// コアの型をエクスポート
export type { MonacoMarker, LanguagePlugin } from './core';

// ユーティリティ関数をエクスポート
export {
  getLanguageLabel, 
  getLanguageExtension,
  createSimplePlugin,
  codeExamples
} from './utils';

// 言語プラグインモジュールをインポート（自動登録）
import './yaml-plugin';
import './json-plugin';
import './typescript-plugin';