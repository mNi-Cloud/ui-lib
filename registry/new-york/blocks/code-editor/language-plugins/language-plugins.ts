// 型をエクスポート
export type { SupportedLanguage } from './language-plugins-types';

// コア機能をエクスポート
export {
  registerLanguagePlugin,
  getLanguagePlugin,
  getValidator,
  applyMarkersToModel,
  initializeLanguagePlugins
} from './language-plugins-core';

// コアの型をエクスポート
export type { MonacoMarker, LanguagePlugin } from './language-plugins-core';

// ユーティリティ関数をエクスポート
export {
  getLanguageLabel, 
  getLanguageExtension,
  createSimplePlugin,
  codeExamples
} from './language-plugins-utils';

// 言語プラグインモジュールをインポート（自動登録）
import './yaml-plugin';
import './json-plugin';
import './typescript-plugin'; 